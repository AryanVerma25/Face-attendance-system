const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const cookieParser = require("cookie-parser");
const authRoutes = require("./routes/auth.routes");

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());
app.use(cookieParser());


app.get("/", (req, res) => {
    res.json({
        message: "Face Attendance API is running"
    });
});

app.use("/api/v1/auth", authRoutes);

module.exports = app;