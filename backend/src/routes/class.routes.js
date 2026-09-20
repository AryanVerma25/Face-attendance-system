const express = require("express");

const {
    createClass,
    addStudentToClass,
    getClassDetails,
    getMyClasses
} = require("../controllers/class.controller");

const protect = require("../middleware/auth.middleware");
const authorize = require("../middleware/role.middleware");

const router = express.Router();

router.post(
    "/",
    protect,
    authorize("faculty"),
    createClass
);
router.post(
    "/:classId/students",
    protect,
    authorize("faculty"),
    addStudentToClass
);
router.get(
    "/my-classes",
    protect,
    authorize("student"),
    getMyClasses
);
router.get(
    "/:classId",
    protect,
    authorize("faculty"),
    getClassDetails
);

module.exports = router;