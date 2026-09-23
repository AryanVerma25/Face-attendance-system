import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import api from "../services/api";
import "../styles/dashboard.css";

function Dashboard() {
    const navigate = useNavigate();

    const user = JSON.parse(localStorage.getItem("user"));

    const [attendance, setAttendance] = useState([]);
    const [student, setStudent] = useState(null);
    const [classes, setClasses] = useState([]);
    const [faceEnrolled, setFaceEnrolled] = useState(false);

    const [loading, setLoading] = useState(true);
    const [classesLoading, setClassesLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        const fetchDashboardData = async () => {
            try {
                // First check if student profile exists
                const profileResponse = await api.get("/students/me");

                setStudent(profileResponse.data.student);

                // Fetch dashboard data + face enrollment status
                const [
                    attendanceResponse,
                    classesResponse,
                    faceStatusResponse
                ] = await Promise.all([
                    api.get("/attendance/me"),
                    api.get("/classes/my-classes"),
                    api.get("/face/status")
                ]);

                setAttendance(
                    attendanceResponse.data.attendance || []
                );

                setClasses(
                    classesResponse.data.classes || []
                );

                setFaceEnrolled(
                    faceStatusResponse.data.enrolled
                );

            } catch (error) {
                console.error(
                    "Failed to fetch dashboard data:",
                    error
                );

                // Student profile does not exist
                if (
                    error.response?.status === 404 &&
                    error.response?.data?.message ===
                        "Student profile not found"
                ) {
                    navigate("/student-profile");
                    return;
                }

                setError(
                    error.response?.data?.message ||
                    "Unable to load dashboard data."
                );
            } finally {
                setLoading(false);
                setClassesLoading(false);
            }
        };

        fetchDashboardData();
    }, [navigate]);


    const handleLogout = () => {
        localStorage.removeItem("token");
        localStorage.removeItem("user");

        navigate("/login");
    };


    const handleQuickAttendance = () => {
        // Face must be enrolled first
        if (!faceEnrolled) {
            navigate("/face-enrollment");
            return;
        }

        // Find an active class
        const activeClass = classes.find(
            (classData) => classData.activeSession
        );

        // No active attendance session
        if (!activeClass) {
            alert(
                "There is no active attendance session right now."
            );
            return;
        }

        // Open attendance for the active session
        navigate(
            `/attendance?sessionId=${activeClass.activeSession._id}`
        );
    };


    const totalClasses = attendance.length;

    const presentClasses = attendance.filter(
        (record) => record.status === "present"
    ).length;

    const absentClasses = attendance.filter(
        (record) => record.status === "absent"
    ).length;

    const attendancePercentage =
        totalClasses === 0
            ? 0
            : Math.round(
                (presentClasses / totalClasses) * 100
            );

    const recentAttendance = attendance.slice(0, 5);

    const activeClasses = classes.filter(
        (classData) => classData.activeSession
    );


    return (
        <div className="dashboard-page">

            {/* Navbar */}

            <nav className="dashboard-navbar">

                <div className="dashboard-logo">
                    <span className="logo-mark">F</span>
                    FaceSecure
                </div>

                <div className="dashboard-nav-right">

                    <div className="dashboard-user">

                        <div className="dashboard-avatar">
                            {user?.name
                                ?.charAt(0)
                                ?.toUpperCase() || "S"}
                        </div>

                        <div>
                            <strong>
                                {user?.name || "Student"}
                            </strong>

                            <span>
                                Student
                            </span>
                        </div>

                    </div>

                    <button
                        className="dashboard-logout"
                        onClick={handleLogout}
                    >
                        Logout
                    </button>

                </div>

            </nav>


            <main className="dashboard-content">

                {/* Welcome */}

                <section className="dashboard-header">

                    <div>

                        <p className="dashboard-tag">
                            STUDENT DASHBOARD
                        </p>

                        <h1>
                            Welcome back,{" "}
                            {user?.name || "Student"} 👋
                        </h1>

                        <p>
                            Keep track of your attendance and stay
                            on top of your classes.
                        </p>

                    </div>

                </section>


                {/* Student information */}

                {student && (
                    <div className="student-info">

                        <div className="student-info-item">
                            <span>Student ID</span>
                            <strong>
                                {student.studentId}
                            </strong>
                        </div>

                        <div className="student-info-divider"></div>

                        <div className="student-info-item">
                            <span>Department</span>
                            <strong>
                                {student.department}
                            </strong>
                        </div>

                        <div className="student-info-divider"></div>

                        <div className="student-info-item">
                            <span>Semester</span>
                            <strong>
                                {student.semester}
                            </strong>
                        </div>

                    </div>
                )}


                {error && (
                    <p className="dashboard-error">
                        {error}
                    </p>
                )}


                {/* Statistics */}

                <section className="dashboard-cards">

                    <div className="dashboard-card attendance-card">

                        <div className="card-icon attendance-icon">
                            %
                        </div>

                        <div className="dashboard-card-content">

                            <span className="dashboard-card-label">
                                Overall Attendance
                            </span>

                            <strong>
                                {loading
                                    ? "--"
                                    : `${attendancePercentage}%`}
                            </strong>

                            <p>
                                {attendancePercentage >= 75
                                    ? "You're above the 75% requirement"
                                    : "Attendance is below 75%"}
                            </p>

                        </div>

                    </div>


                    <div className="dashboard-card">

                        <div className="card-icon classes-icon">
                            #
                        </div>

                        <div className="dashboard-card-content">

                            <span className="dashboard-card-label">
                                Total Classes
                            </span>

                            <strong>
                                {loading
                                    ? "--"
                                    : totalClasses}
                            </strong>

                            <p>
                                Recorded sessions
                            </p>

                        </div>

                    </div>


                    <div className="dashboard-card">

                        <div className="card-icon present-icon">
                            ✓
                        </div>

                        <div className="dashboard-card-content">

                            <span className="dashboard-card-label">
                                Present
                            </span>

                            <strong>
                                {loading
                                    ? "--"
                                    : presentClasses}
                            </strong>

                            <p>
                                Classes attended
                            </p>

                        </div>

                    </div>


                    <div className="dashboard-card">

                        <div className="card-icon absent-icon">
                            !
                        </div>

                        <div className="dashboard-card-content">

                            <span className="dashboard-card-label">
                                Absent
                            </span>

                            <strong>
                                {loading
                                    ? "--"
                                    : absentClasses}
                            </strong>

                            <p>
                                Classes missed
                            </p>

                        </div>

                    </div>

                </section>


                {/* Main grid */}

                <div className="dashboard-grid">

                    {/* Attendance overview */}

                    <section className="dashboard-panel attendance-overview">

                        <div className="panel-header">

                            <div>
                                <h2>
                                    Attendance Overview
                                </h2>

                                <p>
                                    Your current attendance performance
                                </p>
                            </div>

                        </div>


                        <div className="attendance-overview-content">

                            <div
                                className="attendance-ring"
                                style={{
                                    "--attendance":
                                        `${attendancePercentage * 3.6}deg`
                                }}
                            >

                                <div className="attendance-ring-inner">

                                    <strong>
                                        {loading
                                            ? "--"
                                            : `${attendancePercentage}%`}
                                    </strong>

                                    <span>
                                        Attendance
                                    </span>

                                </div>

                            </div>


                            <div className="attendance-breakdown">

                                <div>

                                    <span className="legend-dot present-dot"></span>

                                    <div>
                                        <strong>
                                            {presentClasses}
                                        </strong>

                                        <span>
                                            Present
                                        </span>
                                    </div>

                                </div>


                                <div>

                                    <span className="legend-dot absent-dot"></span>

                                    <div>
                                        <strong>
                                            {absentClasses}
                                        </strong>

                                        <span>
                                            Absent
                                        </span>
                                    </div>

                                </div>


                                <div>

                                    <span className="legend-dot total-dot"></span>

                                    <div>
                                        <strong>
                                            {totalClasses}
                                        </strong>

                                        <span>
                                            Total
                                        </span>
                                    </div>

                                </div>

                            </div>

                        </div>

                    </section>


                    {/* Quick actions */}

                    <section className="dashboard-panel quick-actions">

                        <div className="panel-header">

                            <div>
                                <h2>
                                    Quick Actions
                                </h2>

                                <p>
                                    Access your FaceSecure services
                                </p>
                            </div>

                        </div>


                        {/* Face Enrollment / Attendance */}

                        <button
                            className="quick-action primary-action"
                            onClick={
                                faceEnrolled
                                    ? handleQuickAttendance
                                    : () =>
                                        navigate(
                                            "/face-enrollment"
                                        )
                            }
                        >

                            <span className="quick-action-icon">
                                {faceEnrolled ? "◉" : "◎"}
                            </span>

                            <div>

                                <strong>
                                    {faceEnrolled
                                        ? "Mark Attendance"
                                        : "Register Face"}
                                </strong>

                                <span>
                                    {faceEnrolled
                                        ? "Verify your face securely"
                                        : "Set up face verification"}
                                </span>

                            </div>

                            <span className="action-arrow">
                                →
                            </span>

                        </button>


                        <button className="quick-action">

                            <span className="quick-action-icon">
                                ▣
                            </span>

                            <div>
                                <strong>
                                    My Classes
                                </strong>

                                <span>
                                    View your enrolled classes
                                </span>
                            </div>

                            <span className="action-arrow">
                                →
                            </span>

                        </button>


                        <button className="quick-action">

                            <span className="quick-action-icon">
                                ▤
                            </span>

                            <div>
                                <strong>
                                    Attendance History
                                </strong>

                                <span>
                                    View all attendance records
                                </span>
                            </div>

                            <span className="action-arrow">
                                →
                            </span>

                        </button>

                    </section>

                </div>


                {/* Active classes */}

                <section className="dashboard-panel classes-panel">

                    <div className="panel-header">

                        <div>
                            <h2>
                                My Classes
                            </h2>

                            <p>
                                Your enrolled classes and active sessions
                            </p>
                        </div>

                        <span className="class-count">
                            {classes.length} class
                            {classes.length !== 1
                                ? "es"
                                : ""}
                        </span>

                    </div>


                    {classesLoading ? (

                        <p className="attendance-empty">
                            Loading classes...
                        </p>

                    ) : classes.length === 0 ? (

                        <div className="empty-state">

                            <div className="empty-state-icon">
                                📚
                            </div>

                            <strong>
                                No classes found
                            </strong>

                            <p>
                                You are not enrolled in any classes yet.
                            </p>

                        </div>

                    ) : (

                        <div className="classes-list">

                            {classes.map((classData) => {

                                const isActive =
                                    !!classData.activeSession;

                                return (
                                    <div
                                        className="class-item"
                                        key={classData.id}
                                    >

                                        <div className="class-main">

                                            <div className="class-icon">
                                                {classData.code
                                                    ?.charAt(0)
                                                    ?.toUpperCase() || "C"}
                                            </div>

                                            <div>

                                                <strong>
                                                    {classData.name}
                                                </strong>

                                                <span>
                                                    {classData.code}

                                                    {classData.faculty
                                                        ? ` • ${classData.faculty.name}`
                                                        : ""}
                                                </span>

                                            </div>

                                        </div>


                                        <div className="class-status">

                                            {isActive ? (

                                                faceEnrolled ? (

                                                    <>
                                                        <span className="active-badge">
                                                            <span></span>
                                                            Attendance Open
                                                        </span>

                                                        <button
                                                            className="class-attendance-button"
                                                            onClick={() =>
                                                                navigate(
                                                                    `/attendance?sessionId=${classData.activeSession._id}`
                                                                )
                                                            }
                                                        >
                                                            Mark Attendance
                                                        </button>
                                                    </>

                                                ) : (

                                                    <>
                                                        <span className="active-badge">
                                                            <span></span>
                                                            Attendance Open
                                                        </span>

                                                        <button
                                                            className="class-attendance-button"
                                                            onClick={() =>
                                                                navigate(
                                                                    "/face-enrollment"
                                                                )
                                                            }
                                                        >
                                                            Register Face
                                                        </button>
                                                    </>

                                                )

                                            ) : (

                                                <span className="inactive-badge">
                                                    Session Closed
                                                </span>

                                            )}

                                        </div>

                                    </div>
                                );
                            })}

                        </div>

                    )}

                </section>


                {/* Recent attendance */}

                <section className="dashboard-panel attendance-history">

                    <div className="attendance-history-header">

                        <div>
                            <h2>
                                Recent Attendance
                            </h2>

                            <p>
                                Your latest attendance records
                            </p>
                        </div>

                        <span>
                            {totalClasses} record
                            {totalClasses !== 1
                                ? "s"
                                : ""}
                        </span>

                    </div>


                    {loading ? (

                        <p className="attendance-empty">
                            Loading attendance...
                        </p>

                    ) : recentAttendance.length === 0 ? (

                        <p className="attendance-empty">
                            No attendance records yet.
                        </p>

                    ) : (

                        <div className="attendance-list">

                            {recentAttendance.map((record) => (

                                <div
                                    className="attendance-item"
                                    key={record._id}
                                >

                                    <div className="attendance-item-left">

                                        <div className="attendance-class-icon">
                                            {record.class?.code
                                                ?.charAt(0)
                                                ?.toUpperCase() || "C"}
                                        </div>

                                        <div>

                                            <strong>
                                                {record.class?.name ||
                                                    record.class?.code ||
                                                    "Class"}
                                            </strong>

                                            <p>
                                                {record.date
                                                    ? new Date(
                                                        record.date
                                                    ).toLocaleDateString(
                                                        "en-IN",
                                                        {
                                                            day: "numeric",
                                                            month: "short",
                                                            year: "numeric"
                                                        }
                                                    )
                                                    : "Date unavailable"}
                                            </p>

                                        </div>

                                    </div>


                                    <span
                                        className={
                                            record.status === "present"
                                                ? "attendance-present"
                                                : "attendance-absent"
                                        }
                                    >
                                        {record.status}
                                    </span>

                                </div>

                            ))}

                        </div>

                    )}

                </section>

            </main>

        </div>
    );
}

export default Dashboard;