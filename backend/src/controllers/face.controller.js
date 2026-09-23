const axios = require("axios");

const Student = require("../models/Student");
const FaceEmbedding = require("../models/FaceEmbedding");
const Session = require("../models/Session");
const Class = require("../models/Class");
const verificationStore = require("../services/verificationStore");


// ======================================================
// ENROLL FACE
// ======================================================

const enrollFace = async (req, res) => {
    try {
        // Find logged-in student's profile
        const student = await Student.findOne({
            user: req.user._id
        });

        if (!student) {
            return res.status(404).json({
                message: "Student profile not found"
            });
        }

        const { image } = req.body;

        if (!image) {
            return res.status(400).json({
                message: "Face image is required"
            });
        }

        // Send image to ML service
        const mlResponse = await axios.post(
            `${process.env.ML_SERVICE_URL}/api/v1/ml/enroll`,
            {
                image
            }
        );

        const {
            success,
            embedding,
            model
        } = mlResponse.data;

        if (!success || !embedding) {
            return res.status(400).json({
                message: "Face enrollment failed"
            });
        }

        // Check whether face embedding already exists
        const existingEmbedding = await FaceEmbedding.findOne({
            student: student._id
        });

        // Update existing embedding
        if (existingEmbedding) {

            existingEmbedding.embedding = embedding;
            existingEmbedding.model = model || "ArcFace";

            await existingEmbedding.save();

            return res.status(200).json({
                message: "Face embedding updated successfully"
            });
        }

        // Create new embedding
        const faceEmbedding = await FaceEmbedding.create({
            student: student._id,
            embedding,
            model: model || "ArcFace"
        });

        return res.status(201).json({
            message: "Face enrolled successfully",
            faceEmbedding
        });

    } catch (error) {
        console.error("Face enrollment error:", error);

        return res.status(500).json({
            message: "Face enrollment failed",
            error:
                error.response?.data?.message ||
                error.message
        });
    }
};


// ======================================================
// GET FACE STATUS
// ======================================================

const getFaceStatus = async (req, res) => {
    try {
        const student = await Student.findOne({
            user: req.user._id
        });

        if (!student) {
            return res.status(404).json({
                message: "Student profile not found"
            });
        }

        const faceEmbedding = await FaceEmbedding.findOne({
            student: student._id
        });

        return res.status(200).json({
            enrolled: !!faceEmbedding
        });

    } catch (error) {
        console.error("Face status error:", error);

        return res.status(500).json({
            message: "Unable to check face enrollment status"
        });
    }
};


// ======================================================
// VERIFY FACE
// ======================================================

