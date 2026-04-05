import { useEffect, useMemo, useState } from "react";
import Navbar from "../components/Navbar.jsx";
import Footer from "../components/Footer.jsx";
import "../Styles/Assignment.css";

const STATUS_ORDER = ["Pending", "In Progress", "Submitted", "Overdue"];

const Assignment = () => {
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");

  useEffect(() => {
    let isMounted = true;

    const loadAssignments = async () => {
      try {
        setLoading(true);
        setError("");

        const response = await fetch("/student/assignments");
        if (!response.ok) {
          throw new Error(`Failed to load assignments (${response.status})`);
        }

        const data = await response.json();
        if (isMounted) {
          setAssignments(Array.isArray(data) ? data : []);
        }
      } catch (err) {
        if (isMounted) {
          setError(err.message || "Failed to load assignments.");
          setAssignments([]);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadAssignments();

    return () => {
      isMounted = false;
    };
  }, []);

  const statuses = useMemo(() => {
    const existing = Array.from(
      new Set(assignments.map((item) => (typeof item?.status === "string" ? item.status.trim() : "")).filter(Boolean)),
    );

    const sorted = [...existing].sort((a, b) => {
      const ia = STATUS_ORDER.indexOf(a);
      const ib = STATUS_ORDER.indexOf(b);
      if (ia === -1 && ib === -1) {
        return a.localeCompare(b);
      }
      if (ia === -1) {
        return 1;
      }
      if (ib === -1) {
        return -1;
      }
      return ia - ib;
    });

    return ["All", ...sorted];
  }, [assignments]);

  const filteredAssignments = useMemo(() => {
    const text = query.trim().toLowerCase();

    return assignments.filter((item) => {
      const status = typeof item?.status === "string" ? item.status.trim() : "";
      const title = typeof item?.title === "string" ? item.title : "";
      const course = typeof item?.course === "string" ? item.course : "";
      const due = typeof item?.due === "string" ? item.due : "";

      const matchesStatus = statusFilter === "All" || status === statusFilter;
      const haystack = `${title} ${course} ${due} ${status}`.toLowerCase();
      const matchesQuery = !text || haystack.includes(text);

      return matchesStatus && matchesQuery;
    });
  }, [assignments, query, statusFilter]);

  const summary = useMemo(() => {
    const total = assignments.length;
    const submitted = assignments.filter((item) => item?.status === "Submitted").length;
    const pending = assignments.filter((item) => item?.status === "Pending" || item?.status === "In Progress").length;
    const overdue = assignments.filter((item) => item?.status === "Overdue").length;

    return { total, submitted, pending, overdue };
  }, [assignments]);

  return (
    <div className="as-page">
      <Navbar />
      <main className="as-container">
        <header className="as-header">
          <div>
            <h1>Assignments</h1>
            <p>Track submissions, deadlines, and status in one place.</p>
          </div>
        </header>

        <section className="as-summary-grid" aria-label="Assignment summary">
          <article className="as-summary-card">
            <p>Total</p>
            <h3>{summary.total}</h3>
          </article>
          <article className="as-summary-card">
            <p>Submitted</p>
            <h3>{summary.submitted}</h3>
          </article>
          <article className="as-summary-card">
            <p>Pending</p>
            <h3>{summary.pending}</h3>
          </article>
          <article className="as-summary-card">
            <p>Overdue</p>
            <h3>{summary.overdue}</h3>
          </article>
        </section>

        <section className="as-toolbar" aria-label="Assignment filters">
          <input
            type="text"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            className="as-input"
            placeholder="Search by title, course, or due date"
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
        </section>

        <section className="as-list-shell" aria-label="Assignments list">
          {loading && <p className="as-muted">Loading assignments...</p>}
          {!loading && error && <p className="as-error">{error}</p>}

          {!loading && !error && filteredAssignments.length === 0 && (
            <p className="as-empty">No assignments match your filters.</p>
          )}

          {!loading && !error && filteredAssignments.length > 0 && (
            <ul className="as-list">
              {filteredAssignments.map((item, index) => {
                const title = item?.title || "Untitled Assignment";
                const course = item?.course || "Course not specified";
                const due = item?.due || "Due date unavailable";
                const status = item?.status || "Pending";

                return (
                  <li key={`${title}-${course}-${due}-${index}`} className="as-item">
                    <div className="as-main">
                      <h4>{title}</h4>
                      <p>{course}</p>
                    </div>
                    <div className="as-meta">
                      <span className="as-due">Due: {due}</span>
                      <span className={`as-status as-status--${toStatusClass(status)}`}>{status}</span>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      </main>
      <Footer />
    </div>
  );
};

const toStatusClass = (status) => {
  const text = String(status || "").toLowerCase();

  if (text.includes("submit")) {
    return "submitted";
  }
  if (text.includes("over")) {
    return "overdue";
  }
  if (text.includes("progress")) {
    return "progress";
  }

  return "pending";
};

export default Assignment;
