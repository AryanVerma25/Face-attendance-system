const mongoose = require("mongoose");

const faceEmbeddingSchema = new mongoose.Schema(
    {
        student: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Student",
            required: true,
            unique: true
        },

        embedding: {
            type: [Number],
            required: true
        },

        model: {
            type: String,
            required: true,
            default: "ArcFace"
        }
    },
    {
        timestamps: true
    }
);

const FaceEmbedding = mongoose.model(
    "FaceEmbedding",
    faceEmbeddingSchema
);

module.exports = FaceEmbedding;