const axios = require("axios");

const Student = require("../models/Student");
const FaceEmbedding = require("../models/FaceEmbedding");
const Session = require("../models/Session");
const Class = require("../models/Class");

const enrollFace = async (req, res) => {
    try {
        // Find the logged-in student's profile
        const student = await Student.findOne({
            user: req.user._id
        });

        if (!student) {
            return res.status(404).json({
                message: "Student profile not found"
            });
        }

        // Face image/data will come from the frontend
        const { image } = req.body;

        if (!image) {
            return res.status(400).json({
                message: "Face image is required"
            });
        }

        /*
         * ML SERVICE
         *
         * This will be connected when the ML teammate
         * implements the FastAPI enrollment endpoint.
         *
         * Expected endpoint:
         * POST /api/v1/ml/enroll
         */

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

        // Check whether a face embedding already exists
        const existingEmbedding = await FaceEmbedding.findOne({
            student: student._id
        });

        if (existingEmbedding) {
            existingEmbedding.embedding = embedding;
            existingEmbedding.model = model || "ArcFace";

            await existingEmbedding.save();

            return res.status(200).json({
                message: "Face embedding updated successfully"
            });
        }

        // Create new face embedding
        const faceEmbedding = await FaceEmbedding.create({
            student: student._id,
            embedding,
            model: model || "ArcFace"
        });

        res.status(201).json({
            message: "Face enrolled successfully",
            faceEmbedding
        });

    } catch (error) {
        console.error("Face enrollment error:", error);

        res.status(500).json({
            message: "Face enrollment failed",
            error: error.response?.data?.message || error.message
        });
    }
};
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

        res.status(200).json({
            enrolled: !!faceEmbedding
        });

    } catch (error) {
        console.error("Face status error:", error);

        res.status(500).json({
            message: "Unable to check face enrollment status"
        });
    }
};

const verifyFace = async (req, res) => {
    try {
        const { image, sessionId } = req.body;

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

        // Find logged-in student's profile
        const student = await Student.findOne({
            user: req.user._id
        });

        if (!student) {
            return res.status(404).json({
                message: "Student profile not found"
            });
        }

        // Check face enrollment
        const faceEmbedding = await FaceEmbedding.findOne({
            student: student._id
        });

        if (!faceEmbedding) {
            return res.status(400).json({
                message: "Face is not enrolled. Please register your face first."
            });
        }

        // Check session
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

        // Check class
        const classData = await Class.findById(session.class);

        if (!classData) {
            return res.status(404).json({
                message: "Class not found"
            });
        }

        // Check whether student is enrolled in this class
        const isEnrolled = classData.students.some(
            id => id.toString() === student._id.toString()
        );

        if (!isEnrolled) {
            return res.status(403).json({
                message: "Student is not enrolled in this class"
            });
        }

        // Send current camera image + stored embedding to ML service
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

        if (!success) {
            return res.status(400).json({
                message: "Face verification failed"
            });
        }

        if (!matched) {
            return res.status(401).json({
                message: "Face does not match the enrolled student",
                similarity,
                threshold
            });
        }

        return res.status(200).json({
            message: "Face verified successfully",
            verified: true,
            studentId: student.studentId,
            similarity,
            threshold
        });

    } catch (error) {
        console.error("Face verification error:", error);

        res.status(500).json({
            message: "Face verification failed",
            error: error.response?.data?.detail ||
                   error.response?.data?.message ||
                   error.message
        });
    }
};
const verifyLiveness = async (req, res) => {
    try {
        const { images } = req.body;

        if (!images || !Array.isArray(images) || images.length < 3) {
            return res.status(400).json({
                message: "At least 3 images are required for liveness verification"
            });
        }

        const response = await axios.post(
            `${process.env.ML_SERVICE_URL}/api/v1/ml/liveness`,
            {
                images
            }
        );

        return res.status(200).json(response.data);

    } catch (error) {
        console.error(
            "LIVENESS ERROR:",
            error.response?.data || error.message
        );

        return res.status(
            error.response?.status || 500
        ).json({
            message:
                error.response?.data?.detail ||
                "Liveness verification failed"
        });
    }
};

module.exports = {
    enrollFace,
    getFaceStatus,
    verifyFace,
    verifyLiveness
};