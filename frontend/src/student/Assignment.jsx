import { useEffect, useMemo, useState } from "react";
import Navbar from "../components/Navbar.jsx";
import Footer from "../components/Footer.jsx";
import "../Styles/Assignment.css";
import { getStudentAssignments, submitAssignmentUrl } from "../Services/api.js";
import { getStoredAuth } from "../auth/auth.js";

const STATUS_ORDER = ["Pending", "In Progress", "Submitted", "Overdue"];

const Assignment = () => {
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");

  // Detail / submit state
  const [selected, setSelected] = useState(null);
  const [submitMode, setSubmitMode] = useState("file"); // "file" | "url"
  const [submitUrl, setSubmitUrl] = useState("");
  const [submitFile, setSubmitFile] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [submitSuccess, setSubmitSuccess] = useState("");

  const load = async () => {
    try {
      setLoading(true);
      setError("");
      const data = await getStudentAssignments();
      setAssignments(Array.isArray(data.assignments) ? data.assignments : []);
    } catch (err) {
      setError(err.message || "Failed to load assignments.");
      setAssignments([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const openDetail = (item) => {
    setSelected(item);
    setSubmitMode("file");
    setSubmitUrl("");
    setSubmitFile(null);
    setSubmitError("");
    setSubmitSuccess("");
  };

  const closeDetail = () => setSelected(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitError("");
    setSubmitSuccess("");
    setSubmitting(true);

    try {
      if (submitMode === "url") {
        if (!submitUrl.trim()) { setSubmitError("Please enter a URL."); setSubmitting(false); return; }
        await submitAssignmentUrl(selected.id, submitUrl.trim());
      } else {
        if (!submitFile) { setSubmitError("Please select a PDF file."); setSubmitting(false); return; }
        const auth = getStoredAuth();
        const formData = new FormData();
        formData.append("file", submitFile);
        const res = await fetch(`/api/assignments/${selected.id}/submit`, {
          method: "POST",
          headers: { Authorization: `Bearer ${auth?.accessToken}` },
          body: formData,
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || "Submission failed.");
      }

      setSubmitSuccess("Assignment submitted successfully!");
      // Refresh list and update selected item status
      const refreshed = await getStudentAssignments();
      const list = Array.isArray(refreshed.assignments) ? refreshed.assignments : [];
      setAssignments(list);
      const updated = list.find(a => a.id === selected.id);
      if (updated) setSelected(updated);
    } catch (err) {
      setSubmitError(err.message || "Submission failed.");
    } finally {
      setSubmitting(false);
    }
  };

  const statuses = useMemo(() => {
    const existing = Array.from(
      new Set(assignments.map(item => (typeof item?.status === "string" ? item.status.trim() : "")).filter(Boolean))
    );
    const sorted = [...existing].sort((a, b) => {
      const ia = STATUS_ORDER.indexOf(a), ib = STATUS_ORDER.indexOf(b);
      if (ia === -1 && ib === -1) return a.localeCompare(b);
      if (ia === -1) return 1;
      if (ib === -1) return -1;
      return ia - ib;
    });
    return ["All", ...sorted];
  }, [assignments]);

  const filtered = useMemo(() => {
    const text = query.trim().toLowerCase();
    return assignments.filter(item => {
      const status = item?.status?.trim() ?? "";
      const haystack = `${item?.title ?? ""} ${item?.course ?? ""} ${item?.due ?? ""} ${status}`.toLowerCase();
      return (statusFilter === "All" || status === statusFilter) && (!text || haystack.includes(text));
    });
  }, [assignments, query, statusFilter]);

  const summary = useMemo(() => ({
    total: assignments.length,
    submitted: assignments.filter(i => i?.status === "Submitted").length,
    pending: assignments.filter(i => i?.status === "Pending" || i?.status === "In Progress").length,
    overdue: assignments.filter(i => i?.status === "Overdue").length,
  }), [assignments]);

  const canSubmit = selected && selected.status !== "Submitted";
  const isOverdue = selected?.status === "Overdue";

  return (
    <div className="as-page">
      <Navbar />
      <main className="as-container">
        <header className="as-header">
          <div>
            <h1>Assignments</h1>
            <p>Click any assignment to view details and submit your work.</p>
          </div>
        </header>

        <section className="as-summary-grid">
          <article className="as-summary-card"><p>Total</p><h3>{summary.total}</h3></article>
          <article className="as-summary-card"><p>Submitted</p><h3>{summary.submitted}</h3></article>
          <article className="as-summary-card"><p>Pending</p><h3>{summary.pending}</h3></article>
          <article className="as-summary-card"><p>Overdue</p><h3>{summary.overdue}</h3></article>
        </section>

        <section className="as-toolbar">
          <input type="text" value={query} onChange={e => setQuery(e.target.value)} className="as-input" placeholder="Search by title, course, or due date" />
          <select className="as-select" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
            {statuses.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </section>

        <section className="as-list-shell">
          {loading && <p className="as-muted">Loading assignments...</p>}
          {!loading && error && <p className="as-error">{error}</p>}
          {!loading && !error && filtered.length === 0 && <p className="as-empty">No assignments match your filters.</p>}
          {!loading && !error && filtered.length > 0 && (
            <ul className="as-list">
              {filtered.map((item, index) => {
                const title = item?.title || "Untitled";
                const course = item?.course || "Unknown Course";
                const due = item?.due || "No deadline";
                const status = item?.status || "Pending";
                return (
                  <li
                    key={`${item.id}-${index}`}
                    className="as-item as-item--clickable"
                    onClick={() => openDetail(item)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={e => e.key === "Enter" && openDetail(item)}
                  >
                    <div className="as-main">
                      <h4>{title}</h4>
                      <p>{course}</p>
                    </div>
                    <div className="as-meta">
                      <span className="as-due">Due: {due}</span>
                      <span className={`as-status as-status--${toStatusClass(status)}`}>{status}</span>
                      <span className="as-chevron">›</span>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      </main>
      <Footer />

      {/* Detail + Submit Modal */}
      {selected && (
        <div className="as-modal-overlay" onClick={closeDetail}>
          <div className="as-modal" onClick={e => e.stopPropagation()}>
            <button className="as-modal-close" onClick={closeDetail} aria-label="Close">✕</button>

            <div className="as-modal-header">
              <span className={`as-status as-status--${toStatusClass(selected.status)}`}>{selected.status}</span>
              <h2>{selected.title}</h2>
              <p className="as-modal-course">{selected.course}</p>
            </div>

            {selected.description && (
              <div className="as-modal-section">
                <h4>Description</h4>
                <p>{selected.description}</p>
              </div>
            )}

            <div className="as-modal-section as-modal-meta-row">
              <div>
                <span className="as-modal-label">Due Date</span>
                <strong>{selected.due}</strong>
              </div>
              {selected.resourceUrl && (
                <a href={selected.resourceUrl} target="_blank" rel="noreferrer" className="as-view-btn">
                  View Assignment ↗
                </a>
              )}
            </div>

            {selected.status === "Submitted" && (
              <div className="as-modal-submitted">
                ✓ You have already submitted this assignment.
              </div>
            )}

            {canSubmit && (
              <form onSubmit={handleSubmit} className="as-submit-form">
                <h4>Submit Your Work</h4>

                {isOverdue && (
                  <p className="as-overdue-warn">⚠ This assignment is past its deadline. Late submissions may not be accepted.</p>
                )}

                <div className="as-submit-tabs">
                  <button type="button" className={`as-submit-tab ${submitMode === "file" ? "as-submit-tab--active" : ""}`} onClick={() => setSubmitMode("file")}>Upload PDF</button>
                  <button type="button" className={`as-submit-tab ${submitMode === "url" ? "as-submit-tab--active" : ""}`} onClick={() => setSubmitMode("url")}>Submit Link</button>
                </div>

                {submitMode === "file" && (
                  <label className="as-file-label">
                    {submitFile ? submitFile.name : "Choose a PDF file"}
                    <input
                      type="file"
                      accept="application/pdf"
                      style={{ display: "none" }}
                      onChange={e => setSubmitFile(e.target.files?.[0] ?? null)}
                    />
                  </label>
                )}

                {submitMode === "url" && (
                  <input
                    type="url"
                    className="as-input"
                    placeholder="https://drive.google.com/... or any link"
                    value={submitUrl}
                    onChange={e => setSubmitUrl(e.target.value)}
                  />
                )}

                {submitError && <p className="as-error" style={{ margin: "8px 0 0" }}>{submitError}</p>}
                {submitSuccess && <p style={{ color: "#166534", background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: "8px", padding: "8px 12px", margin: "8px 0 0" }}>{submitSuccess}</p>}

                <button type="submit" className="as-submit-btn" disabled={submitting}>
                  {submitting ? "Submitting..." : "Submit Assignment"}
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

const toStatusClass = (status) => {
  const t = String(status || "").toLowerCase();
  if (t.includes("submit")) return "submitted";
  if (t.includes("over")) return "overdue";
  if (t.includes("progress")) return "progress";
  return "pending";
};

export default Assignment;
