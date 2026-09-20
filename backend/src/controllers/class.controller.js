const Class = require("../models/Class");

const createClass = async (req, res) => {
    try {
        const { name, code } = req.body;

        if (!name || !code) {
            return res.status(400).json({
                message: "Class name and code are required"
            });
        }

        const existingClass = await Class.findOne({ code });

        if (existingClass) {
            return res.status(409).json({
                message: "Class with this code already exists"
            });
        }

        const newClass = await Class.create({
            name,
            code,
            faculty: req.user._id,
            students: []
        });

        res.status(201).json({
            message: "Class created successfully",
            class: newClass
        });
    } catch (error) {
        res.status(500).json({
            message: "Server error",
            error: error.message
        });
    }
};

const addStudentToClass = async (req, res) => {
    try {
        const { classId } = req.params;
        const { studentId } = req.body;

        if (!studentId) {
            return res.status(400).json({
                message: "Student ID is required"
            });
        }

        const classData = await Class.findById(classId);

        if (!classData) {
            return res.status(404).json({
                message: "Class not found"
            });
        }

        if (classData.faculty.toString() !== req.user._id.toString()) {
            return res.status(403).json({
                message: "You are not authorized to modify this class"
            });
        }

        const Student = require("../models/Student");

        const student = await Student.findOne({ studentId });

        if (!student) {
            return res.status(404).json({
                message: "Student not found"
            });
        }

        if (classData.students.includes(student._id)) {
            return res.status(409).json({
                message: "Student already enrolled in this class"
            });
        }

        classData.students.push(student._id);

        await classData.save();

        res.status(200).json({
            message: "Student added to class successfully",
            class: classData
        });
    } catch (error) {
        res.status(500).json({
            message: "Server error",
            error: error.message
        });
    }
};

const getClassDetails = async (req, res) => {
    try {
        const { classId } = req.params;

        const classData = await Class.findById(classId)
            .populate("faculty", "name email")
            .populate(
                "students",
                "studentId enrollmentNumber department semester"
            );

        if (!classData) {
            return res.status(404).json({
                message: "Class not found"
            });
        }

        if (classData.faculty._id.toString() !== req.user._id.toString()) {
            return res.status(403).json({
                message: "You are not authorized to view this class"
            });
        }

        res.status(200).json({
            message: "Class details fetched successfully",
            class: classData
        });
    } catch (error) {
        res.status(500).json({
            message: "Server error",
            error: error.message
        });
    }
};

module.exports = {
    createClass,
    addStudentToClass,
    getClassDetails
};