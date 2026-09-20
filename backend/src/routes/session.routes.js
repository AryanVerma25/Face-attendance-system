const express = require("express");

const {
    startSession,
    closeSession
} = require("../controllers/session.controller");

const protect = require("../middleware/auth.middleware");
const authorize = require("../middleware/role.middleware");

const router = express.Router();

router.post(
    "/",
    protect,
    authorize("faculty"),
    startSession
);

router.patch(
    "/:sessionId/close",
    protect,
    authorize("faculty"),
    closeSession
);

module.exports = router;