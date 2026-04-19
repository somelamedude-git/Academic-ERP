import { useEffect, useState } from "react";
import Navbar from "../components/Navbar.jsx";
import Footer from "../components/Footer.jsx";
import { getMyCourses, assignGrades, getStudentsByCourse } from "../Services/api.js";
import "../Styles/Faculty.css";

const GRADE_OPTIONS = ["A", "A-", "B", "B-", "C", "C-", "D", "F"];

export default function FacultyGrades() {
  const [courses, setCourses] = useState([]);
  const [students, setStudents] = useState([]);
  const [studentsLoading, setStudentsLoading] = useState(false);

  const [form, setForm] = useState({
    courseId: "",
    studentId: "",
    branchCode: "",
    rollNumber: "",
    percentage: "",
    grade: "A",
  });

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Load faculty's courses on mount
  useEffect(() => {
    getMyCourses()
      .then(res => setCourses(res.courses ?? []))
      .catch(() => {});
  }, []);

  // When course changes, load students enrolled in that course's branches
  const handleCourseChange = async (courseId) => {
    setForm(p => ({ ...p, courseId, studentId: "", branchCode: "" }));
    setStudents([]);
    if (!courseId) return;

    setStudentsLoading(true);
    try {
      const res = await getStudentsByCourse(courseId);
      setStudents(res.students ?? []);
    } catch {
      setStudents([]);
    } finally {
      setStudentsLoading(false);
    }
  };

  const handleStudentChange = (studentId) => {
    const s = students.find(st => st._id === studentId);
    setForm(p => ({ ...p, studentId, branchCode: s?.branchCode ?? "" }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError("");
    setSuccess("");
    try {
      await assignGrades(
        form.studentId,
        form.courseId,
        form.branchCode,
        form.rollNumber ? Number(form.rollNumber) : undefined,
        form.percentage ? Number(form.percentage) : undefined,
        form.grade
      );
      setSuccess(`Grade "${form.grade}" assigned to student successfully.`);
      setForm(p => ({ ...p, studentId: "", branchCode: "", rollNumber: "", percentage: "", grade: "A" }));
    } catch (err) {
      setError(err.message || "Failed to assign grade.");
    } finally {
      setSubmitting(false);
    }
  };

  const selectedStudent = students.find(s => s._id === form.studentId);

  return (
    <div className="fc-page">
      <Navbar />
      <main className="fc-container">
        <header className="fc-header">
          <div>
            <h1>Assign Grades</h1>
            <p>Select a course first, then pick a student enrolled in that course.</p>
          </div>
        </header>

        {success && <p className="fc-success">{success}</p>}
        {error && <p className="fc-error">{error}</p>}

        <div className="fc-card" style={{ maxWidth: "640px" }}>
          <form onSubmit={handleSubmit} className="fc-form">

            {/* Step 1: Course */}
            <label>Course
              <select
                required
                value={form.courseId}
                onChange={e => handleCourseChange(e.target.value)}
              >
                <option value="">-- Select Course --</option>
                {courses.map(c => (
                  <option key={c._id} value={c._id}>{c.name} ({c.code})</option>
                ))}
              </select>
            </label>

            {/* Step 2: Student — only shown after course is selected */}
            {form.courseId && (
              <label>Student
                {studentsLoading ? (
                  <div style={{ padding: "10px 14px", color: "#6b7280", fontSize: "0.88rem" }}>
                    Loading students...
                  </div>
                ) : students.length === 0 ? (
                  <div style={{ padding: "10px 14px", background: "#fff7ed", borderRadius: "10px", color: "#9a3412", fontSize: "0.88rem" }}>
                    No students enrolled in branches for this course.
                  </div>
                ) : (
                  <select
                    required
                    value={form.studentId}
                    onChange={e => handleStudentChange(e.target.value)}
                  >
                    <option value="">-- Select Student --</option>
                    {students.map(s => (
                      <option key={s._id} value={s._id}>
                        {s.name} — {s.enrollmentNo} ({s.branchCode}, Sem {s.currentSemester})
                      </option>
                    ))}
                  </select>
                )}
              </label>
            )}

            {/* Student info badge */}
            {selectedStudent && (
              <div style={{ padding: "10px 14px", background: "#f0fdf4", borderRadius: "10px", fontSize: "0.88rem", color: "#166534" }}>
                Branch: <strong>{selectedStudent.branchCode}</strong> · Semester: <strong>{selectedStudent.currentSemester}</strong> · Degree: <strong>{selectedStudent.degree}</strong>
              </div>
            )}

            {/* Grade fields — only shown when both course and student are selected */}
            {form.courseId && form.studentId && (
              <>
                <div className="fc-form-row">
                  <label>Roll Number (optional)
                    <input
                      type="number"
                      value={form.rollNumber}
                      onChange={e => setForm(p => ({ ...p, rollNumber: e.target.value }))}
                      placeholder="e.g. 42"
                    />
                  </label>
                  <label>Percentage (optional)
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={form.percentage}
                      onChange={e => setForm(p => ({ ...p, percentage: e.target.value }))}
                      placeholder="e.g. 85"
                    />
                  </label>
                </div>

                <label>Grade
                  <select
                    required
                    value={form.grade}
                    onChange={e => setForm(p => ({ ...p, grade: e.target.value }))}
                  >
                    {GRADE_OPTIONS.map(g => <option key={g} value={g}>{g}</option>)}
                  </select>
                </label>

                <div className="fc-form-actions">
                  <button type="submit" className="fc-btn fc-btn--primary" disabled={submitting}>
                    {submitting ? "Saving..." : "Assign Grade"}
                  </button>
                </div>
              </>
            )}
          </form>
        </div>
      </main>
      <Footer />
    </div>
  );
}
