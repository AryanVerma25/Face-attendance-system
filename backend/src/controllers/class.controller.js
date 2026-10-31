
const Class = require("../models/Class");
const Student = require("../models/Student");
const Session = require("../models/Session");

// ==========================================
// CREATE CLASS
// ==========================================

exports.createClass = async (req, res) => {
    try {
        const { name, code } = req.body;

        if (!name || !code) {
            return res.status(400).json({
                message: "Class name and code are required"
            });
        }

        const existingClass = await Class.findOne({ code });

        if (existingClass) {
            return res.status(400).json({
                message: "Class code already exists"
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
        console.error("CREATE CLASS ERROR:", error);

        res.status(500).json({
            message: "Failed to create class"
        });
    }
};


// ==========================================
// GET FACULTY'S CLASSES
// ==========================================

exports.getMyClasses = async (req, res) => {
    try {
        const classes = await Class.find({
            faculty: req.user._id
        }).sort({ createdAt: -1 });

        res.status(200).json({
            message: "Classes fetched successfully",
            classes
        });

    } catch (error) {
        console.error("GET MY CLASSES ERROR:", error);

        res.status(500).json({
            message: "Failed to fetch classes"
        });
    }
};


// ==========================================
// GET STUDENT'S ENROLLED CLASSES
// ==========================================

exports.getMyEnrolledClasses = async (req, res) => {
    try {
        // Find logged-in student's profile
        const student = await Student.findOne({
            user: req.user._id
        });

        if (!student) {
            return res.status(404).json({
                message: "Student profile not found"
            });
        }

        // Find classes containing this student
        const classes = await Class.find({
            students: student._id
        })
            .populate("faculty", "name email")
            .sort({ createdAt: -1 });

        // Attach active session to each class
        const classesWithSessions = await Promise.all(
            classes.map(async (classItem) => {

                const activeSession = await Session.findOne({
                    class: classItem._id,
                    status: "active"
                }).sort({ startedAt: -1 });

                return {
                    _id: classItem._id,
                    id: classItem._id,
                    name: classItem.name,
                    code: classItem.code,
                    faculty: classItem.faculty,
                    activeSession: activeSession || null
                };
            })
        );

        res.status(200).json({
            message: "Student classes fetched successfully",
            classes: classesWithSessions
        });

    } catch (error) {
        console.error("GET STUDENT CLASSES ERROR:", error);

        res.status(500).json({
            message: "Failed to fetch student classes"
        });
    }
};


// ==========================================
// GET CLASS DETAILS
// ==========================================

exports.getClassDetails = async (req, res) => {
    try {
        const { classId } = req.params;

        const classData = await Class.findById(classId)
            .populate({
                path: "students",
                select: "studentId enrollmentNumber department semester user",
                populate: {
                    path: "user",
                    select: "name email"
                }
            });

        if (!classData) {
            return res.status(404).json({
                message: "Class not found"
            });
        }

        if (
            classData.faculty.toString() !==
            req.user._id.toString()
        ) {
            return res.status(403).json({
                message: "You are not authorized to view this class"
            });
        }

        res.status(200).json({
            message: "Class details fetched successfully",
            class: classData
        });

    } catch (error) {
        console.error("GET CLASS DETAILS ERROR:", error);

        res.status(500).json({
            message: "Failed to fetch class details"
        });
    }
};


// ==========================================
// ADD STUDENT TO CLASS
// ==========================================

exports.addStudentToClass = async (req, res) => {
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

        if (
            classData.faculty.toString() !==
            req.user._id.toString()
        ) {
            return res.status(403).json({
                message: "You are not authorized to modify this class"
            });
        }

        const student = await Student.findOne({
            studentId
        });

        if (!student) {
            return res.status(404).json({
                message: "Student not found"
            });
        }

        const alreadyEnrolled = classData.students.some(
            (id) => id.toString() === student._id.toString()
        );

        if (alreadyEnrolled) {
            return res.status(400).json({
                message: "Student is already enrolled in this class"
            });
        }

        classData.students.push(student._id);

        await classData.save();

        res.status(200).json({
            message: "Student added to class successfully",
            class: classData
        });

    } catch (error) {
        console.error("ADD STUDENT ERROR:", error);

        res.status(500).json({
            message: "Failed to add student"
        });
    }
};
