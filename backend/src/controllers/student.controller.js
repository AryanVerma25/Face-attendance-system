const Student = require("../models/Student");

const createStudent = async (req, res) => {
    try {
        const {
            studentId,
            enrollmentNumber,
            department,
            semester
        } = req.body;

        if (
            !studentId ||
            !enrollmentNumber ||
            !department ||
            !semester
        ) {
            return res.status(400).json({
                message: "All student details are required"
            });
        }

        const existingStudent = await Student.findOne({
            $or: [
                { studentId },
                { enrollmentNumber }
            ]
        });

        if (existingStudent) {
            return res.status(409).json({
                message: "Student already exists"
            });
        }

        const student = await Student.create({
            user: req.user._id,
            studentId,
            enrollmentNumber,
            department,
            semester
        });

        res.status(201).json({
            message: "Student profile created successfully",
            student
        });
    } catch (error) {
        res.status(500).json({
            message: "Server error",
            error: error.message
        });
    }
};
const getMyStudentProfile = async (req, res) => {
    try {
        const student = await Student.findOne({
            user: req.user._id
        }).populate("user", "name email role");

        if (!student) {
            return res.status(404).json({
                message: "Student profile not found"
            });
        }

        res.status(200).json({
            message: "Student profile fetched successfully",
            student
        });
    } catch (error) {
        res.status(500).json({
            message: "Server error",
            error: error.message
        });
    }
};
const updateMyStudentProfile = async (req, res) => {
    try {
        const {
            enrollmentNumber,
            department,
            semester
        } = req.body;

        const student = await Student.findOne({
            user: req.user._id
        });

        if (!student) {
            return res.status(404).json({
                message: "Student profile not found"
            });
        }

        if (enrollmentNumber !== undefined) {
            student.enrollmentNumber = enrollmentNumber;
        }

        if (department !== undefined) {
            student.department = department;
        }

        if (semester !== undefined) {
            student.semester = semester;
        }

        await student.save();

        res.status(200).json({
            message: "Student profile updated successfully",
            student
        });
    } catch (error) {
        res.status(500).json({
            message: "Server error",
            error: error.message
        });
    }
};

module.exports = {
    createStudent,
    getMyStudentProfile,
    updateMyStudentProfile
};