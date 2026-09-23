const express = require("express");

const {
    enrollFace,
    getFaceStatus,
    verifyFace,
    verifyLiveness
} = require("../controllers/face.controller");

const protect = require("../middleware/auth.middleware");
const authorize = require("../middleware/role.middleware");

const router = express.Router();

router.get(
    "/status",
    protect,
    authorize("student"),
    getFaceStatus
);

router.post(
    "/enroll",
    protect,
    authorize("student"),
    enrollFace
);

router.post(
    "/verify",
    protect,
    authorize("student"),
    verifyFace
);

router.post(
    "/liveness",
    protect,
    authorize("student"),
    verifyLiveness
);

module.exports = router;