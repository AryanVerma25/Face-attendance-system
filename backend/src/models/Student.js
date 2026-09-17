const mongoose = require("mongoose");

const studentSchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
            unique: true
        },

        studentId: {
            type: String,
            required: true,
            unique: true,
            trim: true
        },

        enrollmentNumber: {
            type: String,
            required: true,
            unique: true,
            trim: true
        },

        department: {
            type: String,
            required: true,
            trim: true
        },

        semester: {
            type: Number,
            required: true
        }
    },
    {
        timestamps: true
    }
);

const Student = mongoose.model("Student", studentSchema);

module.exports = Student;