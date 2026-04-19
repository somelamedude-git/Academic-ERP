import { useEffect, useMemo, useState } from "react";
import Navbar from "../components/Navbar.jsx";
import Footer from "../components/Footer.jsx";
import "../Styles/Assignment.css";
import { getStudentAssignments, submitAssignmentUrl } from "../Services/api.js";
import { getStoredAuth } from "../auth/auth.js";

const STATUS_ORDER = ["Pending", "In Progress", "Submitted", "Overdue"];

const assignmentInput = [
  {
    title: "DBMS Normalization Case Study",
    course: "Database Management Systems",
    due: "Apr 16, 2026",
    status: "Pending",
    type: "Case Study",
    faculty: "Dr. Meera Joshi",
    priority: "High",
    progress: 35,
    points: 20,
    detail: "Convert the library transactions dataset to 3NF and document functional dependencies.",
  },
  {
    title: "Operating Systems Process Scheduler",
    course: "Operating Systems",
    due: "Apr 18, 2026",
    status: "In Progress",
    type: "Code Lab",
    faculty: "Prof. Arvind Rao",
    priority: "Medium",
    progress: 68,
    points: 30,
    detail: "Implement FCFS, SJF, and Round Robin scheduling with comparative turnaround metrics.",
  },
  {
    title: "Computer Networks Lab Report",
    course: "Computer Networks",
    due: "Apr 12, 2026",
    status: "Submitted",
    type: "Lab Report",
    faculty: "Dr. Nisha Menon",
    priority: "Done",
    progress: 100,
    points: 15,
    detail: "Packet capture observations, latency comparison, and protocol analysis for lab session four.",
  },
  {
    title: "Data Structures Tree Traversal Sheet",
    course: "Data Structures and Algorithms",
    due: "Apr 10, 2026",
    status: "Overdue",
    type: "Practice Set",
    faculty: "Prof. Kunal Shah",
    priority: "Critical",
    progress: 12,
    points: 10,
    detail: "Dry-run preorder, inorder, postorder, and level-order traversal for mixed tree inputs.",
  },
  {
    title: "Software Engineering Sprint Plan",
    course: "Software Engineering",
    due: "Apr 21, 2026",
    status: "Pending",
    type: "Project Plan",
    faculty: "Dr. Rachna Singh",
    priority: "Medium",
    progress: 20,
    points: 25,
    detail: "Create backlog, sprint goals, user stories, risks, and acceptance criteria for the mini project.",
  },
  {
    title: "Machine Learning Regression Notebook",
    course: "Machine Learning",
    due: "Apr 24, 2026",
    status: "In Progress",
    type: "Notebook",
    faculty: "Dr. Samar Verma",
    priority: "High",
    progress: 54,
    points: 35,
    detail: "Train regression models, evaluate residuals, and compare regularization results.",
  },
];

