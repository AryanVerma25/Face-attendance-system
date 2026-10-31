import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import api from "../services/api";

import "../styles/faculty-dashboard.css";
import "../styles/faculty-class-details.css";

function FacultyClassDetails() {

    const { classId } = useParams();
    const navigate = useNavigate();

    const [classData, setClassData] = useState(null);
    const [studentId, setStudentId] = useState("");

    const [loading, setLoading] = useState(true);
    const [adding, setAdding] = useState(false);

    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    const user = JSON.parse(
        localStorage.getItem("user")
    );


    // ==========================================
    // FETCH CLASS DETAILS
    // ==========================================

    const fetchClassDetails = async () => {

        try {

            setLoading(true);
            setError("");

            const response = await api.get(
                `/classes/${classId}`
            );

            setClassData(
                response.data.class
            );

        } catch (error) {

            console.error(
                "FETCH CLASS DETAILS ERROR:",
                error
            );

            setError(
                error.response?.data?.message ||
                "Failed to load class details"
            );

        } finally {

            setLoading(false);

        }
    };


    useEffect(() => {

        fetchClassDetails();

    }, [classId]);


    // ==========================================
    // ADD STUDENT
    // ==========================================

    const handleAddStudent = async (e) => {

        e.preventDefault();

        setError("");
        setSuccess("");

        if (!studentId.trim()) {

            setError(
                "Please enter a student ID"
            );

            return;
        }

        try {

            setAdding(true);

            const response = await api.post(
                `/classes/${classId}/students`,
                {
                    studentId: studentId.trim()
                }
            );

            setSuccess(
                response.data.message ||
                "Student added successfully"
            );

            setStudentId("");

            await fetchClassDetails();

        } catch (error) {

            console.error(
                "ADD STUDENT ERROR:",
                error
            );

            setError(
                error.response?.data?.message ||
                "Failed to add student"
            );

        } finally {

            setAdding(false);

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
    // LOADING
    // ==========================================

    if (loading) {

        return (
            <div className="faculty-dashboard-page">

                <header className="faculty-navbar">

                    <div className="faculty-navbar-inner">

                        <div
                            className="faculty-brand"
                            onClick={() =>
                                navigate("/faculty/dashboard")
                            }
                        >

                            <div className="faculty-brand-icon">
                                F
                            </div>

                            <span>
                                FaceSecure
                            </span>

                        </div>

                    </div>

                </header>


                <main className="faculty-main">

                    <div className="class-details-loading">
                        Loading class...
                    </div>

                </main>

            </div>
        );
    }


    // ==========================================
    // MAIN UI
    // ==========================================

    return (

        <div className="faculty-dashboard-page">

            {/* ==================================
                NAVBAR
            ================================== */}

            <header className="faculty-navbar">

                <div className="faculty-navbar-inner">

                    <div
                        className="faculty-brand"
                        onClick={() =>
                            navigate("/faculty/dashboard")
                        }
                    >

                        <div className="faculty-brand-icon">
                            F
                        </div>

                        <span>
                            FaceSecure
                        </span>

                    </div>


                    <div className="faculty-user-section">

                        <div className="faculty-user-info">

                            <div className="faculty-avatar">

                                {user?.name
                                    ?.charAt(0)
                                    ?.toUpperCase() || "F"}

                            </div>

                            <div>

                                <strong>
                                    {user?.name || "Faculty"}
                                </strong>

                                <span>
                                    Faculty
                                </span>

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


            {/* ==================================
                MAIN
            ================================== */}

            <main className="faculty-main">

                {/* BACK */}

                <button
                    type="button"
                    className="class-back-button"
                    onClick={() =>
                        navigate("/faculty/dashboard")
                    }
                >
                    ← Back to Dashboard
                </button>


                {/* ==================================
                    CLASS HEADER
                ================================== */}

                <section className="class-details-header">

                    <div>

                        <p className="faculty-label">
                            CLASS MANAGEMENT
                        </p>

                        <h1>
                            {classData?.name}
                        </h1>

                        <p className="class-details-code">
                            {classData?.code}
                        </p>

                    </div>


                    <div className="class-details-badge">

                        {classData?.students?.length || 0}

                        {" "}

                        {classData?.students?.length === 1
                            ? "Student"
                            : "Students"}

                    </div>

                </section>


                {/* ==================================
                    ERROR
                ================================== */}

                {error && (

                    <div className="faculty-error">
                        {error}
                    </div>

                )}


                {/* ==================================
                    SUCCESS
                ================================== */}

                {success && (

                    <div className="faculty-success">
                        {success}
                    </div>

                )}


                {/* ==================================
                    ADD STUDENT
                ================================== */}

                <section className="class-details-panel">

                    <div className="class-panel-title">

                        <div>

                            <h2>
                                Add Student
                            </h2>

                            <p>
                                Enroll a student using their Student ID.
                            </p>

                        </div>

                    </div>


                    <form
                        className="add-student-form"
                        onSubmit={handleAddStudent}
                    >

                        <div className="faculty-input-group">

                            <label>
                                Student ID
                            </label>

                            <input
                                type="text"
                                placeholder="e.g. BU001"
                                value={studentId}
                                onChange={(e) =>
                                    setStudentId(
                                        e.target.value
                                    )
                                }
                            />

                        </div>


                        <button
                            type="submit"
                            className="faculty-primary-button"
                            disabled={adding}
                        >
                            {adding
                                ? "Adding..."
                                : "+ Add Student"}
                        </button>

                    </form>

                </section>


                {/* ==================================
                    ENROLLED STUDENTS
                ================================== */}

                <section className="class-details-panel">

                    <div className="class-panel-title">

                        <div>

                            <h2>
                                Enrolled Students
                            </h2>

                            <p>
                                Students currently enrolled in this class.
                            </p>

                        </div>


                        <span className="faculty-count">

                            {classData?.students?.length || 0}

                            {" "}

                            {classData?.students?.length === 1
                                ? "student"
                                : "students"}

                        </span>

                    </div>


                    {classData?.students?.length === 0 ? (

                        <div className="class-empty">

                            <div className="class-empty-icon">
                                👨‍🎓
                            </div>

                            <h3>
                                No students enrolled
                            </h3>

                            <p>
                                Add a student using their Student ID above.
                            </p>

                        </div>

                    ) : (

                        <div className="students-table-wrapper">

                            <table className="students-table">

                                <thead>

                                    <tr>

                                        <th>
                                            Name
                                        </th>

                                        <th>
                                            Student ID
                                        </th>

                                        <th>
                                            Enrollment Number
                                        </th>

                                        <th>
                                            Department
                                        </th>

                                        <th>
                                            Semester
                                        </th>

                                    </tr>

                                </thead>


                                <tbody>

                                    {classData.students.map(
                                        (student) => (

                                            <tr
                                                key={student._id}
                                            >

                                                {/* NAME */}

                                                <td>

                                                    <div className="student-id-cell">

                                                        <div className="student-avatar">

                                                            {student.user?.name
                                                                ?.charAt(0)
                                                                ?.toUpperCase() || "S"}

                                                        </div>

                                                        <strong>

                                                            {student.user?.name ||
                                                                "Unknown Student"}

                                                        </strong>

                                                    </div>

                                                </td>


                                                {/* STUDENT ID */}

                                                <td>
                                                    {student.studentId}
                                                </td>


                                                {/* ENROLLMENT NUMBER */}

                                                <td>
                                                    {student.enrollmentNumber}
                                                </td>


                                                {/* DEPARTMENT */}

                                                <td>
                                                    {student.department}
                                                </td>


                                                {/* SEMESTER */}

                                                <td>
                                                    Semester{" "}
                                                    {student.semester}
                                                </td>

                                            </tr>

                                        )
                                    )}

                                </tbody>

                            </table>

                        </div>

                    )}

                </section>

            </main>

        </div>
    );
}

export default FacultyClassDetails;