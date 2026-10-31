
const Session = require("../models/Session");
const Class = require("../models/Class");
const Attendance = require("../models/Attendance");
const Student = require("../models/Student");

// ==========================================
// SCHEDULE A NEW ATTENDANCE SESSION
// ==========================================

const scheduleSession = async (req, res) => {
    try {
        const { classId, scheduledStartAt, scheduledEndAt } = req.body;

        if (!classId || !scheduledStartAt || !scheduledEndAt) {
            return res.status(400).json({
                message: "Class ID, start time and end time are required"
            });
        }

        const start = new Date(scheduledStartAt);
        const end = new Date(scheduledEndAt);

        if (
            Number.isNaN(start.getTime()) ||
            Number.isNaN(end.getTime()) ||
            start >= end
        ) {
            return res.status(400).json({
                message: "Please provide valid session dates and times"
            });
        }

        const classData = await Class.findById(classId);

        if (!classData) {
            return res.status(404).json({
                message: "Class not found"
            });
        }

        if (classData.faculty.toString() !== req.user._id.toString()) {
            return res.status(403).json({
                message: "You are not authorized to schedule this class"
            });
        }

        const activeSession = await Session.findOne({
            class: classId,
            status: "active"
        });

        if (activeSession) {
            return res.status(409).json({
                message: "An active session already exists for this class"
            });
        }

        const overlappingSession = await Session.findOne({
            class: classId,
            status: "scheduled",
            scheduledStartAt: { $lt: end },
            scheduledEndAt: { $gt: start }
        });

        if (overlappingSession) {
            return res.status(409).json({
                message: "Another scheduled session overlaps with this time"
            });
        }

        const session = await Session.create({
            class: classId,
            faculty: req.user._id,
            status: "scheduled",
            scheduledStartAt: start,
            scheduledEndAt: end,
            startedAt: null,
            endedAt: null
        });

        return res.status(201).json({
            message: "Attendance session scheduled successfully",
            session
        });

    } catch (error) {
        console.error("Schedule session error:", error);

        return res.status(500).json({
            message: "Server error",
            error: error.message
        });
    }
};


// ==========================================
// START AN IMMEDIATE ATTENDANCE SESSION
// ==========================================

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

        if (classData.faculty.toString() !== req.user._id.toString()) {
            return res.status(403).json({
                message: "You are not authorized to start attendance"
            });
        }

        const activeSession = await Session.findOne({
            class: classId,
            status: "active"
        });

        if (activeSession) {
            return res.status(409).json({
                message: "An attendance session is already active",
                session: activeSession
            });
        }

        const session = await Session.create({
            class: classId,
            faculty: req.user._id,
            status: "active",
            startedAt: new Date()
        });

        return res.status(201).json({
            message: "Attendance session started successfully",
            session
        });

    } catch (error) {
        console.error("Start session error:", error);

        return res.status(500).json({
            message: "Server error",
            error: error.message
        });
    }
};


// ==========================================
// START AN ALREADY SCHEDULED SESSION
// ==========================================

const startScheduledSession = async (req, res) => {
    try {
        const { sessionId } = req.params;

        const session = await Session.findById(sessionId);

        if (!session) {
            return res.status(404).json({
                message: "Session not found"
            });
        }

        if (session.faculty.toString() !== req.user._id.toString()) {
            return res.status(403).json({
                message: "You are not authorized to start this session"
            });
        }

        if (session.status !== "scheduled") {
            return res.status(409).json({
                message: "Only scheduled sessions can be started"
            });
        }

        const activeSession = await Session.findOne({
            class: session.class,
            status: "active"
        });

        if (activeSession) {
            return res.status(409).json({
                message: "Another session is already active for this class"
            });
        }

        session.status = "active";
        session.startedAt = new Date();

        await session.save();

        return res.status(200).json({
            message: "Scheduled attendance session started successfully",
            session
        });

    } catch (error) {
        console.error("Start scheduled session error:", error);

        return res.status(500).json({
            message: "Server error",
            error: error.message
        });
    }
};


