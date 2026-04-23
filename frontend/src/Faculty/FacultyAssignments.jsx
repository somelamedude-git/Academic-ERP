import { useEffect, useState } from "react";
import Navbar from "../components/Navbar.jsx";
import Footer from "../components/Footer.jsx";
import { getMyCourses, getFacultyCourseAssignments, createAssignmentUrl, deleteAssignment, getAssignmentSubmissions } from "../Services/api.js";
import "../Styles/Faculty.css";

const emptyForm = { title: "", description: "", dueDate: "", resourceUrl: "", courseId: "" };

export default function FacultyAssignments() {
  const [courses, setCourses] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState("");
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");
  const [formSuccess, setFormSuccess] = useState("");

  const [viewSubmissions, setViewSubmissions] = useState(null); // assignment object
  const [submissions, setSubmissions] = useState([]);
  const [subsLoading, setSubsLoading] = useState(false);

  useEffect(() => {
    getMyCourses()
      .then(res => {
        const list = res.courses ?? [];
        setCourses(list);
        if (list.length > 0) setSelectedCourse(list[0]._id);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!selectedCourse) return;
    setLoading(true);
    setError("");
    getFacultyCourseAssignments(selectedCourse)
      .then(res => setAssignments(res.assignments ?? []))
      .catch(err => setError(err.message || "Failed to load assignments."))
      .finally(() => setLoading(false));
  }, [selectedCourse]);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!form.resourceUrl) { setFormError("A resource URL is required."); return; }
    setSubmitting(true);
    setFormError("");
    try {
      await createAssignmentUrl(form.courseId || selectedCourse, form.title, form.description, form.dueDate || undefined, form.resourceUrl);
      setFormSuccess("Assignment created.");
      setForm(emptyForm);
      setShowCreate(false);
      const res = await getFacultyCourseAssignments(selectedCourse);
      setAssignments(res.assignments ?? []);
    } catch (err) {
      setFormError(err.message || "Failed to create assignment.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id, title) => {
    if (!confirm(`Delete assignment "${title}"?`)) return;
    try {
      await deleteAssignment(id);
      setAssignments(prev => prev.filter(a => a._id !== id));
    } catch (err) {
      alert(err.message || "Failed to delete.");
    }
  };

  const handleViewSubmissions = async (assignment) => {
    setViewSubmissions(assignment);
    setSubsLoading(true);
    try {
      const res = await getAssignmentSubmissions(assignment._id);
      setSubmissions(res.submissions ?? []);
    } catch {
      setSubmissions([]);
    } finally {
      setSubsLoading(false);
    }
  };

  return (
    <div className="fc-page">
      <Navbar />
      <main className="fc-container">
        <header className="fc-header">
          <div>
            <h1>Assignments</h1>
            <p>Create assignments and review student submissions.</p>
          </div>
          <div className="fc-header-actions">
            <select className="fc-select" value={selectedCourse} onChange={e => setSelectedCourse(e.target.value)}>
              {courses.map(c => <option key={c._id} value={c._id}>{c.name} ({c.code})</option>)}
            </select>
            <button className="fc-btn fc-btn--primary" onClick={() => { setShowCreate(true); setFormError(""); setFormSuccess(""); }}>
              + New Assignment
            </button>
          </div>
        </header>

        {formSuccess && <p className="fc-success">{formSuccess}</p>}
        {loading && <p className="fc-muted">Loading assignments...</p>}
        {!loading && error && <p className="fc-error">{error}</p>}

        {!loading && !error && (
          <div className="fc-card">
            <div className="fc-card-header">
              <h3>Assignments</h3>
              <span className="fc-chip">{assignments.length} total</span>
            </div>
            {assignments.length === 0 ? <p className="fc-empty">No assignments for this course yet.</p> : (
              <ul className="fc-list">
                {assignments.map(a => (
                  <li key={a._id} className="fc-list-item">
                    <div>
                      <strong>{a.title}</strong>
                      <p>{a.description || "No description"} · Due: {a.dueDate ? new Date(a.dueDate).toLocaleDateString("en-IN") : "No deadline"}</p>
                    </div>
                    <div className="fc-list-actions">
                      <a href={a.resourceUrl} target="_blank" rel="noreferrer" className="fc-btn fc-btn--ghost" style={{ padding: "6px 12px", fontSize: "0.82rem" }}>View</a>
                      <button className="fc-btn fc-btn--ghost" style={{ padding: "6px 12px", fontSize: "0.82rem" }} onClick={() => handleViewSubmissions(a)}>Submissions</button>
                      <button className="fc-btn fc-btn--danger" style={{ padding: "6px 12px", fontSize: "0.82rem" }} onClick={() => handleDelete(a._id, a.title)}>Delete</button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        {/* Create Modal */}
        {showCreate && (
          <div className="fc-modal-overlay" onClick={() => setShowCreate(false)}>
            <div className="fc-modal" onClick={e => e.stopPropagation()}>
              <h2>New Assignment</h2>
              {formError && <p className="fc-error">{formError}</p>}
              <form onSubmit={handleCreate} className="fc-form">
                <label>Title<input required value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} /></label>
                <label>Description<textarea value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} /></label>
                <label>Resource URL (PDF link, Drive, etc.)<input required value={form.resourceUrl} onChange={e => setForm(p => ({ ...p, resourceUrl: e.target.value }))} placeholder="https://..." /></label>
                <label>Due Date<input type="date" value={form.dueDate} onChange={e => setForm(p => ({ ...p, dueDate: e.target.value }))} /></label>
                <div className="fc-form-actions">
                  <button type="button" className="fc-btn fc-btn--ghost" onClick={() => setShowCreate(false)}>Cancel</button>
                  <button type="submit" className="fc-btn fc-btn--primary" disabled={submitting}>{submitting ? "Creating..." : "Create"}</button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Submissions Modal */}
        {viewSubmissions && (
          <div className="fc-modal-overlay" onClick={() => setViewSubmissions(null)}>
            <div className="fc-modal" style={{ maxWidth: "680px" }} onClick={e => e.stopPropagation()}>
              <h2>Submissions — {viewSubmissions.title}</h2>
              {subsLoading && <p className="fc-muted">Loading...</p>}
              {!subsLoading && submissions.length === 0 && <p className="fc-empty">No submissions yet.</p>}
              {!subsLoading && submissions.length > 0 && (
                <div className="fc-table-shell">
                  <table className="fc-table">
                    <thead><tr><th>Student</th><th>Enrollment No</th><th>Submitted</th><th>File</th></tr></thead>
                    <tbody>
                      {submissions.map(s => (
                        <tr key={s._id}>
                          <td><strong>{s.studentId?.name ?? "—"}</strong></td>
                          <td>{s.studentId?.enrollmentNo ?? "—"}</td>
                          <td>{new Date(s.createdAt).toLocaleDateString("en-IN")}</td>
                          <td>
                            {s.viewUrl ? (
                              s.submissionType === "URL" ? (
                                <a href={s.viewUrl} target="_blank" rel="noreferrer" className="fc-btn fc-btn--ghost" style={{ padding: "5px 12px", fontSize: "0.8rem" }}>Open Link</a>
                              ) : (
                                <a href={s.viewUrl} target="_blank" rel="noreferrer" className="fc-btn fc-btn--ghost" style={{ padding: "5px 12px", fontSize: "0.8rem" }}>Open PDF</a>
                              )
                            ) : (
                              <span style={{ color: "#6b7280", fontSize: "0.82rem" }}>No file</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
              <div className="fc-form-actions" style={{ marginTop: "16px" }}>
                <button className="fc-btn fc-btn--ghost" onClick={() => setViewSubmissions(null)}>Close</button>
              </div>
            </div>
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}
