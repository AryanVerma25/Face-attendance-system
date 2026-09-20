import Navbar from "../components/Navbar";
import FaceVerificationCard from "../components/FaceVerificationCard";
import FeatureSection from "../components/FeatureSection";
import "../styles/landing.css";

function LandingPage() {
    return (
        <div className="landing-page">

            <Navbar />

            {/* Hero Section */}
            <section className="hero">

                <div className="hero-content">
                    <p className="hero-tag">
                        SMART FACE-BASED ATTENDANCE
                    </p>

                    <h1>
                        Attendance made
                        <span> smarter and safer.</span>
                    </h1>

                    <p className="hero-description">
                        FaceSecure combines face recognition and liveness
                        detection to provide secure, automated, and reliable
                        attendance for modern classrooms.
                    </p>

                    <a
                        href="#how-it-works"
                        className="hero-btn"
                    >
                        Explore FaceSecure →
                    </a>
                </div>

                <FaceVerificationCard />

            </section>

            {/* Features */}
            <FeatureSection />

            {/* How It Works */}
            <section
                className="how-it-works"
                id="how-it-works"
            >

                <div className="section-heading">
                    <p className="section-tag">
                        SIMPLE VERIFICATION PIPELINE
                    </p>

                    <h2>
                        How FaceSecure works
                    </h2>

                    <p className="section-description">
                        A complete verification pipeline from camera input
                        to secure attendance recording.
                    </p>
                </div>

                <div className="steps">

                    <div className="step">
                        <span>01</span>

                        <h3>Detect</h3>

                        <p>
                            Detect faces from the classroom camera.
                        </p>
                    </div>

                    <div className="step">
                        <span>02</span>

                        <h3>Verify</h3>

                        <p>
                            Perform liveness verification to detect
                            potential spoofing attempts.
                        </p>
                    </div>

                    <div className="step">
                        <span>03</span>

                        <h3>Recognize</h3>

                        <p>
                            Compare the face with enrolled student
                            embeddings.
                        </p>
                    </div>

                    <div className="step">
                        <span>04</span>

                        <h3>Record</h3>

                        <p>
                            Validate the result and securely record
                            attendance.
                        </p>
                    </div>

                </div>

            </section>

            {/* Security */}
            <section
                className="security"
                id="security"
            >

                <div className="security-content">

                    <p className="hero-tag">
                        SECURITY FIRST
                    </p>

                    <h2>
                        More than just
                        <span> face recognition.</span>
                    </h2>

                    <p>
                        FaceSecure is designed with multiple verification
                        stages. A face must be detected, verified as live,
                        recognized against an enrolled identity, and then
                        validated by the backend before attendance is recorded.
                    </p>

                    <div className="security-points">

                        <div>
                            <strong>✓</strong>
                            <span>Face detection</span>
                        </div>

                        <div>
                            <strong>✓</strong>
                            <span>Liveness verification</span>
                        </div>

                        <div>
                            <strong>✓</strong>
                            <span>Identity verification</span>
                        </div>

                        <div>
                            <strong>✓</strong>
                            <span>Backend validation</span>
                        </div>

                    </div>

                </div>

                <div className="security-card">

                    <div className="security-circle">
                        ✓
                    </div>

                    <h3>
                        Verification Complete
                    </h3>

                    <p>
                        Face recognized and liveness verified.
                    </p>

                </div>

            </section>

            {/* Call To Action */}
            <section className="cta">

                <h2>
                    Ready to make attendance smarter?
                </h2>

                <p>
                    Experience secure, automated attendance with FaceSecure.
                </p>

                <a
                    href="/login"
                    className="cta-btn"
                >
                    Get Started →
                </a>

            </section>

            {/* Footer */}
            <footer className="footer">

                <div className="footer-logo">
                    FaceSecure
                </div>

                <p>
                    Smart face-based attendance with liveness verification.
                </p>

                <p className="copyright">
                    © 2026 FaceSecure. All rights reserved.
                </p>

            </footer>

        </div>
    );
}

export default LandingPage;