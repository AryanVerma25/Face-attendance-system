import { useState } from "react";
import { useNavigate } from "react-router-dom";

import api from "../services/api";
import "../styles/student-profile.css";

function StudentProfile() {
    const navigate = useNavigate();

    const [formData, setFormData] = useState({
        studentId: "",
        enrollmentNumber: "",
        department: "",
        semester: ""
    });

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const handleChange = (event) => {
        const { name, value } = event.target;

        setFormData((previous) => ({
            ...previous,
            [name]: value
        }));
    };

    const handleSubmit = async (event) => {
        event.preventDefault();

        setError("");
        setLoading(true);

        try {
            await api.post("/students", {
                studentId: formData.studentId.trim(),
                enrollmentNumber: formData.enrollmentNumber.trim(),
                department: formData.department.trim(),
                semester: Number(formData.semester)
            });

            navigate("/dashboard");

        } catch (error) {
            console.error(
                "Failed to create student profile:",
                error
            );

            setError(
                error.response?.data?.message ||
                "Unable to create student profile."
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="student-profile-page">

            <div className="student-profile-card">

                <div className="student-profile-header">

                    <div className="student-profile-logo">
                        F
                    </div>

                    <p className="student-profile-tag">
                        STUDENT PROFILE
                    </p>

                    <h1>
                        Complete Your Profile
                    </h1>

                    <p>
                        Enter your academic details to continue
                        using FaceSecure.
                    </p>

                </div>


                {error && (
                    <div className="student-profile-error">
                        {error}
                    </div>
                )}


                <form
                    className="student-profile-form"
                    onSubmit={handleSubmit}
                >

                    <div className="form-group">

                        <label htmlFor="studentId">
                            Student ID
                        </label>

                        <input
                            id="studentId"
                            name="studentId"
                            type="text"
                            placeholder="e.g. BU004"
                            value={formData.studentId}
                            onChange={handleChange}
                            required
                        />

                    </div>


                    <div className="form-group">

                        <label htmlFor="enrollmentNumber">
                            Enrollment Number
                        </label>

                        <input
                            id="enrollmentNumber"
                            name="enrollmentNumber"
                            type="text"
                            placeholder="Enter your enrollment number"
                            value={formData.enrollmentNumber}
                            onChange={handleChange}
                            required
                        />

                    </div>


                    <div className="form-group">

                        <label htmlFor="department">
                            Department
                        </label>

                        <input
                            id="department"
                            name="department"
                            type="text"
                            placeholder="e.g. Computer Science & Engineering"
                            value={formData.department}
                            onChange={handleChange}
                            required
                        />

                    </div>


                    <div className="form-group">

                        <label htmlFor="semester">
                            Semester
                        </label>

                        <select
                            id="semester"
                            name="semester"
                            value={formData.semester}
                            onChange={handleChange}
                            required
                        >

                            <option value="">
                                Select semester
                            </option>

                            <option value="1">
                                Semester 1
                            </option>

                            <option value="2">
                                Semester 2
                            </option>

                            <option value="3">
                                Semester 3
                            </option>

                            <option value="4">
                                Semester 4
                            </option>

                            <option value="5">
                                Semester 5
                            </option>

                            <option value="6">
                                Semester 6
                            </option>

                            <option value="7">
                                Semester 7
                            </option>

                            <option value="8">
                                Semester 8
                            </option>

                        </select>

                    </div>


                    <button
                        type="submit"
                        className="student-profile-button"
                        disabled={loading}
                    >
                        {loading
                            ? "Saving..."
                            : "Save & Continue →"}
                    </button>

                </form>


                <p className="student-profile-note">
                    Your academic information will be securely
                    associated with your FaceSecure account.
                </p>

            </div>

        </div>
    );
}

export default StudentProfile;