const Assignment = () => {
  const [assignments, setAssignments] = useState(assignmentInput);
  const [loading, setLoading] = useState(false);
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
    return assignments.filter((item) => {
      const status = typeof item?.status === "string" ? item.status.trim() : "";
      const title = typeof item?.title === "string" ? item.title : "";
      const course = typeof item?.course === "string" ? item.course : "";
      const due = typeof item?.due === "string" ? item.due : "";
      const faculty = typeof item?.faculty === "string" ? item.faculty : "";
      const type = typeof item?.type === "string" ? item.type : "";

      const matchesStatus = statusFilter === "All" || status === statusFilter;
      const haystack = `${title} ${course} ${due} ${status} ${faculty} ${type}`.toLowerCase();
      const matchesQuery = !text || haystack.includes(text);

      return matchesStatus && matchesQuery;
    });
  }, [assignments, query, statusFilter]);

  const summary = useMemo(() => {
    const total = assignments.length;
    const submitted = assignments.filter((item) => item?.status === "Submitted").length;
    const active = assignments.filter((item) => item?.status === "Pending" || item?.status === "In Progress").length;
    const overdue = assignments.filter((item) => item?.status === "Overdue").length;
    const averageProgress = total
      ? Math.round(assignments.reduce((sum, item) => sum + Number(item?.progress || 0), 0) / total)
      : 0;

    return { total, submitted, active, overdue, averageProgress };
  }, [assignments]);

  const canSubmit = selected && selected.status !== "Submitted";
  const isOverdue = selected?.status === "Overdue";

  const statusChart = useMemo(() => {
    return STATUS_ORDER.map((status) => ({
      status,
      count: assignments.filter((item) => item?.status === status).length,
    }));
  }, [assignments]);

  const courseChart = useMemo(() => {
    const courseCounts = assignments.reduce((acc, item) => {
      const course = item?.course || "Course not specified";
      acc[course] = (acc[course] || 0) + 1;
      return acc;
    }, {});

    return Object.entries(courseCounts)
      .map(([course, count]) => ({ course, count }))
      .sort((a, b) => b.count - a.count || a.course.localeCompare(b.course));
  }, [assignments]);

  const upcomingAssignments = useMemo(() => {
    return assignments
      .filter((item) => item?.status !== "Submitted")
      .slice()
      .sort((a, b) => new Date(a.due) - new Date(b.due))
      .slice(0, 3);
  }, [assignments]);

  const donutStyle = useMemo(() => {
    const total = Math.max(assignments.length, 1);
    const submittedEnd = (summary.submitted / total) * 100;
    const activeEnd = submittedEnd + (summary.active / total) * 100;

    return {
      background: `conic-gradient(#159a73 0 ${submittedEnd}%, #2563eb ${submittedEnd}% ${activeEnd}%, #d93636 ${activeEnd}% 100%)`,
    };
  }, [assignments.length, summary.active, summary.submitted]);

  return (
    <div className="as-page">
      <Navbar />
      <main className="as-container">
        <section className="as-hero">
          <div className="as-hero-copy">
            <span className="as-eyebrow">Student Assignments</span>
            <h1>Plan every submission with clarity.</h1>
            <p>
              Review deadlines, track progress, filter coursework, and focus on the assignments
              that need attention today. Click any assignment to view details and submit your work.
            </p>

            <div className="as-hero-actions">
              <a href="#assignment-list" className="as-btn as-btn--primary">View Work Queue</a>
              <a href="#assignment-insights" className="as-btn as-btn--secondary">Check Insights</a>
            </div>
          </div>

          <div className="as-hero-visual" aria-label="Assignment progress preview">
            <div className="as-device-frame">
              <div className="as-device-top">
                <span />
                <span />
                <span />
              </div>
              <div className="as-device-screen">
                {STATUS_ORDER.map((status) => {
                  const item = statusChart.find((chartItem) => chartItem.status === status);
                  const width = summary.total ? `${Math.max((item.count / summary.total) * 100, item.count ? 16 : 4)}%` : "4%";

                  return (
                    <div key={status} className="as-device-row">
                      <span>{status}</span>
                      <div>
                        <i className={`as-device-fill as-device-fill--${toStatusClass(status)}`} style={{ width }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </section>

<<<<<<< HEAD
        <section className="as-summary-grid" aria-label="Assignment summary">
          <article className="as-summary-card">
            <span className="as-summary-icon as-summary-icon--total">A</span>
            <p>Total Assignments</p>
            <h3>{summary.total}</h3>
          </article>
          <article className="as-summary-card">
            <span className="as-summary-icon as-summary-icon--submitted">S</span>
            <p>Submitted</p>
            <h3>{summary.submitted}</h3>
          </article>
          <article className="as-summary-card">
            <span className="as-summary-icon as-summary-icon--active">W</span>
            <p>Active Work</p>
            <h3>{summary.active}</h3>
          </article>
          <article className="as-summary-card">
            <span className="as-summary-icon as-summary-icon--overdue">!</span>
            <p>Overdue</p>
            <h3>{summary.overdue}</h3>
          </article>
        </section>

        <section className="as-workspace" id="assignment-insights">
          <div className="as-main-column">
            <section className="as-toolbar" aria-label="Assignment filters">
              <div>
                <span className="as-eyebrow">Work Queue</span>
                <h2>Assignments</h2>
              </div>

              <div className="as-filter-controls">
                <input
                  type="text"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  className="as-input"
                  placeholder="Search title, course, faculty, or due date"
                />

                <select
                  className="as-select"
                  value={statusFilter}
                  onChange={(event) => setStatusFilter(event.target.value)}
                >
                  {statuses.map((status) => (
                    <option key={status} value={status}>
                      {status}
                    </option>
                  ))}
                </select>
              </div>
            </section>

            <section className="as-list-shell" id="assignment-list" aria-label="Assignments list">
              {loading && <p className="as-muted">Loading assignments...</p>}
              {!loading && error && <p className="as-error">{error}</p>}

              {!loading && !error && filtered.length === 0 && (
                <p className="as-empty">No assignments match your filters.</p>
              )}

              {!loading && !error && filtered.length > 0 && (
                <ul className="as-list">
                  {filtered.map((item, index) => {
                    const title = item?.title || "Untitled Assignment";
                    const course = item?.course || "Course not specified";
                    const due = item?.due || "Due date unavailable";
                    const status = item?.status || "Pending";
                    const progress = clampProgress(item?.progress);

                    return (
                      <li
                        key={`${item.id || title}-${course}-${due}-${index}`}
                        className="as-item as-item--clickable"
                        onClick={() => openDetail(item)}
                        role="button"
                        tabIndex={0}
                        onKeyDown={e => e.key === "Enter" && openDetail(item)}
                      >
                        <div className={`as-visual-icon as-visual-icon--${toStatusClass(status)}`}>
                          {getAssignmentInitial(title)}
                        </div>

                        <div className="as-main">
                          <div className="as-item-title-row">
                            <h3>{title}</h3>
                            <span className={`as-status as-status--${toStatusClass(status)}`}>{status}</span>
                          </div>
                          <p>{item?.detail || "Assignment details will appear here."}</p>

                          <div className="as-item-tags">
                            <span>{course}</span>
                            <span>{item?.type || "Assignment"}</span>
                            <span>{item?.faculty || "Faculty"}</span>
                          </div>

                          <div className="as-progress-line" aria-label={`${progress}% complete`}>
                            <span style={{ width: `${progress}%` }} />
                          </div>
                        </div>

                        <div className="as-meta">
                          <span className="as-priority">{item?.priority || "Normal"}</span>
                          <strong>{item?.points || 0} pts</strong>
                          <span className="as-due">Due {due}</span>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </section>
          </div>

          <aside className="as-side-column">
            <section className="as-visual-panel as-status-panel">
              <div className="as-panel-heading">
                <span>Submission Status</span>
                <h2>Progress overview</h2>
              </div>

              <div className="as-donut-wrap">
                <div className="as-donut" style={donutStyle}>
                  <div>
                    <strong>{summary.averageProgress}%</strong>
                    <span>Average</span>
                  </div>
                </div>

                <div className="as-legend">
                  <span><i className="as-dot as-dot--submitted" />Submitted</span>
                  <span><i className="as-dot as-dot--pending" />Active</span>
                  <span><i className="as-dot as-dot--overdue" />Overdue</span>
                </div>
              </div>
            </section>

            <section className="as-visual-panel">
              <div className="as-panel-heading">
                <span>Status Chart</span>
                <h2>Workload by stage</h2>
              </div>

              <div className="as-bar-list">
                {statusChart.map((item) => {
                  const width = summary.total ? `${Math.max((item.count / summary.total) * 100, item.count ? 12 : 0)}%` : "0%";

                  return (
                    <div key={item.status} className="as-bar-row">
                      <div className="as-bar-label">
                        <span>{item.status}</span>
                        <strong>{item.count}</strong>
                      </div>
                      <div className="as-bar-track">
                        <span className={`as-bar-fill as-bar-fill--${toStatusClass(item.status)}`} style={{ width }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>

            <section className="as-visual-panel">
              <div className="as-panel-heading">
                <span>Upcoming</span>
                <h2>Next deadlines</h2>
              </div>

              <div className="as-deadline-list">
                {upcomingAssignments.map((item) => (
                  <article key={`${item.title}-${item.due}`} className="as-deadline-item">
                    <span className={`as-timeline-dot as-timeline-dot--${toStatusClass(item.status)}`} />
                    <div>
                      <strong>{item.title}</strong>
                      <p>{item.due} - {item.course}</p>
                    </div>
                  </article>
                ))}
              </div>
            </section>

            <section className="as-visual-panel">
              <div className="as-panel-heading">
                <span>Course Load</span>
                <h2>Assignments by subject</h2>
              </div>

              <div className="as-course-bars">
                {courseChart.map((item) => {
                  const width = summary.total ? `${Math.max((item.count / summary.total) * 100, 12)}%` : "0%";

                  return (
                    <div key={item.course} className="as-course-row">
                      <div className="as-course-text">
                        <span>{item.course}</span>
                        <strong>{item.count}</strong>
                      </div>
                      <div className="as-course-track">
                        <span style={{ width }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          </aside>
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

const clampProgress = (value) => Math.min(Math.max(Number(value) || 0, 0), 100);

const toStatusClass = (status) => {
  const t = String(status || "").toLowerCase();
  if (t.includes("submit")) return "submitted";
  if (t.includes("over")) return "overdue";
  if (t.includes("progress")) return "progress";
  return "pending";
};

const getAssignmentInitial = (title) => {
  const firstLetter = String(title || "A").trim().charAt(0).toUpperCase();
  return firstLetter || "A";
};

export default Assignment;
