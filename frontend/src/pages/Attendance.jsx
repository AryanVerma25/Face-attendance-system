import React, { useEffect, useRef, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import api from "../services/api";
import "../styles/attendance.css";

function Attendance() {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();

    const sessionId = searchParams.get("sessionId");

    const videoRef = useRef(null);
    const streamRef = useRef(null);

    const [session, setSession] = useState(null);
    const [loading, setLoading] = useState(true);

    const [cameraActive, setCameraActive] = useState(false);
    const [verifying, setVerifying] = useState(false);

    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    const [livenessStep, setLivenessStep] = useState(0);
    const [attendanceMarked, setAttendanceMarked] = useState(false);

    // --------------------------------------------------
    // Load session
    // --------------------------------------------------

    useEffect(() => {
        const loadSession = async () => {
            try {
                if (!sessionId) {
                    setError("Session ID is missing.");
                    setLoading(false);
                    return;
                }

                const response = await api.get(
                    `/sessions/${sessionId}`
                );

                setSession(response.data.session);
            } catch (error) {
                console.error("SESSION ERROR:", error);

                setError(
                    error.response?.data?.message ||
                    "Unable to load attendance session."
                );
            } finally {
                setLoading(false);
            }
        };

        loadSession();
    }, [sessionId]);

    // --------------------------------------------------
    // Start camera
    // --------------------------------------------------

    const startCamera = async () => {
        try {
            setError("");

            const stream =
                await navigator.mediaDevices.getUserMedia({
                    video: {
                        facingMode: "user",
                        width: {
                            ideal: 640
                        },
                        height: {
                            ideal: 480
                        }
                    },
                    audio: false
                });

            streamRef.current = stream;

            if (videoRef.current) {
                videoRef.current.srcObject = stream;
            }

            setCameraActive(true);
        } catch (error) {
            console.error("CAMERA ERROR:", error);

            setError(
                "Unable to access camera. Please allow camera permission."
            );
        }
    };

    // --------------------------------------------------
    // Stop camera
    // --------------------------------------------------

    const stopCamera = () => {
        if (streamRef.current) {
            streamRef.current
                .getTracks()
                .forEach((track) => track.stop());

            streamRef.current = null;
        }

        if (videoRef.current) {
            videoRef.current.srcObject = null;
        }

        setCameraActive(false);
    };

    // --------------------------------------------------
    // Start camera after session loads
    // --------------------------------------------------

    useEffect(() => {
        if (!loading && session) {
            startCamera();
        }

        return () => {
            if (streamRef.current) {
                streamRef.current
                    .getTracks()
                    .forEach((track) => track.stop());
            }
        };
    }, [loading, session]);

    // --------------------------------------------------
    // Capture compressed image
    // --------------------------------------------------

    const captureImage = () => {
        const video = videoRef.current;

        if (!video) {
            throw new Error("Camera is not available.");
        }

        if (!video.videoWidth || !video.videoHeight) {
            throw new Error("Camera is not ready.");
        }

        const canvas = document.createElement("canvas");

        const maxWidth = 640;
        const maxHeight = 480;

        let width = video.videoWidth;
        let height = video.videoHeight;

        const scale = Math.min(
            maxWidth / width,
            maxHeight / height,
            1
        );

        width = Math.round(width * scale);
        height = Math.round(height * scale);

        canvas.width = width;
        canvas.height = height;

        const context = canvas.getContext("2d");

        context.drawImage(
            video,
            0,
            0,
            width,
            height
        );

        return canvas.toDataURL(
            "image/jpeg",
            0.6
        );
    };

    // --------------------------------------------------
    // Wait helper
    // --------------------------------------------------

    const wait = (ms) =>
        new Promise((resolve) => {
            setTimeout(resolve, ms);
        });

    // --------------------------------------------------
    // Capture liveness frames
    // --------------------------------------------------

    const captureLivenessFrames = async () => {
        const frames = [];

        // Center
        setLivenessStep(1);
        await wait(1200);

        frames.push(captureImage());

        // Left
        setLivenessStep(2);
        await wait(1200);

        frames.push(captureImage());

        // Right
        setLivenessStep(3);
        await wait(1200);

        frames.push(captureImage());

        return frames;
    };

    // --------------------------------------------------
    // Mark attendance
    // --------------------------------------------------

    const markAttendance = async () => {
        console.log("MARK ATTENDANCE CLICKED");

        if (!sessionId) {
            setError("Session ID is missing.");
            return;
        }

        if (!cameraActive) {
            setError("Please start the camera first.");
            return;
        }

        if (attendanceMarked) {
            return;
        }

        setError("");
        setSuccess("");
        setVerifying(true);
        setLivenessStep(0);

        try {
            // ------------------------------------------
            // 1. Capture liveness frames
            // ------------------------------------------

            const livenessFrames =
                await captureLivenessFrames();

            console.log(
                "Liveness frames captured:",
                livenessFrames.length
            );

            // ------------------------------------------
            // 2. Check liveness
            // ------------------------------------------

            setLivenessStep(4);

            const livenessResponse =
                await api.post(
                    "/face/liveness",
                    {
                        images: livenessFrames
                    }
                );

            console.log(
                "LIVENESS RESPONSE:",
                livenessResponse.data
            );

            if (
                !livenessResponse.data?.liveness
            ) {
                throw new Error(
                    "Liveness verification failed. Please follow the instructions and try again."
                );
            }

            // ------------------------------------------
            // 3. Capture final face image
            // ------------------------------------------

            const finalImage = captureImage();

            // ------------------------------------------
            // 4. Face verification
            // ------------------------------------------

            setLivenessStep(5);

            const faceResponse =
                await api.post(
                    "/face/verify",
                    {
                        image: finalImage,
                        sessionId
                    }
                );

            console.log(
                "FACE RESPONSE:",
                faceResponse.data
            );

            if (
                !faceResponse.data?.verified
            ) {
                throw new Error(
                    "Face verification failed. Please make sure your face is clearly visible."
                );
            }

            // ------------------------------------------
            // 5. Mark attendance
            // ------------------------------------------

            const attendanceResponse =
                await api.post(
                    "/attendance/mark",
                    {
                        sessionId,
                        image: finalImage
                    }
                );

            console.log(
                "ATTENDANCE RESPONSE:",
                attendanceResponse.data
            );

            setAttendanceMarked(true);

            setSuccess(
                attendanceResponse.data?.message ||
                "Attendance marked successfully!"
            );

            stopCamera();

        } catch (error) {
            console.error(
                "ATTENDANCE ERROR:",
                error
            );

            console.error(
                "RESPONSE:",
                error.response?.data
            );

            console.error(
                "STATUS:",
                error.response?.status
            );

            setError(
                error.response?.data?.message ||
                error.response?.data?.detail ||
                error.message ||
                "Unable to mark attendance."
            );
        } finally {
            setVerifying(false);
            setLivenessStep(0);
        }
    };

    // --------------------------------------------------
    // Loading
    // --------------------------------------------------

    if (loading) {
        return (
            <div className="attendance-page">

                <nav className="attendance-navbar">
                    <div className="attendance-logo">
                        FaceSecure
                    </div>

                    <button
                        className="attendance-back"
                        onClick={() => navigate("/dashboard")}
                    >
                        Back to Dashboard
                    </button>
                </nav>

                <main className="attendance-content">
                    <div className="attendance-loading">
                        Loading attendance session...
                    </div>
                </main>

            </div>
        );
    }

    // --------------------------------------------------
    // Page
    // --------------------------------------------------

    return (
        <div className="attendance-page">

            {/* Navbar */}

            <nav className="attendance-navbar">

                <div className="attendance-logo">
                    FaceSecure
                </div>

                <button
                    className="attendance-back"
                    onClick={() => {
                        stopCamera();
                        navigate("/dashboard");
                    }}
                >
                    ← Back to Dashboard
                </button>

            </nav>

            {/* Main */}

            <main className="attendance-content">

                {/* Header */}

                <header className="attendance-header">

                    <p className="attendance-tag">
                        FACE VERIFICATION
                    </p>

                    <h1>
                        Mark Your Attendance
                    </h1>

                    <p>
                        Verify your identity using your face
                        to securely record attendance.
                    </p>

                </header>

                {/* Card */}

                <section className="attendance-card">

                    {/* Camera */}

                    <div className="camera-container">

                        {cameraActive ? (
                            <video
                                ref={videoRef}
                                autoPlay
                                playsInline
                                muted
                                className="attendance-video"
                            />
                        ) : (
                            <div className="camera-placeholder">

                                <div className="camera-icon">
                                    ◉
                                </div>

                                <h2>
                                    Camera is off
                                </h2>

                                <p>
                                    Start the camera to verify
                                    your identity.
                                </p>

                            </div>
                        )}

                    </div>

                    {/* Liveness instruction */}

                    {verifying &&
                        livenessStep > 0 &&
                        livenessStep < 4 && (
                            <div className="liveness-box">

                                <strong>
                                    {livenessStep === 1 &&
                                        "Look straight at the camera"}

                                    {livenessStep === 2 &&
                                        "Slowly turn your head left"}

                                    {livenessStep === 3 &&
                                        "Slowly turn your head right"}
                                </strong>

                                <span>
                                    Keep your face clearly visible.
                                </span>

                            </div>
                        )}

                    {verifying &&
                        livenessStep === 4 && (
                            <div className="verification-status">
                                Checking liveness...
                            </div>
                        )}

                    {verifying &&
                        livenessStep === 5 && (
                            <div className="verification-status">
                                Matching your face...
                            </div>
                        )}

                    {/* Session info */}

                    <div className="attendance-session-info">

                        <div>

                            <span>
                                Class
                            </span>

                            <strong>
                                {session?.class?.name ||
                                    session?.class?.code ||
                                    "Class"}
                            </strong>

                        </div>

                        <div>

                            <span>
                                Status
                            </span>

                            <strong className="session-active">

                                <span></span>

                                {session?.status ===
                                "active"
                                    ? "Active"
                                    : session?.status}

                            </strong>

                        </div>

                    </div>

                    {/* Error */}

                    {error && (
                        <div className="attendance-error">
                            {error}
                        </div>
                    )}

                    {/* Success */}

                    {success && (
                        <div className="attendance-success">
                            {success}
                        </div>
                    )}

                    {/* Main button */}

                    {!attendanceMarked && (
                        <button
                            className="start-camera-button"
                            onClick={markAttendance}
                            disabled={
                                verifying ||
                                !cameraActive ||
                                session?.status !==
                                    "active"
                            }
                        >
                            {verifying
                                ? "Verifying..."
                                : "Mark Attendance"}
                        </button>
                    )}

                    {/* Camera button */}

                    {!attendanceMarked && (
                        <button
                            className="camera-control-button"
                            onClick={
                                cameraActive
                                    ? stopCamera
                                    : startCamera
                            }
                            disabled={verifying}
                        >
                            {cameraActive
                                ? "Stop Camera"
                                : "Start Camera"}
                        </button>
                    )}

                    {/* Note */}

                    <p className="attendance-note">
                        Your face will be checked for
                        liveness and matched with your
                        enrolled FaceSecure profile before
                        attendance is recorded.
                    </p>

                </section>

            </main>

        </div>
    );
}

export default Attendance;