import { BrowserRouter, Routes, Route } from "react-router-dom";

import LandingPage from "../pages/LandingPage";
import Login from "../pages/Login";
import Register from "../pages/Register";
import StudentProfile from "../pages/StudentProfile";
import FaceEnrollment from "../pages/FaceEnrollment";
import Dashboard from "../pages/Dashboard";
import Attendance from "../pages/Attendance";

import ProtectedRoute from "./ProtectedRoute";

function AppRoutes() {
    return (
        <BrowserRouter>
            <Routes>

                {/* Public Routes */}

                <Route
                    path="/"
                    element={<LandingPage />}
                />

                <Route
                    path="/login"
                    element={<Login />}
                />

                <Route
                    path="/register"
                    element={<Register />}
                />


                {/* Protected Student Profile */}

                <Route
                    path="/student-profile"
                    element={
                        <ProtectedRoute>
                            <StudentProfile />
                        </ProtectedRoute>
                    }
                />


                {/* Protected Face Enrollment */}

                <Route
                    path="/face-enrollment"
                    element={
                        <ProtectedRoute>
                            <FaceEnrollment />
                        </ProtectedRoute>
                    }
                />


                {/* Protected Student Dashboard */}

                <Route
                    path="/dashboard"
                    element={
                        <ProtectedRoute>
                            <Dashboard />
                        </ProtectedRoute>
                    }
                />


                {/* Protected Attendance Page */}

                <Route
                    path="/attendance"
                    element={
                        <ProtectedRoute>
                            <Attendance />
                        </ProtectedRoute>
                    }
                />

            </Routes>
        </BrowserRouter>
    );
}

export default AppRoutes;