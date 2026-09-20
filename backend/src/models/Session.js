const mongoose = require("mongoose");

const sessionSchema = new mongoose.Schema(
    {
        class: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Class",
            required: true
        },

        faculty: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        },

        status: {
            type: String,
            enum: ["active", "closed"],
            default: "active"
        },

        startedAt: {
            type: Date,
            default: Date.now
        },

        endedAt: {
            type: Date,
            default: null
        }
    },
    { timestamps: true }
);

const Session = mongoose.model("Session", sessionSchema);

module.exports = Session;