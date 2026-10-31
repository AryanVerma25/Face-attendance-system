import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import "../styles/faculty-dashboard.css";

function FacultyDashboard() {
    const navigate = useNavigate();

    const [classes, setClasses] = useState([]);
    const [sessions, setSessions] = useState([]);
    const [loading, setLoading] = useState(true);

    const [className, setClassName] = useState("");
    const [classCode, setClassCode] = useState("");
    const [creating, setCreating] = useState(false);

    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    // Attendance reports
    const [showReports, setShowReports] = useState(false);
    const [reportClassId, setReportClassId] = useState("");
    const [reportLoading, setReportLoading] = useState(false);
    const [reportError, setReportError] = useState("");
    const [reportSummary, setReportSummary] = useState(null);
    const [studentReports, setStudentReports] = useState([]);
    const [sessionHistory, setSessionHistory] = useState([]);
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");

    const user = JSON.parse(localStorage.getItem("user") || "null");

    // ==========================================
    // FETCH CLASSES AND SESSIONS
    // ==========================================

    const fetchClasses = async () => {
        try {
            setLoading(true);
            setError("");

            const [classResponse, sessionResponse] = await Promise.all([
                api.get("/classes/my-classes"),
                api.get("/sessions/my-sessions")
            ]);

            setClasses(classResponse.data.classes || []);
            setSessions(sessionResponse.data.sessions || []);

        } catch (error) {
            console.error("FETCH DASHBOARD ERROR:", error);

            setError(
                error.response?.data?.message ||
                "Failed to load dashboard data"
            );
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchClasses();
    }, []);

    // ==========================================
    // CREATE CLASS
    // ==========================================

    const handleCreateClass = async (e) => {
        e.preventDefault();

        setError("");
        setSuccess("");

        if (!className.trim() || !classCode.trim()) {
            setError("Class name and class code are required");
            return;
        }

        try {
            setCreating(true);

            const response = await api.post("/classes", {
                name: className.trim(),
                code: classCode.trim()
            });

            setSuccess(
                response.data.message ||
                "Class created successfully"
            );

            setClassName("");
            setClassCode("");

            await fetchClasses();

        } catch (error) {
            console.error("CREATE CLASS ERROR:", error);

            setError(
                error.response?.data?.message ||
                "Failed to create class"
            );
        } finally {
            setCreating(false);
        }
    };

    // ==========================================
    // LOGOUT
    // ==========================================

    const handleLogout = () => {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        navigate("/login");
    };

    // ==========================================
    // DASHBOARD STATISTICS
    // ==========================================

    const totalStudents = classes.reduce(
        (total, classItem) =>
            total + (classItem.students?.length || 0),
        0
    );

    const activeSessions = sessions.filter(
        session => session.status === "active"
    ).length;

    const today = new Date();

    const todaySessions = sessions.filter(session => {
        if (!session.startedAt) return false;

        const sessionDate = new Date(session.startedAt);

        return (
            sessionDate.getDate() === today.getDate() &&
            sessionDate.getMonth() === today.getMonth() &&
            sessionDate.getFullYear() === today.getFullYear()
        );
    });

    const todayPresent = todaySessions.reduce(
        (total, session) =>
            total + (session.attendanceStats?.present || 0),
        0
    );

    const todayPossible = todaySessions.reduce(
        (total, session) =>
            total + (session.attendanceStats?.enrolledStudents || 0),
        0
    );

    const todayAttendance = todayPossible > 0
        ? Math.round((todayPresent / todayPossible) * 100)
        : 0;

    // ==========================================
    // CLASS SESSION COUNT
    // ==========================================

    const getClassSessionCount = (classId) => {
        return sessions.filter(
            session =>
                (session.class?._id || session.class)?.toString() ===
                classId.toString()
        ).length;
    };

    // ==========================================
    // OPEN CLASS DETAILS
    // ==========================================

    const handleViewClass = (classItem) => {
        navigate(`/faculty/classes/${classItem._id}`);
    };

    // ==========================================
    // START ATTENDANCE
    // ==========================================

    const handleStartAttendance = async () => {
        setError("");
        setSuccess("");

        if (classes.length === 0) {
            setError("Create a class before starting attendance");
            return;
        }

        let selectedClass = classes[0];

        if (classes.length > 1) {
            const classOptions = classes
                .map(
                    (item, index) =>
                        `${index + 1}. ${item.name} (${item.code})`
                )
                .join("\n");

            const choice = window.prompt(
                `Select a class by entering its number:\n\n${classOptions}`
            );

            if (choice === null) return;

            const index = Number(choice) - 1;

            if (!Number.isInteger(index) || !classes[index]) {
                setError("Invalid class selection");
                return;
            }

            selectedClass = classes[index];
        }

        try {
            const response = await api.post("/sessions", {
                classId: selectedClass._id
            });

            setSuccess(
                response.data.message ||
                "Attendance session started successfully"
            );

            await fetchClasses();

        } catch (error) {
            console.error("START ATTENDANCE ERROR:", error);

            setError(
                error.response?.data?.message ||
                "Failed to start attendance session"
            );
        }
    };

    // ==========================================
    // CLOSE ATTENDANCE SESSION
    // ==========================================

    const handleCloseSession = async (sessionId) => {
        const confirmed = window.confirm(
            "Are you sure you want to close this attendance session? Remaining enrolled students will be marked absent."
        );

        if (!confirmed) return;

        try {
            setError("");
            setSuccess("");

            const response = await api.patch(
                `/sessions/${sessionId}/close`
            );

            setSuccess(
                response.data.message ||
                "Attendance session closed successfully"
            );

            await fetchClasses();

        } catch (error) {
            console.error("CLOSE SESSION ERROR:", error);

            setError(
                error.response?.data?.message ||
                "Failed to close attendance session"
            );
        }
    };

    // ==========================================
    // FETCH ATTENDANCE REPORTS
    // ==========================================

    const fetchAttendanceReports = async () => {
        if (!reportClassId) {
            setReportError("Please select a class first");
            return;
        }

        if (startDate && endDate && startDate > endDate) {
            setReportError("Start date cannot be after end date");
            return;
        }

        try {
            setReportLoading(true);
            setReportError("");

            const params = {};

            if (startDate) params.startDate = startDate;
            if (endDate) params.endDate = endDate;

            const [
                reportResponse,
                studentResponse,
                historyResponse
            ] = await Promise.all([
                api.get(
                    `/attendance/class/${reportClassId}/report`,
                    { params }
                ),
                api.get(
                    `/attendance/class/${reportClassId}/students`,
                    { params }
                ),
                api.get(
                    `/attendance/class/${reportClassId}/history`,
                    { params }
                )
            ]);

            const reportData =
                reportResponse.data.report ||
                reportResponse.data;

            setReportSummary(reportData.summary || null);

            setStudentReports(
                studentResponse.data.students || []
            );

            setSessionHistory(
                historyResponse.data.sessions ||
                historyResponse.data.history ||
                []
            );

        } catch (error) {
            console.error("ATTENDANCE REPORT ERROR:", error);

            setReportError(
                error.response?.data?.message ||
                "Failed to load attendance reports"
            );

            setReportSummary(null);
            setStudentReports([]);
            setSessionHistory([]);

        } finally {
            setReportLoading(false);
        }
    };

    // ==========================================
    // FIND ACTIVE SESSION
    // ==========================================

    const activeReportSession = sessionHistory.find(
        session => session.status === "active"
    );

    // ==========================================
    // GET CURRENT SESSION STUDENT STATUS
    // ==========================================

    const getActiveSessionStudentStatus = (studentId) => {
        if (!activeReportSession) {
            return "—";
        }

        const attendanceRecord = (
            activeReportSession.attendance || []
        ).find(record => {
            const recordStudentId =
                record.student?.studentId ||
                record.studentId;

            return (
                recordStudentId?.toString() ===
                studentId?.toString()
            );
        });

        if (attendanceRecord?.status === "present") {
            return "Present";
        }

        return "Pending";
    };

    // ==========================================
    // OPEN REPORTS
    // ==========================================

    const openReports = () => {
        setError("");
        setReportError("");
        setShowReports(true);

        setTimeout(() => {
            document
                .getElementById("faculty-attendance-reports")
                ?.scrollIntoView({
                    behavior: "smooth"
                });
        }, 100);
    };

    // ==========================================
    // RENDER
    // ==========================================

    return (
        <div className="faculty-dashboard-page">

            {/* NAVBAR */}

            <header className="faculty-navbar">
                <div className="faculty-navbar-inner">

                    <div
                        className="faculty-brand"
                        onClick={() => navigate("/faculty/dashboard")}
                    >
                        <div className="faculty-brand-icon">
                            F
                        </div>

                        <span>FaceSecure</span>
                    </div>

                    <div className="faculty-user-section">

                        <div className="faculty-user-info">

                            <div className="faculty-avatar">
                                {user?.name?.charAt(0)?.toUpperCase() || "F"}
                            </div>

                            <div>
                                <strong>
                                    {user?.name || "Faculty"}
                                </strong>
                                <span>Faculty</span>
                            </div>

                        </div>

                        <button
                            type="button"
                            className="faculty-logout"
                            onClick={handleLogout}
                        >
                            Logout
                        </button>

                    </div>
                </div>
            </header>

            <main className="faculty-main">

                {/* WELCOME */}

                <section className="faculty-welcome">
                    <div>
                        <p className="faculty-label">
                            FACULTY DASHBOARD
                        </p>

                        <h1>
                            Welcome back, {user?.name || "Faculty"} 👋
                        </h1>

                        <p className="faculty-subtitle">
                            Manage your classes, students and attendance sessions.
                        </p>
                    </div>
                </section>

                {/* ERROR */}

                {error && (
                    <div className="faculty-error">
                        {error}
                    </div>
                )}

                {/* SUCCESS */}

                {success && (
                    <div className="faculty-success">
                        {success}
                    </div>
                )}

                {/* DASHBOARD STATISTICS */}

                <section className="faculty-stats">

                    <div className="faculty-stat-card">
                        <div className="faculty-stat-icon blue">
                            #
                        </div>

                        <div>
                            <span>Total Classes</span>
                            <strong>{classes.length}</strong>
                            <small>Classes created</small>
                        </div>
                    </div>

                    <div className="faculty-stat-card">
                        <div className="faculty-stat-icon purple">
                            #
                        </div>

                        <div>
                            <span>Total Students</span>
                            <strong>{totalStudents}</strong>
                            <small>Enrolled students</small>
                        </div>
                    </div>

                    <div className="faculty-stat-card">
                        <div className="faculty-stat-icon green">
                            ✓
                        </div>

                        <div>
                            <span>Active Sessions</span>
                            <strong>{activeSessions}</strong>
                            <small>Currently running</small>
                        </div>
                    </div>

                    <div className="faculty-stat-card">
                        <div className="faculty-stat-icon orange">
                            %
                        </div>

                        <div>
                            <span>Today's Attendance</span>
                            <strong>{todayAttendance}%</strong>
                            <small>Today's attendance rate</small>
                        </div>
                    </div>

                </section>

                {/* CREATE CLASS AND QUICK ACTIONS */}

                <section className="faculty-middle-grid">

                    {/* CREATE CLASS */}

                    <div className="faculty-panel">

                        <div className="faculty-panel-header">
                            <div>
                                <h2>Create New Class</h2>
                                <p>
                                    Add a class to start managing attendance.
                                </p>
                            </div>
                        </div>

                        <form
                            className="faculty-class-form"
                            onSubmit={handleCreateClass}
                        >

                            <div className="faculty-input-group">
                                <label>Class Name</label>

                                <input
                                    type="text"
                                    placeholder="e.g. Computer Networks"
                                    value={className}
                                    onChange={(e) =>
                                        setClassName(e.target.value)
                                    }
                                />
                            </div>

                            <div className="faculty-input-group">
                                <label>Class Code</label>

                                <input
                                    type="text"
                                    placeholder="e.g. CSE203"
                                    value={classCode}
                                    onChange={(e) =>
                                        setClassCode(e.target.value)
                                    }
                                />
                            </div>

                            <button
                                type="submit"
                                className="faculty-primary-button"
                                disabled={creating}
                            >
                                {creating
                                    ? "Creating..."
                                    : "+ Create Class"}
                            </button>

                        </form>
                    </div>

                    {/* QUICK ACTIONS */}

                    <div className="faculty-panel">

                        <div className="faculty-panel-header">
                            <div>
                                <h2>Quick Actions</h2>
                                <p>
                                    Manage your FaceSecure services.
                                </p>
                            </div>
                        </div>

                        <div className="faculty-actions">

                            <button
                                type="button"
                                className="faculty-action"
                                onClick={() =>
                                    document
                                        .getElementById("faculty-classes")
                                        ?.scrollIntoView({
                                            behavior: "smooth"
                                        })
                                }
                            >
                                <div className="action-icon blue">
                                    ▣
                                </div>

                                <div>
                                    <strong>My Classes</strong>
                                    <span>View your classes</span>
                                </div>

                                <span className="action-arrow">
                                    →
                                </span>
                            </button>

                            <button
                                type="button"
                                className="faculty-action"
                                onClick={handleStartAttendance}
                                disabled={loading}
                            >
                                <div className="action-icon green">
                                    ✓
                                </div>

                                <div>
                                    <strong>Start Attendance</strong>
                                    <span>Start a class session</span>
                                </div>

                                <span className="action-arrow">
                                    →
                                </span>
                            </button>

                            <button
                                type="button"
                                className="faculty-action"
                                onClick={openReports}
                            >
                                <div className="action-icon purple">
                                    ▤
                                </div>

                                <div>
                                    <strong>Attendance Reports</strong>
                                    <span>View attendance records</span>
                                </div>

                                <span className="action-arrow">
                                    →
                                </span>
                            </button>

                        </div>
                    </div>

                </section>

                {/* MY CLASSES */}

                <section
                    className="faculty-classes-section"
                    id="faculty-classes"
                >

                    <div className="faculty-section-header">

                        <div>
                            <h2>My Classes</h2>
                            <p>
                                Your classes and enrolled students.
                            </p>
                        </div>

                        <span className="faculty-count">
                            {classes.length}{" "}
                            {classes.length === 1 ? "class" : "classes"}
                        </span>

                    </div>

                    {loading ? (
                        <div className="faculty-empty">
                            <div className="faculty-loader">
                                Loading...
                            </div>
                        </div>
                    ) : classes.length === 0 ? (
                        <div className="faculty-empty">
                            <div className="empty-icon">
                                📚
                            </div>

                            <h3>No classes yet</h3>

                            <p>
                                Create your first class above to start managing attendance.
                            </p>
                        </div>
                    ) : (
                        <div className="faculty-class-grid">

                            {classes.map((classItem) => {
                                const classSessions = sessions.filter(
                                    session =>
                                        (session.class?._id || session.class)?.toString() ===
                                        classItem._id.toString()
                                );

                                const activeSession = classSessions.find(
                                    session => session.status === "active"
                                );

                                const hasActiveSession =
                                    Boolean(activeSession);

                                return (
                                    <div
                                        className="faculty-class-card"
                                        key={classItem._id}
                                    >

                                        <div className="class-card-top">
                                            <div className="class-icon">
                                                📚
                                            </div>

                                            <span className="class-status">
                                                {hasActiveSession
                                                    ? "Attendance Open"
                                                    : "Active"}
                                            </span>
                                        </div>

                                        <h3>{classItem.name}</h3>

                                        <p className="class-code">
                                            {classItem.code}
                                        </p>

                                        <div className="class-card-info">

                                            <div>
                                                <span>Students</span>
                                                <strong>
                                                    {classItem.students?.length || 0}
                                                </strong>
                                            </div>

                                            <div>
                                                <span>Sessions</span>
                                                <strong>
                                                    {getClassSessionCount(classItem._id)}
                                                </strong>
                                            </div>

                                        </div>

                                        {hasActiveSession && (
                                            <button
                                                type="button"
                                                className="view-class-button"
                                                onClick={() =>
                                                    handleCloseSession(activeSession._id)
                                                }
                                            >
                                                Close Attendance
                                                <span>×</span>
                                            </button>
                                        )}

                                        <button
                                            type="button"
                                            className="view-class-button"
                                            onClick={() =>
                                                handleViewClass(classItem)
                                            }
                                        >
                                            View Class
                                            <span>→</span>
                                        </button>

                                    </div>
                                );
                            })}

                        </div>
                    )}

                </section>

                {/* ATTENDANCE REPORTS */}

                {showReports && (
                    <section
                        className="faculty-reports-section"
                        id="faculty-attendance-reports"
                    >

                        <div className="faculty-section-header">
                            <div>
                                <h2>Attendance Reports</h2>
                                <p>
                                    Monitor student attendance and session history.
                                </p>
                            </div>

                            <button
                                type="button"
                                className="report-close-button"
                                onClick={() => setShowReports(false)}
                            >
                                Close
                            </button>
                        </div>

                        {/* FILTERS */}

                        <div className="report-filters">

                            <div className="report-filter-group">
                                <label htmlFor="report-class">
                                    Select Class
                                </label>

                                <select
                                    id="report-class"
                                    value={reportClassId}
                                    onChange={(e) => {
                                        setReportClassId(e.target.value);
                                        setReportSummary(null);
                                        setStudentReports([]);
                                        setSessionHistory([]);
                                        setReportError("");
                                    }}
                                >
                                    <option value="">
                                        Choose a class
                                    </option>

                                    {classes.map((classItem) => (
                                        <option
                                            key={classItem._id}
                                            value={classItem._id}
                                        >
                                            {classItem.name} ({classItem.code})
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="report-filter-group">
                                <label htmlFor="report-start-date">
                                    Start Date
                                </label>

                                <input
                                    id="report-start-date"
                                    type="date"
                                    value={startDate}
                                    onChange={(e) =>
                                        setStartDate(e.target.value)
                                    }
                                />
                            </div>

                            <div className="report-filter-group">
                                <label htmlFor="report-end-date">
                                    End Date
                                </label>

                                <input
                                    id="report-end-date"
                                    type="date"
                                    value={endDate}
                                    onChange={(e) =>
                                        setEndDate(e.target.value)
                                    }
                                />
                            </div>

                            <button
                                type="button"
                                className="faculty-primary-button"
                                onClick={fetchAttendanceReports}
                                disabled={reportLoading || !reportClassId}
                            >
                                {reportLoading
                                    ? "Loading..."
                                    : "Generate Report"}
                            </button>

                        </div>

                        {reportError && (
                            <div className="faculty-error">
                                {reportError}
                            </div>
                        )}

                        {reportLoading ? (
                            <div className="faculty-empty">
                                Loading attendance reports...
                            </div>
                        ) : reportSummary ? (
                            <>

                                {/* SUMMARY CARDS */}

                                <div className="report-summary-grid">

                                    <div className="report-stat-card">
                                        <span>Total Students</span>
                                        <strong>
                                            {reportSummary.totalStudents ?? 0}
                                        </strong>
                                    </div>

                                    <div className="report-stat-card">
                                        <span>Total Sessions</span>
                                        <strong>
                                            {reportSummary.totalSessions ?? 0}
                                        </strong>
                                    </div>

                                    <div className="report-stat-card">
                                        <span>Present</span>
                                        <strong className="report-present">
                                            {reportSummary.present ?? 0}
                                        </strong>
                                    </div>

                                    <div className="report-stat-card">
                                        <span>Absent</span>
                                        <strong className="report-absent">
                                            {reportSummary.absent ?? 0}
                                        </strong>
                                    </div>

                                    <div className="report-stat-card">
                                        <span>Attendance Rate</span>
                                        <strong>
                                            {reportSummary.attendancePercentage ?? 0}%
                                        </strong>
                                    </div>

                                </div>

                                {/* STUDENT-WISE REPORT */}

                                <div className="report-table-panel">

                                    <h3>Student-wise Attendance</h3>

                                    {studentReports.length === 0 ? (
                                        <p className="report-no-data">
                                            No student records available.
                                        </p>
                                    ) : (
                                        <div className="report-table-wrapper">

                                            <table className="report-table">

                                                <thead>
                                                    <tr>
                                                        <th>Student ID</th>
                                                        <th>Present</th>
                                                        <th>Absent</th>
                                                        <th>Total Sessions</th>
                                                        <th>Attendance</th>
                                                        <th>Current Session</th>
                                                    </tr>
                                                </thead>

                                                <tbody>

                                                    {studentReports.map((student, index) => {
                                                        const currentStatus =
                                                            getActiveSessionStudentStatus(
                                                                student.studentId
                                                            );

                                                        return (
                                                            <tr
                                                                key={
                                                                    student.studentId ||
                                                                    student._id ||
                                                                    index
                                                                }
                                                            >

                                                                <td>
                                                                    <strong>
                                                                        {student.studentId || "—"}
                                                                    </strong>
                                                                </td>

                                                                <td className="report-present">
                                                                    {student.present ?? 0}
                                                                </td>

                                                                <td className="report-absent">
                                                                    {student.absent ?? 0}
                                                                </td>

                                                                <td>
                                                                    {student.totalSessions ?? 0}
                                                                </td>

                                                                <td>
                                                                    <span className="report-percentage">
                                                                        {student.attendancePercentage ?? 0}%
                                                                    </span>
                                                                </td>

                                                                <td>
                                                                    <span
                                                                        style={{
                                                                            display: "inline-block",
                                                                            padding: "5px 10px",
                                                                            borderRadius: "20px",
                                                                            fontSize: "11px",
                                                                            fontWeight: 700,
                                                                            color:
                                                                                currentStatus === "Pending"
                                                                                    ? "#b45309"
                                                                                    : currentStatus === "Present"
                                                                                    ? "#047857"
                                                                                    : "#6b7280",
                                                                            background:
                                                                                currentStatus === "Pending"
                                                                                    ? "#fef3c7"
                                                                                    : currentStatus === "Present"
                                                                                    ? "#d1fae5"
                                                                                    : "#f3f4f6"
                                                                        }}
                                                                    >
                                                                        {currentStatus}
                                                                    </span>
                                                                </td>

                                                            </tr>
                                                        );
                                                    })}

                                                </tbody>
                                            </table>
                                        </div>
                                    )}
                                </div>

                                {/* SESSION HISTORY */}

                                <div className="report-table-panel">

                                    <h3>Session History</h3>

                                    {sessionHistory.length === 0 ? (
                                        <p className="report-no-data">
                                            No session history available.
                                        </p>
                                    ) : (
                                        <div className="report-table-wrapper">

                                            <table className="report-table">

                                                <thead>
                                                    <tr>
                                                        <th>Session</th>
                                                        <th>Date</th>
                                                        <th>Status</th>
                                                        <th>Attendance Records</th>
                                                    </tr>
                                                </thead>

                                                <tbody>

                                                    {sessionHistory.map((session, index) => (
                                                        <tr
                                                            key={
                                                                session.sessionId ||
                                                                session._id ||
                                                                index
                                                            }
                                                        >

                                                            <td>
                                                                Session {index + 1}
                                                            </td>

                                                            <td>
                                                                {session.startedAt
                                                                    ? new Date(
                                                                        session.startedAt
                                                                    ).toLocaleDateString("en-IN")
                                                                    : "Not started"}
                                                            </td>

                                                            <td>
                                                                <span
                                                                    className={`report-status ${session.status || ""}`}
                                                                >
                                                                    {session.status || "unknown"}
                                                                </span>
                                                            </td>

                                                            <td>
                                                                {session.attendance?.length ?? 0}
                                                            </td>

                                                        </tr>
                                                    ))}

                                                </tbody>
                                            </table>
                                        </div>
                                    )}
                                </div>

                            </>
                        ) : (
                            <div className="report-empty-state">
                                <div>📊</div>
                                <h3>Generate an Attendance Report</h3>
                                <p>
                                    Select a class and click Generate Report
                                    to view attendance statistics.
                                </p>
                            </div>
                        )}

                    </section>
                )}

            </main>
        </div>
    );
}

export default FacultyDashboard;