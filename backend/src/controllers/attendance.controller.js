
const axios = require("axios");

const Attendance = require("../models/Attendance");
const Session = require("../models/Session");
const Student = require("../models/Student");
const Class = require("../models/Class");
const FaceEmbedding = require("../models/FaceEmbedding");
const verificationStore = require("../services/verificationStore");

// =====================================================
// HELPER: BUILD CONSISTENT SESSION DATE FILTER
// =====================================================

const buildSessionFilter = (classId, startDate, endDate) => {
    const filter = {
        class: classId,
        startedAt: { $ne: null }
    };

    if (startDate) {
        if (!/^\d{4}-\d{2}-\d{2}$/.test(startDate)) {
            return { error: "Invalid start date. Use YYYY-MM-DD." };
        }

        const start = new Date(`${startDate}T00:00:00.000Z`);

        if (
            isNaN(start.getTime()) ||
            start.toISOString().slice(0, 10) !== startDate
        ) {
            return { error: "Invalid start date" };
        }

        filter.startedAt.$gte = start;
    }

    if (endDate) {
        if (!/^\d{4}-\d{2}-\d{2}$/.test(endDate)) {
            return { error: "Invalid end date. Use YYYY-MM-DD." };
        }

        const end = new Date(`${endDate}T00:00:00.000Z`);

        if (
            isNaN(end.getTime()) ||
            end.toISOString().slice(0, 10) !== endDate
        ) {
            return { error: "Invalid end date" };
        }

        // Exclusive upper boundary: midnight after the selected end date.
        end.setUTCDate(end.getUTCDate() + 1);
        filter.startedAt.$lt = end;
    }

    if (startDate && endDate && startDate > endDate) {
        return {
            error: "Start date cannot be after end date"
        };
    }

    return { filter };
};


// =====================================================
// 1. MARK ATTENDANCE USING EXISTING VERIFICATION
// =====================================================

const markAttendance = async (req, res) => {
    try {
        const { sessionId, image } = req.body;

        if (!sessionId || !image) {
            return res.status(400).json({
                message: "Session ID and face image are required"
            });
        }

        const student = await Student.findOne({
            user: req.user._id
        });

        if (!student) {
            return res.status(404).json({
                message: "Student profile not found"
            });
        }

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

        const classData = await Class.findById(session.class);

        if (!classData) {
            return res.status(404).json({
                message: "Class not found"
            });
        }

        const isEnrolled = classData.students.some(
            id => id.toString() === student._id.toString()
        );

        if (!isEnrolled) {
            return res.status(403).json({
                message: "Student is not enrolled in this class"
            });
        }

        const verificationKey = `${student._id}_${sessionId}`;

        const verification = verificationStore.get(verificationKey);

        if (!verification) {
            return res.status(400).json({
                message: "Face verification has not been completed"
            });
        }

        const verificationAge = Date.now() - verification.createdAt;
        const verificationExpiry = 2 * 60 * 1000;

        if (verificationAge > verificationExpiry) {
            verificationStore.delete(verificationKey);

            return res.status(400).json({
                message: "Face verification expired. Please try again."
            });
        }

        if (!verification.faceRecognized) {
            return res.status(400).json({
                message: "Face could not be recognized"
            });
        }

        if (!verification.livenessVerified) {
            return res.status(400).json({
                message: "Liveness verification failed"
            });
        }

        const existingAttendance = await Attendance.findOne({
            session: sessionId,
            student: student._id
        });

        if (existingAttendance) {
            return res.status(409).json({
                message: "Attendance already marked for this student"
            });
        }

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


// =====================================================
// 2. GET ATTENDANCE FOR A PARTICULAR SESSION
// =====================================================

const getSessionAttendance = async (req, res) => {
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
                message: "You are not authorized to view this session"
            });
        }

        const attendance = await Attendance.find({
            session: sessionId
        })
            .populate(
                "student",
                "studentId enrollmentNumber department semester"
            )
            .sort({ createdAt: 1 });

        return res.status(200).json({
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
        console.error("Session attendance error:", error);

        return res.status(500).json({
            message: "Server error",
            error: error.message
        });
    }
};


// =====================================================
// 3. GET ATTENDANCE HISTORY OF A STUDENT
// =====================================================

