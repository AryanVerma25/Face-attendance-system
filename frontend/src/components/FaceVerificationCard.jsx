import "../styles/verification-card.css";

function FaceVerificationCard() {
    return (
        <div className="verification-card">

            <div className="verification-header">
                <span className="live-dot"></span>
                LIVE VERIFICATION
            </div>

            <div className="camera-frame">

                <div className="scan-line"></div>

                <div className="face-outline">
                    <div className="face-eyes">
                        <span></span>
                        <span></span>
                    </div>

                    <div className="face-mouth"></div>
                </div>

                <div className="corner corner-top-left"></div>
                <div className="corner corner-top-right"></div>
                <div className="corner corner-bottom-left"></div>
                <div className="corner corner-bottom-right"></div>

            </div>

            <div className="verification-info">

                <div className="verification-row">
                    <div className="status-icon success">
                        ✓
                    </div>

                    <div>
                        <strong>Face detected</strong>
                        <span>Identity located</span>
                    </div>
                </div>

                <div className="verification-row">
                    <div className="status-icon success">
                        ✓
                    </div>

                    <div>
                        <strong>Liveness verified</strong>
                        <span>Live person detected</span>
                    </div>
                </div>

                <div className="verification-row">
                    <div className="status-icon success">
                        ✓
                    </div>

                    <div>
                        <strong>Identity verified</strong>
                        <span>Student recognized</span>
                    </div>
                </div>

            </div>

            <div className="attendance-ready">
                <span>●</span>
                Attendance Ready
            </div>

        </div>
    );
}

export default FaceVerificationCard;