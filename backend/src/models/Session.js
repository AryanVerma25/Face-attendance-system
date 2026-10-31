
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
            enum: ["scheduled", "active", "closed"],
            default: "scheduled"
        },

        scheduledStartAt: {
            type: Date,
            default: null
        },

        scheduledEndAt: {
            type: Date,
            default: null
        },

        startedAt: {
            type: Date,
            default: null
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
