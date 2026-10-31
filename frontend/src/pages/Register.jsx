import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
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
            await api.post("/auth/register", {
                name,
                email,
                password,
                role: "student"
            });

            // Registration successful
            navigate("/login");

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
                        SMART FACE-BASED ATTENDANCE
                    </p>

                    <h1>
                        Create your
                        <span> FaceSecure account.</span>
                    </h1>

                    <p>
                        Register as a student and access
                        secure face-based attendance.
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
                            Create account
                        </h2>

                        <p>
                            Register to get started.
                        </p>

                    </div>


                    <form onSubmit={handleRegister}>

                        {/* Name */}

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
                                onChange={(e) =>
                                    setName(e.target.value)
                                }
                                required
                            />

                        </div>


                        {/* Email */}

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
                                onChange={(e) =>
                                    setEmail(e.target.value)
                                }
                                required
                            />

                        </div>


                        {/* Password */}

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
                                onChange={(e) =>
                                    setPassword(e.target.value)
                                }
                                required
                            />

                        </div>


                        {/* Error */}

                        {error && (
                            <p
                                style={{
                                    color: "#dc2626",
                                    fontSize: "14px",
                                    marginBottom: "16px"
                                }}
                            >
                                {error}
                            </p>
                        )}


                        {/* Register */}

                        <button
                            type="submit"
                            className="auth-submit"
                            disabled={loading}
                        >
                            {loading
                                ? "Creating Account..."
                                : "Create Account"}
                        </button>

                    </form>


                    {/* Login */}

                    <div className="auth-switch">

                        Already have an account?

                        <Link to="/login">
                            Sign In
                        </Link>

                    </div>


                    {/* Back */}

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