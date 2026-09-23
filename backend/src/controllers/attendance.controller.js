const axios = require("axios");

const Attendance = require("../models/Attendance");
const Session = require("../models/Session");
const Student = require("../models/Student");
const Class = require("../models/Class");
const FaceEmbedding = require("../models/FaceEmbedding");
const verificationStore = require("../services/verificationStore");

const markAttendance = async (req, res) => {
    try {
        const { sessionId, image } = req.body;

        if (!sessionId || !image) {
            return res.status(400).json({
                message: "Session ID and face image are required"
            });
        }

        // 1. Find logged-in student's profile
        const student = await Student.findOne({
            user: req.user._id
        });

        if (!student) {
            return res.status(404).json({
                message: "Student profile not found"
            });
        }

        // 2. Find the session
        const session = await Session.findById(sessionId);

        if (!session) {
            return res.status(404).json({
                message: "Session not found"
            });
        }

        // 3. Session must be active
        if (session.status !== "active") {
            return res.status(400).json({
                message: "Attendance session is not active"
            });
        }

        // 4. Check class
        const Class = require("../models/Class");

        const classData = await Class.findById(session.class);

        if (!classData) {
            return res.status(404).json({
                message: "Class not found"
            });
        }

        // 5. Check student enrollment
        const isEnrolled = classData.students.some(
            (id) => id.toString() === student._id.toString()
        );

        if (!isEnrolled) {
            return res.status(403).json({
                message: "Student is not enrolled in this class"
            });
        }

        // 6. Get verification result created by
        //    /face/liveness and /face/verify
        const verificationKey = `${student._id}_${sessionId}`;

        const verification =
            verificationStore.get(verificationKey);

        if (!verification) {
            return res.status(400).json({
                message: "Face verification has not been completed"
            });
        }

        // 7. Verification must be recent
        const verificationAge =
            Date.now() - verification.createdAt;

        const verificationExpiry = 2 * 60 * 1000; // 2 minutes

        if (verificationAge > verificationExpiry) {
            verificationStore.delete(verificationKey);

            return res.status(400).json({
                message: "Face verification expired. Please try again."
            });
        }

        // 8. Face must be recognized
        if (!verification.faceRecognized) {
            return res.status(400).json({
                message: "Face could not be recognized"
            });
        }

        // 9. Liveness must be verified
        if (!verification.livenessVerified) {
            return res.status(400).json({
                message: "Liveness verification failed"
            });
        }

        // 10. Prevent duplicate attendance
        const existingAttendance = await Attendance.findOne({
            session: sessionId,
            student: student._id
        });

        if (existingAttendance) {
            return res.status(409).json({
                message: "Attendance already marked for this student"
            });
        }

        // 11. Create attendance record
        const attendance = await Attendance.create({
            session: sessionId,
            student: student._id,
            class: session.class,
            status: "present",
            verification: {
                faceRecognized: verification.faceRecognized,
                livenessVerified: verification.livenessVerified,
                confidence: verification.confidence
            }
        });

        // 12. Remove temporary verification data
        verificationStore.delete(verificationKey);

        return res.status(201).json({
            message: "Attendance marked successfully",
            attendance
        });

    } catch (error) {
        console.error("Mark attendance error:", error);

        return res.status(500).json({
            message: "Server error",
            error: error.message
        });
    }
};
const getSessionAttendance = async (req, res) => {
    try {
        const { sessionId } = req.params;

        // 1. Find the session
        const session = await Session.findById(sessionId);

        if (!session) {
            return res.status(404).json({
                message: "Session not found"
            });
        }

        // 2. Only the faculty who owns the session can view it
        if (session.faculty.toString() !== req.user._id.toString()) {
            return res.status(403).json({
                message: "You are not authorized to view this session"
            });
        }

        // 3. Get all attendance records for this session
        const attendance = await Attendance.find({
            session: sessionId
        })
            .populate(
                "student",
                "studentId enrollmentNumber department semester"
            )
            .sort({ createdAt: 1 });

        res.status(200).json({
            message: "Session attendance fetched successfully",
            session: {
                id: session._id,
                class: session.class,
                status: session.status,
                startedAt: session.startedAt,
                endedAt: session.endedAt
            },
            attendance
        });

    } catch (error) {
        res.status(500).json({
            message: "Server error",
            error: error.message
        });
    }
};

