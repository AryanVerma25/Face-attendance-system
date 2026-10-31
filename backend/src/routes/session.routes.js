
const express = require("express");

const {
    scheduleSession,
    startSession,
    startScheduledSession,
    closeSession,
    getSessionDetails,
    getMySessions
} = require("../controllers/session.controller");

const protect = require("../middleware/auth.middleware");
const authorize = require("../middleware/role.middleware");

const router = express.Router();

// Get all sessions belonging to logged-in faculty
router.get(
    "/my-sessions",
    protect,
    authorize("faculty"),
    getMySessions
);

// Schedule a new attendance session
router.post(
    "/schedule",
    protect,
    authorize("faculty"),
    scheduleSession
);

// Start an immediate attendance session
router.post(
    "/",
    protect,
    authorize("faculty"),
    startSession
);

// Start an already scheduled session
router.patch(
    "/:sessionId/start",
    protect,
    authorize("faculty"),
    startScheduledSession
);

// Fetch session details
router.get(
    "/:sessionId",
    protect,
    authorize("student", "faculty"),
    getSessionDetails
);

// Close an active session
router.patch(
    "/:sessionId/close",
    protect,
    authorize("faculty"),
    closeSession
);

module.exports = router;
