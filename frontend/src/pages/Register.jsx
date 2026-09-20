import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import GoogleSignInButton from "../components/GoogleSignInButton";
import api from "../services/api";
import "../styles/auth.css";

function Register() {
    const navigate = useNavigate();

    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const handleRegister = async (e) => {
        e.preventDefault();

        setError("");
        setLoading(true);

        try {
            const response = await api.post("/auth/register", {
                name,
                email,
                password
            });

            localStorage.setItem("token", response.data.token);

            localStorage.setItem(
                "user",
                JSON.stringify(response.data.user)
            );

            navigate("/dashboard");

        } catch (error) {
            setError(
                error.response?.data?.message ||
                "Registration failed. Please try again."
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-page">

            {/* Left Side */}
            <div className="auth-brand">

                <Link to="/" className="auth-logo">
                    FaceSecure
                </Link>

                <div className="auth-brand-content">

                    <p className="auth-tag">
                        JOIN FACESECURE
                    </p>

                    <h1>
                        Start using
                        <span> smarter attendance.</span>
                    </h1>

                    <p>
                        Create your student account and get access to
                        your attendance records and FaceSecure services.
                    </p>

                    <div className="auth-features">

                        <div>
                            <span>✓</span>
                            Secure student profile
                        </div>

                        <div>
                            <span>✓</span>
                            Face enrollment support
                        </div>

                        <div>
                            <span>✓</span>
                            Attendance history
                        </div>

                    </div>

                </div>

            </div>

            {/* Right Side */}
            <div className="auth-form-container">

                <div className="auth-form-card">

                    <div className="auth-form-header">

                        <p className="auth-mobile-logo">
                            FaceSecure
                        </p>

                        <h2>
                            Create account
                        </h2>

                        <p>
                            Register as a student to get started.
                        </p>

                    </div>

                    <form onSubmit={handleRegister}>

                        <div className="form-group">
                            <label htmlFor="name">
                                Full name
                            </label>

                            <input
                                id="name"
                                type="text"
                                placeholder="Enter your full name"
                                autoComplete="name"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                required
                            />
                        </div>

                        <div className="form-group">
                            <label htmlFor="email">
                                Email address
                            </label>

                            <input
                                id="email"
                                type="email"
                                placeholder="Enter your email"
                                autoComplete="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                            />
                        </div>

                        <div className="form-group">
                            <label htmlFor="password">
                                Password
                            </label>

                            <input
                                id="password"
                                type="password"
                                placeholder="Create a password"
                                autoComplete="new-password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                            />
                        </div>

                        {error && (
                            <p style={{
                                color: "#dc2626",
                                fontSize: "14px",
                                marginBottom: "16px"
                            }}>
                                {error}
                            </p>
                        )}

                        <button
                            type="submit"
                            className="auth-submit"
                            disabled={loading}
                        >
                            {loading ? "Creating Account..." : "Create Account"}
                        </button>

                    </form>

                    {/* Google Register */}
                    <div className="auth-divider">
                        <span>OR</span>
                    </div>

                    <div className="google-login">
                        <GoogleSignInButton />
                    </div>

                    <div className="auth-switch">
                        Already have an account?
                        <Link to="/login">
                            Sign in
                        </Link>
                    </div>

                    <div className="auth-back">
                        <Link to="/">
                            ← Back to FaceSecure
                        </Link>
                    </div>

                </div>

            </div>

        </div>
    );
}

export default Register;