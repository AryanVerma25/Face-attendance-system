import { BrowserRouter, Routes, Route } from "react-router-dom";

import LandingPage from "../pages/LandingPage";
import Login from "../pages/Login";
import Register from "../pages/Register";

import StudentProfile from "../pages/StudentProfile";
import FaceEnrollment from "../pages/FaceEnrollment";
import Dashboard from "../pages/Dashboard";
import Attendance from "../pages/Attendance";

import FacultyDashboard from "../pages/FacultyDashboard";
import FacultyClassDetails from "../pages/FacultyClassDetails";

import ProtectedRoute from "./ProtectedRoute";

function AppRoutes() {
    return (
        <BrowserRouter>
            <Routes>

                {/* =========================
                    Public Routes
                ========================= */}

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


                {/* =========================
                    Student Routes
                ========================= */}

                <Route
                    path="/student-profile"
                    element={
                        <ProtectedRoute>
                            <StudentProfile />
                        </ProtectedRoute>
                    }
                />

                <Route
                    path="/face-enrollment"
                    element={
                        <ProtectedRoute>
                            <FaceEnrollment />
                        </ProtectedRoute>
                    }
                />

                <Route
                    path="/dashboard"
                    element={
                        <ProtectedRoute>
                            <Dashboard />
                        </ProtectedRoute>
                    }
                />

                <Route
                    path="/attendance"
                    element={
                        <ProtectedRoute>
                            <Attendance />
                        </ProtectedRoute>
                    }
                />


                {/* =========================
                    Faculty Routes
                ========================= */}

                {/* Faculty Dashboard */}
                <Route
                    path="/faculty/dashboard"
                    element={
                        <ProtectedRoute>
                            <FacultyDashboard />
                        </ProtectedRoute>
                    }
                />

                {/* Faculty Class Details */}
                <Route
                    path="/faculty/classes/:classId"
                    element={
                        <ProtectedRoute>
                            <FacultyClassDetails />
                        </ProtectedRoute>
                    }
                />

            </Routes>
        </BrowserRouter>
    );
}

export default AppRoutes;