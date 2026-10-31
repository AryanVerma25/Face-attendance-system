
const express = require("express");

const {
    markAttendance,
    markAttendanceByFace,
    getSessionAttendance,
    getStudentAttendance,
    getStudentAttendanceSummary,
    getMyAttendance,
    getClassAttendanceReport,
    getClassStudentReports,
    getClassAttendanceHistory
} = require("../controllers/attendance.controller");

const protect = require("../middleware/auth.middleware");
const authorize = require("../middleware/role.middleware");

const router = express.Router();

// Faculty class reports
router.get(
    "/class/:classId/report",
    protect,
    authorize("faculty"),
    getClassAttendanceReport
);

router.get(
    "/class/:classId/students",
    protect,
    authorize("faculty"),
    getClassStudentReports
);

router.get(
    "/class/:classId/history",
    protect,
    authorize("faculty"),
    getClassAttendanceHistory
);

// Mark attendance
router.post(
    "/",
    protect,
    authorize("faculty"),
    markAttendance
);

router.post(
    "/mark",
    protect,
    authorize("student"),
    markAttendanceByFace
);

// Session attendance
router.get(
    "/session/:sessionId",
    protect,
    authorize("faculty"),
    getSessionAttendance
);

// Individual student reports
router.get(
    "/student/:studentId/summary",
    protect,
    authorize("faculty"),
    getStudentAttendanceSummary
);

router.get(
    "/student/:studentId",
    protect,
    authorize("faculty"),
    getStudentAttendance
);

// Logged-in student attendance
router.get(
    "/me",
    protect,
    authorize("student"),
    getMyAttendance
);

module.exports = router;
