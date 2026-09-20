const express = require("express");

const {
    createStudent,
    getMyStudentProfile,
    updateMyStudentProfile
} = require("../controllers/student.controller");

const protect = require("../middleware/auth.middleware");
const authorize = require("../middleware/role.middleware");

const router = express.Router();

router.post(
    "/",
    protect,
    authorize("student"),
    createStudent
);
router.put(
    "/me",
    protect,
    authorize("student"),
    updateMyStudentProfile
);

module.exports = router;