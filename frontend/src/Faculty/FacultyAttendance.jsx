import { useEffect, useState } from "react";
import Navbar from "../components/Navbar.jsx";
import Footer from "../components/Footer.jsx";
import { getMyCourses, markAttendance } from "../Services/api.js";
import "../Styles/Faculty.css";

export default function FacultyAttendance() {
  const [courses, setCourses] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [rows, setRows] = useState([{ enrollmentNo: "", name: "" }]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    getMyCourses()
      .then(res => {
        const list = res.courses ?? [];
        setCourses(list);
        if (list.length > 0) setSelectedCourse(list[0]._id);
      })
      .catch(() => {});
  }, []);

  const addRow = () => setRows(prev => [...prev, { enrollmentNo: "", name: "" }]);
  const removeRow = (i) => setRows(prev => prev.filter((_, idx) => idx !== i));
  const updateRow = (i, field, value) => setRows(prev => prev.map((r, idx) => idx === i ? { ...r, [field]: value } : r));

  const handleSubmit = async (e) => {
    e.preventDefault();
    const studentList = rows.filter(r => r.enrollmentNo.trim());
    if (studentList.length === 0) { setError("Add at least one student enrollment number."); return; }
    setSubmitting(true);
    setError("");
    setSuccess("");
    try {
      await markAttendance(selectedCourse, date, studentList);
      setSuccess(`Attendance marked for ${studentList.length} student(s) on ${date}.`);
      setRows([{ enrollmentNo: "", name: "" }]);
    } catch (err) {
      setError(err.message || "Failed to mark attendance.");
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
            <h1>Mark Attendance</h1>
            <p>Record present students for a course session.</p>
          </div>
        </header>

        {success && <p className="fc-success">{success}</p>}
        {error && <p className="fc-error">{error}</p>}

        <div className="fc-card" style={{ maxWidth: "720px" }}>
          <form onSubmit={handleSubmit} className="fc-form">
            <div className="fc-form-row">
              <label>Course
                <select className="fc-select" value={selectedCourse} onChange={e => setSelectedCourse(e.target.value)} style={{ borderRadius: "10px" }}>
                  {courses.map(c => <option key={c._id} value={c._id}>{c.name} ({c.code})</option>)}
                </select>
              </label>
              <label>Date
                <input type="date" value={date} onChange={e => setDate(e.target.value)} />
              </label>
            </div>

            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
                <strong style={{ color: "var(--fc-secondary)" }}>Present Students</strong>
                <button type="button" className="fc-btn fc-btn--ghost" style={{ padding: "6px 14px", fontSize: "0.82rem" }} onClick={addRow}>+ Add Row</button>
              </div>
              <div style={{ display: "grid", gap: "10px" }}>
                {rows.map((row, i) => (
                  <div key={i} style={{ display: "grid", gridTemplateColumns: "1fr 1fr auto", gap: "10px", alignItems: "center" }}>
                    <input
                      placeholder="Enrollment No *"
                      value={row.enrollmentNo}
                      onChange={e => updateRow(i, "enrollmentNo", e.target.value)}
                      style={{ padding: "9px 12px", border: "1px solid var(--fc-border)", borderRadius: "10px", fontSize: "0.9rem" }}
                    />
                    <input
                      placeholder="Name (optional)"
                      value={row.name}
                      onChange={e => updateRow(i, "name", e.target.value)}
                      style={{ padding: "9px 12px", border: "1px solid var(--fc-border)", borderRadius: "10px", fontSize: "0.9rem" }}
                    />
                    {rows.length > 1 && (
                      <button type="button" className="fc-btn fc-btn--danger" style={{ padding: "6px 12px", fontSize: "0.82rem" }} onClick={() => removeRow(i)}>✕</button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="fc-form-actions">
              <button type="submit" className="fc-btn fc-btn--primary" disabled={submitting}>
                {submitting ? "Submitting..." : "Mark Attendance"}
              </button>
            </div>
          </form>
        </div>
      </main>
      <Footer />
    </div>
  );
}
