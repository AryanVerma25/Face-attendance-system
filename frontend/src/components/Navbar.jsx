import { Link } from "react-router-dom";
import "../styles/navbar.css";

function Navbar() {
    return (
        <header className="navbar">

            <div className="navbar-container">

                <Link to="/" className="navbar-logo">
                    FaceSecure
                </Link>

                <nav className="navbar-links">

                    <a href="/#features">
                        Features
                    </a>

                    <a href="/#how-it-works">
                        How It Works
                    </a>

                    <a href="/#security">
                        Security
                    </a>

                    <Link
                        to="/login"
                        className="navbar-login"
                    >
                        Login
                    </Link>

                    <Link
                        to="/register"
                        className="navbar-register"
                    >
                        Register
                    </Link>

                </nav>

            </div>

        </header>
    );
}

export default Navbar;