const getStudentAttendance = async (req, res) => {
    try {
        const { studentId } = req.params;

        // 1. Find the student
        const student = await Student.findOne({ studentId });

        if (!student) {
            return res.status(404).json({
                message: "Student not found"
            });
        }

        // 2. Get all attendance records for this student
        const attendance = await Attendance.find({
            student: student._id
        })
            .populate("class", "name code")
            .populate("session", "status startedAt endedAt")
            .sort({ date: -1 });

        res.status(200).json({
            message: "Student attendance fetched successfully",
            student: {
                id: student._id,
                studentId: student.studentId,
                enrollmentNumber: student.enrollmentNumber,
                department: student.department,
                semester: student.semester
            },
            attendance
        });

    } catch (error) {
        res.status(500).json({
            message: "Server error",
            error: error.message
        });
    }
};
const getStudentAttendanceSummary = async (req, res) => {
    try {
        const { studentId } = req.params;

        // Find student
        const student = await Student.findOne({ studentId });

        if (!student) {
            return res.status(404).json({
                message: "Student not found"
            });
        }

        // Get all attendance records
        const attendance = await Attendance.find({
            student: student._id
        });

        const totalSessions = attendance.length;

        const presentCount = attendance.filter(
            (record) => record.status === "present"
        ).length;

        const absentCount = attendance.filter(
            (record) => record.status === "absent"
        ).length;

        const attendancePercentage =
            totalSessions === 0
                ? 0
                : Number(((presentCount / totalSessions) * 100).toFixed(2));

        res.status(200).json({
            message: "Student attendance summary fetched successfully",

            student: {
                studentId: student.studentId,
                enrollmentNumber: student.enrollmentNumber,
                department: student.department,
                semester: student.semester
            },

            summary: {
                totalSessions,
                present: presentCount,
                absent: absentCount,
                attendancePercentage
            }
        });

    } catch (error) {
        res.status(500).json({
            message: "Server error",
            error: error.message
        });
    }
};

const getMyAttendance = async (req, res) => {
    try {
        // Find the student profile linked to the logged-in user
        const student = await Student.findOne({
            user: req.user._id
        });

        if (!student) {
            return res.status(404).json({
                message: "Student profile not found"
            });
        }

        // Get only this student's attendance
        const attendance = await Attendance.find({
            student: student._id
        })
            .populate("class", "name code")
            .populate("session", "status startedAt endedAt")
            .sort({ date: -1 });

        res.status(200).json({
            message: "My attendance fetched successfully",
            student: {
                studentId: student.studentId,
                enrollmentNumber: student.enrollmentNumber,
                department: student.department,
                semester: student.semester
            },
            attendance
        });

    } catch (error) {
        res.status(500).json({
            message: "Server error",
            error: error.message
        });
    }
};
const markAttendanceByFace = async (req, res) => {
    try {
        const { sessionId, image } = req.body;

        // -----------------------------
        // 1. Validate request
        // -----------------------------

        if (!sessionId) {
            return res.status(400).json({
                message: "Session ID is required"
            });
        }

        if (!image) {
            return res.status(400).json({
                message: "Face image is required"
            });
        }


        // -----------------------------
        // 2. Find logged-in student
        // -----------------------------

        const student = await Student.findOne({
            user: req.user._id
        });

        if (!student) {
            return res.status(404).json({
                message: "Student profile not found"
            });
        }


        // -----------------------------
        // 3. Check session
        // -----------------------------

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


        // -----------------------------
        // 4. Check class
        // -----------------------------

        const classData = await Class.findById(
            session.class
        );

        if (!classData) {
            return res.status(404).json({
                message: "Class not found"
            });
        }


        // -----------------------------
        // 5. Check enrollment
        // -----------------------------

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


        // -----------------------------
        // 6. Check face enrollment
        // -----------------------------

        const faceEmbedding =
            await FaceEmbedding.findOne({
                student: student._id
            });

        if (!faceEmbedding) {
            return res.status(400).json({
                message:
                    "Face is not enrolled. Please register your face first."
            });
        }


        // -----------------------------
        // 7. Check duplicate attendance
        // -----------------------------

        const existingAttendance =
            await Attendance.findOne({
                session: sessionId,
                student: student._id
            });

        if (existingAttendance) {
            return res.status(409).json({
                message:
                    "Attendance already marked for this student"
            });
        }


        // -----------------------------
        // 8. Send image to ML service
        // -----------------------------

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


        // -----------------------------
        // 9. Check ML result
        // -----------------------------

        if (!success) {
            return res.status(400).json({
                message:
                    "Face verification failed"
            });
        }

        if (!matched) {
            return res.status(401).json({
                message:
                    "Face does not match the enrolled student",
                similarity,
                threshold
            });
        }


        // -----------------------------
        // 10. Create attendance
        // -----------------------------

        const attendance =
            await Attendance.create({
                session: sessionId,
                student: student._id,
                class: session.class,
                status: "present",

                verification: {
                    faceRecognized: true,
                    livenessVerified: true,
                    confidence: similarity
                }
            });


        // -----------------------------
        // 11. Success response
        // -----------------------------

        return res.status(201).json({
            message:
                "Attendance marked successfully",
            attendance,
            verification: {
                faceRecognized: true,
                similarity,
                threshold
            }
        });

    } catch (error) {

        console.error(
            "Face attendance error:",
            error
        );

        return res.status(500).json({
            message:
                "Unable to mark attendance",
            error:
                error.response?.data?.detail ||
                error.response?.data?.message ||
                error.message
        });
    }
};

module.exports = {
    markAttendance,
    markAttendanceByFace,
    getSessionAttendance,
    getStudentAttendance,
    getStudentAttendanceSummary,
    getMyAttendance
};