// ==========================================
// CLOSE SESSION AND MARK REMAINING STUDENTS ABSENT
// ==========================================

const closeSession = async (req, res) => {
    try {
        const { sessionId } = req.params;

        const session = await Session.findById(sessionId);

        if (!session) {
            return res.status(404).json({
                message: "Session not found"
            });
        }

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

        if (session.status !== "active") {
            return res.status(400).json({
                message: "Only active sessions can be closed"
            });
        }

        const classData = await Class.findById(session.class);

        if (!classData) {
            return res.status(404).json({
                message: "Class not found"
            });
        }

        const presentAttendance = await Attendance.find({
            session: sessionId,
            status: "present"
        }).select("student");

        const presentStudentIds = presentAttendance.map(
            attendance => attendance.student.toString()
        );

        const absentStudentIds = classData.students.filter(
            studentId => !presentStudentIds.includes(studentId.toString())
        );

        if (absentStudentIds.length > 0) {
            const absentRecords = absentStudentIds.map(studentId => ({
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

        session.status = "closed";
        session.endedAt = new Date();

        await session.save();

        return res.status(200).json({
            message: "Attendance session closed successfully",
            session
        });

    } catch (error) {
        console.error("Close session error:", error);

        return res.status(500).json({
            message: "Server error",
            error: error.message
        });
    }
};


// ==========================================
// FETCH SESSION DETAILS
// ==========================================

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

        if (req.user.role === "student") {
            const student = await Student.findOne({
                user: req.user._id
            });

            if (!student) {
                return res.status(404).json({
                    message: "Student profile not found"
                });
            }

            const classData = await Class.findById(session.class._id);

            if (!classData) {
                return res.status(404).json({
                    message: "Class not found"
                });
            }

            const isEnrolled = classData.students.some(
                studentId => studentId.toString() === student._id.toString()
            );

            if (!isEnrolled) {
                return res.status(403).json({
                    message: "You are not enrolled in this class"
                });
            }
        }

        if (
            req.user.role === "faculty" &&
            session.faculty.toString() !== req.user._id.toString()
        ) {
            return res.status(403).json({
                message: "You are not authorized to view this session"
            });
        }

        return res.status(200).json({
            message: "Session details fetched successfully",
            session
        });

    } catch (error) {
        console.error("Get session details error:", error);

        return res.status(500).json({
            message: "Server error",
            error: error.message
        });
    }
};


// ==========================================
// FETCH ALL SESSIONS OF LOGGED-IN FACULTY
// ==========================================

const getMySessions = async (req, res) => {
    try {
        const sessions = await Session.find({
            faculty: req.user._id
        })
            .populate("class", "name code students")
            .sort({ createdAt: -1 });

        const sessionsWithStats = await Promise.all(
            sessions.map(async (session) => {

                const attendance = await Attendance.aggregate([
                    {
                        $match: {
                            session: session._id
                        }
                    },
                    {
                        $group: {
                            _id: "$status",
                            count: { $sum: 1 }
                        }
                    }
                ]);

                const present = attendance.find(
                    item => item._id === "present"
                )?.count || 0;

                const absent = attendance.find(
                    item => item._id === "absent"
                )?.count || 0;

                return {
                    ...session.toObject(),

                    attendanceStats: {
                        present,
                        absent,
                        total: present + absent,
                        enrolledStudents: session.class?.students?.length || 0
                    }
                };
            })
        );

        return res.status(200).json({
            message: "Faculty sessions fetched successfully",
            sessions: sessionsWithStats
        });

    } catch (error) {
        console.error("Get faculty sessions error:", error);

        return res.status(500).json({
            message: "Failed to fetch faculty sessions"
        });
    }
};


// ==========================================
// EXPORT CONTROLLERS
// ==========================================

module.exports = {
    scheduleSession,
    startSession,
    startScheduledSession,
    closeSession,
    getSessionDetails,
    getMySessions
};
