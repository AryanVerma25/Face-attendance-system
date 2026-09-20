const Session = require("../models/Session");
const Class = require("../models/Class");
const Attendance = require("../models/Attendance");

const startSession = async (req, res) => {
    try {
        const { classId } = req.body;

        if (!classId) {
            return res.status(400).json({
                message: "Class ID is required"
            });
        }

        const classData = await Class.findById(classId);

        if (!classData) {
            return res.status(404).json({
                message: "Class not found"
            });
        }

        // Only the faculty who owns the class can start attendance
        if (classData.faculty.toString() !== req.user._id.toString()) {
            return res.status(403).json({
                message: "You are not authorized to start attendance for this class"
            });
        }

        // Check if this class already has an active session
        const activeSession = await Session.findOne({
            class: classId,
            status: "active"
        });

        if (activeSession) {
            return res.status(409).json({
                message: "An attendance session is already active for this class",
                session: activeSession
            });
        }

        const session = await Session.create({
            class: classId,
            faculty: req.user._id,
            status: "active"
        });

        res.status(201).json({
            message: "Attendance session started successfully",
            session
        });

    } catch (error) {
        res.status(500).json({
            message: "Server error",
            error: error.message
        });
    }
};

const closeSession = async (req, res) => {
    try {
        const { sessionId } = req.params;

        const session = await Session.findById(sessionId);

        if (!session) {
            return res.status(404).json({
                message: "Session not found"
            });
        }

        // Only the faculty who started the session can close it
        if (session.faculty.toString() !== req.user._id.toString()) {
            return res.status(403).json({
                message: "You are not authorized to close this session"
            });
        }

        if (session.status === "closed") {
            return res.status(409).json({
                message: "Session is already closed"
            });
        }

        // Find the class
        const classData = await Class.findById(session.class);

        if (!classData) {
            return res.status(404).json({
                message: "Class not found"
            });
        }

        // Get students who are already marked present
        const presentAttendance = await Attendance.find({
            session: sessionId,
            status: "present"
        }).select("student");

        const presentStudentIds = presentAttendance.map(
            (attendance) => attendance.student.toString()
        );

        // Find students who were not marked present
        const absentStudentIds = classData.students.filter(
            (studentId) =>
                !presentStudentIds.includes(studentId.toString())
        );

        // Create absent records
        if (absentStudentIds.length > 0) {
            const absentRecords = absentStudentIds.map((studentId) => ({
                session: sessionId,
                student: studentId,
                class: session.class,
                status: "absent",
                verification: {
                    faceRecognized: false,
                    livenessVerified: false,
                    confidence: 0
                }
            }));

            await Attendance.insertMany(absentRecords);
        }

        // Close the session
        session.status = "closed";
        session.endedAt = new Date();

        await session.save();

        res.status(200).json({
            message: "Attendance session closed successfully",
            session
        });

    } catch (error) {
        res.status(500).json({
            message: "Server error",
            error: error.message
        });
    }
};
const getSessionDetails = async (req, res) => {
    try {
        const { sessionId } = req.params;

        const session = await Session.findById(sessionId)
            .populate("class", "name code");

        if (!session) {
            return res.status(404).json({
                message: "Session not found"
            });
        }

        // Only allow students enrolled in this class
        if (req.user.role === "student") {
            const Student = require("../models/Student");

            const student = await Student.findOne({
                user: req.user._id
            });

            if (!student) {
                return res.status(404).json({
                    message: "Student profile not found"
                });
            }

            const Class = require("../models/Class");

            const classData = await Class.findById(session.class._id);

            if (!classData) {
                return res.status(404).json({
                    message: "Class not found"
                });
            }

            const isEnrolled = classData.students.some(
                (studentId) =>
                    studentId.toString() === student._id.toString()
            );

            if (!isEnrolled) {
                return res.status(403).json({
                    message: "You are not enrolled in this class"
                });
            }
        }

        res.status(200).json({
            message: "Session details fetched successfully",
            session
        });

    } catch (error) {
        console.error("Get session details error:", error);

        res.status(500).json({
            message: "Server error",
            error: error.message
        });
    }
};

module.exports = {
    startSession,
    closeSession,
    getSessionDetails
};