const getStudentAttendance = async (req, res) => {
    try {
        const { studentId } = req.params;

        const student = await Student.findOne({ studentId });

        if (!student) {
            return res.status(404).json({
                message: "Student not found"
            });
        }

        const attendance = await Attendance.find({
            student: student._id
        })
            .populate("class", "name code")
            .populate("session", "status startedAt endedAt")
            .sort({ date: -1 });

        return res.status(200).json({
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
        console.error("Student attendance error:", error);

        return res.status(500).json({
            message: "Server error",
            error: error.message
        });
    }
};


// =====================================================
// 4. GET STUDENT ATTENDANCE SUMMARY
// =====================================================

const getStudentAttendanceSummary = async (req, res) => {
    try {
        const { studentId } = req.params;

        const student = await Student.findOne({ studentId });

        if (!student) {
            return res.status(404).json({
                message: "Student not found"
            });
        }

        const attendance = await Attendance.find({
            student: student._id
        });

        const totalSessions = attendance.length;

        const presentCount = attendance.filter(
            record => record.status === "present"
        ).length;

        const absentCount = attendance.filter(
            record => record.status === "absent"
        ).length;

        const attendancePercentage = totalSessions === 0
            ? 0
            : Number(((presentCount / totalSessions) * 100).toFixed(2));

        return res.status(200).json({
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
        console.error("Student summary error:", error);

        return res.status(500).json({
            message: "Server error",
            error: error.message
        });
    }
};


// =====================================================
// 5. GET LOGGED-IN STUDENT ATTENDANCE
// =====================================================

const getMyAttendance = async (req, res) => {
    try {
        const student = await Student.findOne({
            user: req.user._id
        });

        if (!student) {
            return res.status(404).json({
                message: "Student profile not found"
            });
        }

        const attendance = await Attendance.find({
            student: student._id
        })
            .populate("class", "name code")
            .populate("session", "status startedAt endedAt")
            .sort({ date: -1 });

        return res.status(200).json({
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
        console.error("My attendance error:", error);

        return res.status(500).json({
            message: "Server error",
            error: error.message
        });
    }
};


// =====================================================
// 6. MARK ATTENDANCE USING FACE RECOGNITION
// =====================================================

const markAttendanceByFace = async (req, res) => {
    try {
        const { sessionId, image } = req.body;

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

        const student = await Student.findOne({
            user: req.user._id
        });

        if (!student) {
            return res.status(404).json({
                message: "Student profile not found"
            });
        }

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

        const classData = await Class.findById(session.class);

        if (!classData) {
            return res.status(404).json({
                message: "Class not found"
            });
        }

        const isEnrolled = classData.students.some(
            id => id.toString() === student._id.toString()
        );

        if (!isEnrolled) {
            return res.status(403).json({
                message: "Student is not enrolled in this class"
            });
        }

        const faceEmbedding = await FaceEmbedding.findOne({
            student: student._id
        });

        if (!faceEmbedding) {
            return res.status(400).json({
                message: "Face is not enrolled. Please register your face first."
            });
        }

        const existingAttendance = await Attendance.findOne({
            session: sessionId,
            student: student._id
        });

        if (existingAttendance) {
            return res.status(409).json({
                message: "Attendance already marked for this student"
            });
        }

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

        const attendance = await Attendance.create({
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

        return res.status(201).json({
            message: "Attendance marked successfully",
            attendance,
            verification: {
                faceRecognized: true,
                similarity,
                threshold
            }
        });

    } catch (error) {
        console.error("Face attendance error:", error);

        return res.status(500).json({
            message: "Unable to mark attendance",
            error:
                error.response?.data?.detail ||
                error.response?.data?.message ||
                error.message
        });
    }
};


// =====================================================
// 7. CLASS-WISE ATTENDANCE REPORT
// =====================================================

const getClassAttendanceReport = async (req, res) => {
    try {
        const { classId } = req.params;
        const { startDate, endDate } = req.query;

        const classData = await Class.findOne({
            _id: classId,
            faculty: req.user._id
        }).populate(
            "students",
            "studentId enrollmentNumber department semester"
        );

        if (!classData) {
            return res.status(404).json({
                message: "Class not found or unauthorized"
            });
        }

        const result = buildSessionFilter(
            classId,
            startDate,
            endDate
        );

        if (result.error) {
            return res.status(400).json({
                message: result.error
            });
        }

        // Includes started active and closed sessions.
        // Excludes sessions that have not started.
        const sessions = await Session.find(result.filter)
            .sort({ startedAt: -1 });

        const sessionIds = sessions.map(session => session._id);

        const attendance = await Attendance.find({
            class: classId,
            session: { $in: sessionIds }
        }).populate(
            "student",
            "studentId enrollmentNumber department semester"
        );

        const present = attendance.filter(
            record => record.status === "present"
        ).length;

        const absent = attendance.filter(
            record => record.status === "absent"
        ).length;

        const closedSessions = sessions.filter(
            session => session.status === "closed"
        ).length;

        // Each started session contributes one opportunity
        // for every enrolled student, including active sessions.
        const totalPossible =
            sessions.length * classData.students.length;

        const attendancePercentage = totalPossible === 0
            ? 0
            : Number(((present / totalPossible) * 100).toFixed(2));

        return res.status(200).json({
            message: "Class attendance report fetched successfully",

            class: {
                id: classData._id,
                name: classData.name,
                code: classData.code
            },

            summary: {
                totalStudents: classData.students.length,
                totalSessions: sessions.length,
                closedSessions,
                present,
                absent,
                totalPossible,
                attendancePercentage
            },

            sessions,
            attendance
        });

    } catch (error) {
        console.error("Class report error:", error);

        return res.status(500).json({
            message: "Server error",
            error: error.message
        });
    }
};


// =====================================================
// 8. STUDENT-WISE REPORT FOR A CLASS
// =====================================================

const getClassStudentReports = async (req, res) => {
    try {
        const { classId } = req.params;
        const { startDate, endDate } = req.query;

        const classData = await Class.findOne({
            _id: classId,
            faculty: req.user._id
        }).populate(
            "students",
            "studentId enrollmentNumber department semester"
        );

        if (!classData) {
            return res.status(404).json({
                message: "Class not found or unauthorized"
            });
        }

        // Use exactly the same session/date filter as class summary.
        const result = buildSessionFilter(
            classId,
            startDate,
            endDate
        );

        if (result.error) {
            return res.status(400).json({
                message: result.error
            });
        }

        const sessions = await Session.find(result.filter)
            .sort({ startedAt: -1 });

        const sessionIds = sessions.map(session => session._id);

        const attendance = await Attendance.find({
            class: classId,
            session: { $in: sessionIds }
        });

        const students = classData.students.map(student => {
            const records = attendance.filter(
                record =>
                    record.student.toString() === student._id.toString()
            );

            const present = records.filter(
                record => record.status === "present"
            ).length;

            const absent = records.filter(
                record => record.status === "absent"
            ).length;

            const percentage = sessions.length === 0
                ? 0
                : Number(((present / sessions.length) * 100).toFixed(2));

            return {
                studentId: student.studentId,
                enrollmentNumber: student.enrollmentNumber,
                department: student.department,
                semester: student.semester,
                present,
                absent,
                totalSessions: sessions.length,
                attendancePercentage: percentage
            };
        });

        return res.status(200).json({
            message: "Student reports fetched successfully",

            class: {
                id: classData._id,
                name: classData.name,
                code: classData.code
            },

            students
        });

    } catch (error) {
        console.error("Student reports error:", error);

        return res.status(500).json({
            message: "Server error",
            error: error.message
        });
    }
};


// =====================================================
// 9. CLASS-WISE ATTENDANCE HISTORY
// =====================================================

const getClassAttendanceHistory = async (req, res) => {
    try {
        const { classId } = req.params;
        const { startDate, endDate } = req.query;

        const classData = await Class.findOne({
            _id: classId,
            faculty: req.user._id
        });

        if (!classData) {
            return res.status(404).json({
                message: "Class not found or unauthorized"
            });
        }

        const result = buildSessionFilter(
            classId,
            startDate,
            endDate
        );

        if (result.error) {
            return res.status(400).json({
                message: result.error
            });
        }

        const sessions = await Session.find(result.filter)
            .sort({ startedAt: -1 });

        const history = await Promise.all(
            sessions.map(async session => {
                const attendance = await Attendance.find({
                    session: session._id
                }).populate(
                    "student",
                    "studentId enrollmentNumber department semester"
                );

                return {
                    sessionId: session._id,
                    status: session.status,
                    startedAt: session.startedAt,
                    endedAt: session.endedAt,
                    attendance
                };
            })
        );

        return res.status(200).json({
            message: "Attendance history fetched successfully",

            class: {
                id: classData._id,
                name: classData.name,
                code: classData.code
            },

            history
        });

    } catch (error) {
        console.error("Attendance history error:", error);

        return res.status(500).json({
            message: "Server error",
            error: error.message
        });
    }
};


// =====================================================
// 10. EXPORT ALL CONTROLLERS
// =====================================================

module.exports = {
    markAttendance,
    markAttendanceByFace,
    getSessionAttendance,
    getStudentAttendance,
    getStudentAttendanceSummary,
    getMyAttendance,
    getClassAttendanceReport,
    getClassStudentReports,
    getClassAttendanceHistory
};
