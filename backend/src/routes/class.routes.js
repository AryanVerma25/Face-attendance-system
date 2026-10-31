
const express = require("express");

const {
    createClass,
    getMyClasses,
    getMyEnrolledClasses,
    getClassDetails,
    addStudentToClass
} = require("../controllers/class.controller");

const protect = require("../middleware/auth.middleware");
const authorize = require("../middleware/role.middleware");

const router = express.Router();

// ==========================================
// CREATE CLASS - FACULTY
// ==========================================

router.post(
    "/",
    protect,
    authorize("faculty"),
    createClass
);

// ==========================================
// GET FACULTY'S CLASSES
// ==========================================

router.get(
    "/my-classes",
    protect,
    authorize("faculty"),
    getMyClasses
);

// ==========================================
// GET STUDENT'S ENROLLED CLASSES
// ==========================================

router.get(
    "/my-enrolled-classes",
    protect,
    authorize("student"),
    getMyEnrolledClasses
);

// ==========================================
// ADD STUDENT TO CLASS - FACULTY
// ==========================================

router.post(
    "/:classId/students",
    protect,
    authorize("faculty"),
    addStudentToClass
);

// ==========================================
// GET CLASS DETAILS - FACULTY
// ==========================================

router.get(
    "/:classId",
    protect,
    authorize("faculty"),
    getClassDetails
);

module.exports = router;
