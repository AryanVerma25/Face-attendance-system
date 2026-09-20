import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import GoogleSignInButton from "../components/GoogleSignInButton";
import api from "../services/api";
import "../styles/auth.css";

function Login() {
    const navigate = useNavigate();

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const handleLogin = async (e) => {
        e.preventDefault();

        setError("");
        setLoading(true);

        try {
            const response = await api.post("/auth/login", {
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
                "Login failed. Please try again."
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
                        SMART FACE-BASED ATTENDANCE
                    </p>

                    <h1>
                        Secure access to
                        <span> smarter attendance.</span>
                    </h1>

                    <p>
                        Sign in to manage attendance, monitor sessions,
                        and access your FaceSecure dashboard.
                    </p>

                    <div className="auth-features">

                        <div>
                            <span>✓</span>
                            Face recognition
                        </div>

                        <div>
                            <span>✓</span>
                            Liveness verification
                        </div>

                        <div>
                            <span>✓</span>
                            Secure attendance records
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
                            Welcome back
                        </h2>

                        <p>
                            Sign in to continue to your account.
                        </p>

                    </div>

                    <form onSubmit={handleLogin}>

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
                                placeholder="Enter your password"
                                autoComplete="current-password"
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
                            {loading ? "Signing In..." : "Sign In"}
                        </button>

                    </form>

                    {/* Google Login */}
                    <div className="auth-divider">
                        <span>OR</span>
                    </div>

                    <div className="google-login">
                        <GoogleSignInButton />
                    </div>

                    {/* Register Link */}
                    <div className="auth-switch">
                        Don't have an account?
                        <Link to="/register">
                            Register
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

export default Login;