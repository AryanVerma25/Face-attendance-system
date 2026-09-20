import FeatureCard from "./FeatureCard";

function FeatureSection() {
    const features = [
        {
            icon: "◉",
            title: "Face Recognition",
            description:
                "Identify enrolled students using facial recognition and biometric embeddings.",
        },
        {
            icon: "✓",
            title: "Liveness Detection",
            description:
                "Verify that the detected face belongs to a live person rather than a simple photo.",
        },
        {
            icon: "⚡",
            title: "Automated Attendance",
            description:
                "Automatically record verified students during an active classroom attendance session.",
        },
        {
            icon: "🔒",
            title: "Secure Records",
            description:
                "Store attendance records securely with role-based access for students and faculty.",
        },
    ];

    return (
        <section className="features" id="features">

            <div className="section-heading">
                <p className="section-tag">
                    WHY FACESECURE
                </p>

                <h2>
                    Built for smarter attendance
                </h2>

                <p className="section-description">
                    FaceSecure combines computer vision, facial recognition,
                    liveness verification, and secure backend services to
                    automate classroom attendance.
                </p>
            </div>

            <div className="feature-grid">
                {features.map((feature) => (
                    <FeatureCard
                        key={feature.title}
                        icon={feature.icon}
                        title={feature.title}
                        description={feature.description}
                    />
                ))}
            </div>

        </section>
    );
}

export default FeatureSection;