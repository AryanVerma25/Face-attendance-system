import { useEffect, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import api from "../services/api";
import "../styles/attendance.css";

function Attendance() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();

    const sessionId = searchParams.get("sessionId");

    const videoRef = useRef(null);
    const streamRef = useRef(null);

    const [cameraStarted, setCameraStarted] = useState(false);
    const [cameraError, setCameraError] = useState("");
    const [session, setSession] = useState(null);
    const [loading, setLoading] = useState(true);

    // Fetch attendance session
    useEffect(() => {
        const fetchSession = async () => {
            try {
                if (!sessionId) {
                    setCameraError("No attendance session selected.");
                    return;
                }

                const response = await api.get(
                    `/sessions/${sessionId}`
                );

                setSession(response.data.session);

            } catch (error) {
                console.error(
                    "Failed to fetch session:",
                    error
                );

                setCameraError(
                    error.response?.data?.message ||
                    "Unable to load attendance session."
                );

            } finally {
                setLoading(false);
            }
        };

        fetchSession();

        // Stop camera when leaving the page
        return () => {
            if (streamRef.current) {
                streamRef.current
                    .getTracks()
                    .forEach((track) => track.stop());
            }
        };
    }, [sessionId]);


    // Attach camera stream after video element is rendered
    useEffect(() => {
        if (
            cameraStarted &&
            videoRef.current &&
            streamRef.current
        ) {
            videoRef.current.srcObject =
                streamRef.current;
        }
    }, [cameraStarted]);


    // Start camera
    const startCamera = async () => {
        try {
            setCameraError("");

            const stream =
                await navigator.mediaDevices.getUserMedia({
                    video: {
                        facingMode: "user"
                    },
                    audio: false
                });

            streamRef.current = stream;

            setCameraStarted(true);

        } catch (error) {
            console.error(
                "Camera error:",
                error
            );

            setCameraError(
                "Camera access was denied or is unavailable."
            );
        }
    };


    // Stop camera
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

        setCameraStarted(false);
    };


    return (
        <div className="attendance-page">

            {/* Navbar */}
            <nav className="attendance-navbar">

                <button
                    className="attendance-back"
                    onClick={() => {
                        stopCamera();
                        navigate("/dashboard");
                    }}
                >
                    ← Back to Dashboard
                </button>

                <div className="attendance-logo">
                    FaceSecure
                </div>

            </nav>


            {/* Main Content */}
            <main className="attendance-content">

                {/* Header */}
                <div className="attendance-header">

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

                </div>


                {/* Loading */}
                {loading ? (

                    <div className="attendance-loading">
                        Loading session...
                    </div>

                ) : (

                    <div className="attendance-card">

                        {/* Camera */}
                        <div className="camera-container">

                            {cameraStarted ? (

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
                                        Camera verification
                                    </h2>

                                    <p>
                                        Your camera will be used
                                        to verify your identity.
                                    </p>

                                </div>

                            )}

                        </div>


                        {/* Session Information */}
                        <div className="attendance-session-info">

                            <div>

                                <span>
                                    Class
                                </span>

                                <strong>
                                    {session?.class?.name ||
                                        session?.class?.code ||
                                        "CSE201"}
                                </strong>

                            </div>


                            <div>

                                <span>
                                    Status
                                </span>

                                <strong className="session-active">

                                    <span></span>

                                    Active

                                </strong>

                            </div>

                        </div>


                        {/* Error */}
                        {cameraError && (

                            <div className="attendance-error">
                                {cameraError}
                            </div>

                        )}


                        {/* Camera Button */}
                        {!cameraStarted ? (

                            <button
                                className="start-camera-button"
                                onClick={startCamera}
                            >
                                Start Camera
                            </button>

                        ) : (

                            <button
                                className="start-camera-button"
                                onClick={stopCamera}
                            >
                                Stop Camera
                            </button>

                        )}


                        {/* Note */}
                        <p className="attendance-note">
                            Face recognition and liveness
                            verification will be performed
                            after the camera is started.
                        </p>

                    </div>

                )}

            </main>

        </div>
    );
}

export default Attendance;