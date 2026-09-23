import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

import api from "../services/api";
import "../styles/face-enrollment.css";

function FaceEnrollment() {
    const navigate = useNavigate();

    const videoRef = useRef(null);
    const streamRef = useRef(null);

    const [cameraStarted, setCameraStarted] = useState(false);
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState("");
    const [error, setError] = useState("");

    useEffect(() => {
        return () => {
            if (streamRef.current) {
                streamRef.current.getTracks().forEach((track) => {
                    track.stop();
                });
            }
        };
    }, []);

    useEffect(() => {
        if (cameraStarted && videoRef.current && streamRef.current) {
            videoRef.current.srcObject = streamRef.current;
        }
    }, [cameraStarted]);

    const startCamera = async () => {
        try {
            setError("");
            setMessage("");

            const stream = await navigator.mediaDevices.getUserMedia({
                video: {
                    facingMode: "user"
                },
                audio: false
            });

            streamRef.current = stream;
            setCameraStarted(true);

        } catch (error) {
            console.error("Camera error:", error);

            setError(
                "Camera access was denied or is unavailable."
            );
        }
    };

    const stopCamera = () => {
        if (streamRef.current) {
            streamRef.current.getTracks().forEach((track) => {
                track.stop();
            });

            streamRef.current = null;
        }

        if (videoRef.current) {
            videoRef.current.srcObject = null;
        }

        setCameraStarted(false);
    };

    const captureFace = async () => {
        if (!videoRef.current) {
            return;
        }

        try {
            setLoading(true);
            setError("");
            setMessage("");

            const video = videoRef.current;

            if (
                video.videoWidth === 0 ||
                video.videoHeight === 0
            ) {
                setError("Camera is not ready yet.");
                setLoading(false);
                return;
            }

            const canvas = document.createElement("canvas");

            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;

            const context = canvas.getContext("2d");

            context.drawImage(
                video,
                0,
                0,
                canvas.width,
                canvas.height
            );

            const image = canvas.toDataURL(
                "image/jpeg",
                0.9
            );

            const response = await api.post(
                "/face/enroll",
                {
                    image
                }
            );

            setMessage(
                response.data.message ||
                "Face enrolled successfully."
            );

            stopCamera();

        } catch (error) {
            console.error(
                "Face enrollment error:",
                error
            );

            setError(
                error.response?.data?.message ||
                "Face enrollment failed."
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="face-enrollment-page">

            <nav className="face-enrollment-navbar">

                <button
                    className="face-enrollment-back"
                    onClick={() => {
                        stopCamera();
                        navigate("/dashboard");
                    }}
                >
                    ← Back to Dashboard
                </button>

                <div className="face-enrollment-logo">
                    FaceSecure
                </div>

            </nav>


            <main className="face-enrollment-content">

                <div className="face-enrollment-header">

                    <p className="face-enrollment-tag">
                        FACE ENROLLMENT
                    </p>

                    <h1>
                        Register Your Face
                    </h1>

                    <p>
                        Your face will be securely registered
                        for attendance verification.
                    </p>

                </div>


                <div className="face-enrollment-card">

                    <div className="face-camera-container">

                        {cameraStarted ? (
                            <video
                                ref={videoRef}
                                autoPlay
                                playsInline
                                muted
                                className="face-enrollment-video"
                            />
                        ) : (
                            <div className="face-camera-placeholder">

                                <div className="face-camera-icon">
                                    ◉
                                </div>

                                <h2>
                                    Camera Enrollment
                                </h2>

                                <p>
                                    Position your face clearly
                                    inside the camera.
                                </p>

                            </div>
                        )}

                    </div>


                    {error && (
                        <div className="face-enrollment-error">
                            {error}
                        </div>
                    )}


                    {message && (
                        <div className="face-enrollment-success">
                            {message}
                        </div>
                    )}


                    {!cameraStarted ? (

                        <button
                            className="face-enrollment-button"
                            onClick={startCamera}
                        >
                            Start Camera
                        </button>

                    ) : (

                        <div className="face-enrollment-actions">

                            <button
                                className="face-enrollment-button"
                                onClick={captureFace}
                                disabled={loading}
                            >
                                {loading
                                    ? "Processing..."
                                    : "Capture & Register Face"}
                            </button>

                            <button
                                className="face-enrollment-secondary"
                                onClick={stopCamera}
                                disabled={loading}
                            >
                                Stop Camera
                            </button>

                        </div>

                    )}


                    <p className="face-enrollment-note">
                        Make sure your face is clearly visible,
                        well-lit, and directly facing the camera.
                    </p>

                </div>

            </main>

        </div>
    );
}

export default FaceEnrollment;