const verifyFace = async (req, res) => {
    try {

        const { image, sessionId } = req.body;


        // --------------------------------------------------
        // 1. Validate request
        // --------------------------------------------------

        if (!image) {
            return res.status(400).json({
                message: "Face image is required"
            });
        }

        if (!sessionId) {
            return res.status(400).json({
                message: "Session ID is required"
            });
        }


        // --------------------------------------------------
        // 2. Find logged-in student
        // --------------------------------------------------

        const student = await Student.findOne({
            user: req.user._id
        });

        if (!student) {
            return res.status(404).json({
                message: "Student profile not found"
            });
        }


        // --------------------------------------------------
        // 3. Check face enrollment
        // --------------------------------------------------

        const faceEmbedding = await FaceEmbedding.findOne({
            student: student._id
        });

        if (!faceEmbedding) {
            return res.status(400).json({
                message:
                    "Face is not enrolled. Please register your face first."
            });
        }


        // --------------------------------------------------
        // 4. Check attendance session
        // --------------------------------------------------

        const session = await Session.findById(sessionId);

        if (!session) {
            return res.status(404).json({
                message: "Session not found"
            });
        }

        if (session.status !== "active") {
            return res.status(400).json({
                message: "Attendance session is not active"
            });
        }


        // --------------------------------------------------
        // 5. Check class
        // --------------------------------------------------

        const classData = await Class.findById(session.class);

        if (!classData) {
            return res.status(404).json({
                message: "Class not found"
            });
        }


        // --------------------------------------------------
        // 6. Check student enrollment in class
        // --------------------------------------------------

        const isEnrolled = classData.students.some(
            id =>
                id.toString() ===
                student._id.toString()
        );

        if (!isEnrolled) {
            return res.status(403).json({
                message:
                    "Student is not enrolled in this class"
            });
        }


        // --------------------------------------------------
        // 7. Get liveness verification
        // --------------------------------------------------

        const livenessKey =
            `liveness_${student._id}`;

        const livenessVerification =
            verificationStore.get(livenessKey);


        // Liveness must be completed first
        if (!livenessVerification) {
            return res.status(400).json({
                message:
                    "Liveness verification has not been completed"
            });
        }


        // --------------------------------------------------
        // 8. Check liveness expiry
        // --------------------------------------------------

        const livenessAge =
            Date.now() -
            livenessVerification.createdAt;

        const verificationExpiry =
            2 * 60 * 1000; // 2 minutes


        if (livenessAge > verificationExpiry) {

            verificationStore.delete(
                livenessKey
            );

            return res.status(400).json({
                message:
                    "Liveness verification expired. Please try again."
            });
        }


        // --------------------------------------------------
        // 9. Check liveness result
        // --------------------------------------------------

        if (
            livenessVerification.livenessVerified !== true
        ) {
            return res.status(400).json({
                message:
                    "Liveness verification failed"
            });
        }


        // --------------------------------------------------
        // 10. Send face to ML service
        // --------------------------------------------------

        const mlResponse = await axios.post(
            `${process.env.ML_SERVICE_URL}/api/v1/ml/verify`,
            {
                image,
                embedding: faceEmbedding.embedding
            }
        );


        const {
            success,
            matched,
            similarity,
            threshold
        } = mlResponse.data;


        // --------------------------------------------------
        // 11. Check ML response
        // --------------------------------------------------

        if (!success) {
            return res.status(400).json({
                message:
                    "Face verification failed"
            });
        }


        // --------------------------------------------------
        // 12. Check face match
        // --------------------------------------------------

        if (!matched) {
            return res.status(401).json({
                message:
                    "Face does not match the enrolled student",

                similarity,
                threshold
            });
        }


        // --------------------------------------------------
        // 13. Store final verification
        // --------------------------------------------------

        const verificationKey =
            `${student._id}_${sessionId}`;


        const finalVerification = {
            livenessVerified: true,
            faceRecognized: true,
            confidence: similarity,
            createdAt: Date.now()
        };


        verificationStore.set(
            verificationKey,
            finalVerification
        );


        // --------------------------------------------------
        // 14. Delete temporary liveness verification
        // --------------------------------------------------

        verificationStore.delete(
            livenessKey
        );


        // --------------------------------------------------
        // 15. Return success
        // --------------------------------------------------

        return res.status(200).json({
            message:
                "Face verified successfully",

            verified: true,

            studentId:
                student.studentId,

            similarity,

            threshold
        });

    } catch (error) {

        console.error(
            "Face verification error:",
            error
        );

        return res.status(500).json({
            message:
                "Face verification failed",

            error:
                error.response?.data?.detail ||
                error.response?.data?.message ||
                error.message
        });
    }
};


// ======================================================
// VERIFY LIVENESS
// ======================================================

const verifyLiveness = async (req, res) => {
    try {

        const { images } = req.body;


        // --------------------------------------------------
        // 1. Validate images
        // --------------------------------------------------

        if (
            !images ||
            !Array.isArray(images) ||
            images.length < 3
        ) {
            return res.status(400).json({
                message:
                    "At least 3 images are required for liveness verification"
            });
        }


        // --------------------------------------------------
        // 2. Find logged-in student
        // --------------------------------------------------

        const student = await Student.findOne({
            user: req.user._id
        });

        if (!student) {
            return res.status(404).json({
                message:
                    "Student profile not found"
            });
        }


        // --------------------------------------------------
        // 3. Send frames to ML service
        // --------------------------------------------------

        const response = await axios.post(
            `${process.env.ML_SERVICE_URL}/api/v1/ml/liveness`,
            {
                images
            }
        );


        const result = response.data;


        // --------------------------------------------------
        // 4. Log ML result
        // --------------------------------------------------


        // --------------------------------------------------
        // 5. Store liveness result temporarily
        // --------------------------------------------------

        verificationStore.set(
            `liveness_${student._id}`,
            {
                livenessVerified:
                    result.liveness === true,

                createdAt:
                    Date.now()
            }
        );


        // --------------------------------------------------
        // 6. Return ML result to frontend
        // --------------------------------------------------

        return res.status(200).json(result);

    } catch (error) {

        console.error(
            "LIVENESS ERROR:",
            error.response?.data ||
            error.message
        );

        return res.status(
            error.response?.status || 500
        ).json({
            message:
                error.response?.data?.detail ||
                error.response?.data?.message ||
                "Liveness verification failed"
        });
    }
};


// ======================================================
// EXPORTS
// ======================================================

module.exports = {
    enrollFace,
    getFaceStatus,
    verifyFace,
    verifyLiveness
};