const express = require("express");

const {
    markAttendance,
    getSessionAttendance,
    getStudentAttendance,
    getStudentAttendanceSummary,
    getMyAttendance
} = require("../controllers/attendance.controller");

const protect = require("../middleware/auth.middleware");
const authorize = require("../middleware/role.middleware");

const router = express.Router();

router.post(
    "/",
    protect,
    authorize("faculty"),
    markAttendance
);
router.get(
    "/session/:sessionId",
    protect,
    authorize("faculty"),
    getSessionAttendance
);
router.get(
    "/student/:studentId",
    protect,
    authorize("faculty"),
    getStudentAttendance
);
router.get(
    "/student/:studentId/summary",
    protect,
    authorize("faculty"),
    getStudentAttendanceSummary
);
router.get(
    "/me",
    protect,
    authorize("student"),
    getMyAttendance
);

module.exports = router;