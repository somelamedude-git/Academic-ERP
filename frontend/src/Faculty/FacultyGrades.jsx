import { useEffect, useState } from "react";
import Navbar from "../components/Navbar.jsx";
import Footer from "../components/Footer.jsx";
import { getMyCourses, assignGrades, listStudents } from "../Services/api.js";
import "../Styles/Faculty.css";

const GRADE_OPTIONS = ["O", "A+", "A", "B+", "B", "C", "D", "F", "Pending"];

export default function FacultyGrades() {
  const [courses, setCourses] = useState([]);
  const [students, setStudents] = useState([]);
  const [form, setForm] = useState({ studentId: "", courseId: "", branchCode: "", rollNumber: "", percentage: "", grade: "A" });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    Promise.all([getMyCourses(), listStudents()])
      .then(([cRes, sRes]) => {
        setCourses(cRes.courses ?? []);
        setStudents(sRes.students ?? []);
      })
      .catch(() => {});
  }, []);

  const selectedStudent = students.find(s => s._id === form.studentId);

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
        form.studentId, form.courseId, form.branchCode,
        form.rollNumber ? Number(form.rollNumber) : undefined,
        form.percentage ? Number(form.percentage) : undefined,
        form.grade
      );
      setSuccess(`Grade "${form.grade}" assigned successfully.`);
      setForm(p => ({ ...p, rollNumber: "", percentage: "", grade: "A" }));
    } catch (err) {
      setError(err.message || "Failed to assign grade.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fc-page">
      <Navbar />
      <main className="fc-container">
        <header className="fc-header">
          <div>
            <h1>Assign Grades</h1>
            <p>Assign final grades to students for your courses.</p>
          </div>
        </header>

        {success && <p className="fc-success">{success}</p>}
        {error && <p className="fc-error">{error}</p>}

        <div className="fc-card" style={{ maxWidth: "640px" }}>
          <form onSubmit={handleSubmit} className="fc-form">
            <label>Student
              <select required value={form.studentId} onChange={e => handleStudentChange(e.target.value)}>
                <option value="">-- Select Student --</option>
                {students.map(s => (
                  <option key={s._id} value={s._id}>{s.name} — {s.enrollmentNo} ({s.branchCode})</option>
                ))}
              </select>
            </label>

            <label>Course
              <select required value={form.courseId} onChange={e => setForm(p => ({ ...p, courseId: e.target.value }))}>
                <option value="">-- Select Course --</option>
                {courses.map(c => <option key={c._id} value={c._id}>{c.name} ({c.code})</option>)}
              </select>
            </label>

            {selectedStudent && (
              <div style={{ padding: "10px 14px", background: "#f0fdf4", borderRadius: "10px", fontSize: "0.88rem", color: "#166534" }}>
                Branch: <strong>{selectedStudent.branchCode}</strong> · Semester: <strong>{selectedStudent.currentSemester}</strong>
              </div>
            )}

            <div className="fc-form-row">
              <label>Roll Number (optional)
                <input type="number" value={form.rollNumber} onChange={e => setForm(p => ({ ...p, rollNumber: e.target.value }))} placeholder="e.g. 42" />
              </label>
              <label>Percentage (optional)
                <input type="number" min="0" max="100" value={form.percentage} onChange={e => setForm(p => ({ ...p, percentage: e.target.value }))} placeholder="e.g. 85" />
              </label>
            </div>

            <label>Grade
              <select required value={form.grade} onChange={e => setForm(p => ({ ...p, grade: e.target.value }))}>
                {GRADE_OPTIONS.map(g => <option key={g} value={g}>{g}</option>)}
              </select>
            </label>

            <div className="fc-form-actions">
              <button type="submit" className="fc-btn fc-btn--primary" disabled={submitting}>
                {submitting ? "Saving..." : "Assign Grade"}
              </button>
            </div>
          </form>
        </div>
      </main>
      <Footer />
    </div>
  );
}
