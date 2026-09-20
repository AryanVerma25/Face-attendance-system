const mongoose = require("mongoose");

const attendanceSchema = new mongoose.Schema(
    {
        session: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Session",
            required: true
        },

        student: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Student",
            required: true
        },

        class: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Class",
            required: true
        },

        date: {
            type: Date,
            required: true,
            default: Date.now
        },

        status: {
            type: String,
            enum: ["present", "absent"],
            default: "present"
        },

        verification: {
            faceRecognized: {
                type: Boolean,
                default: false
            },

            livenessVerified: {
                type: Boolean,
                default: false
            },

            confidence: {
                type: Number,
                default: 0
            }
        }
    },
    {
        timestamps: true
    }
);
attendanceSchema.index(
    { session: 1, student: 1 },
    { unique: true }
);

const Attendance = mongoose.model("Attendance", attendanceSchema);

module.exports = Attendance;