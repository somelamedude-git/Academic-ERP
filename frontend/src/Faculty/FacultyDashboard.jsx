import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Navbar from "../components/Navbar.jsx";
import Footer from "../components/Footer.jsx";
import { getMyCourses, getFacultyCourseAssignments, getAssignmentSubmissions } from "../Services/api.js";
import "../Styles/FacultyDashboard.css";

const quickLinks = [
  { label: "Assignments", to: "/faculty/assignments", note: "Create and review submissions" },
  { label: "Course Materials", to: "/faculty/materials", note: "Upload PDFs, PPTs, links" },
  { label: "Attendance", to: "/faculty/attendance", note: "Mark present students" },
  { label: "Grades", to: "/faculty/grades", note: "Assign final grades" },
  { label: "Quizzes", to: "/faculty/quizzes", note: "Create and manage quizzes" },
  { label: "Feedback", to: "/faculty/feedback", note: "Read student feedback" },
];

const FacultyDashboard = () => {
  const [courses, setCourses] = useState([]);
  const [recentSubmissions, setRecentSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getMyCourses()
      .then(async res => {
        const list = res.courses ?? [];
        setCourses(list);
        if (list.length > 0) {
          try {
            const aRes = await getFacultyCourseAssignments(list[0]._id);
            const assignments = aRes.assignments ?? [];
            if (assignments.length > 0) {
              const sRes = await getAssignmentSubmissions(assignments[0]._id);
              setRecentSubmissions((sRes.submissions ?? []).slice(0, 5));
            }
          } catch { /* non-critical */ }
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="fd-page">
      <Navbar />
      <main className="fd-container">
        <section className="fd-hero">
          <div className="fd-hero-copy">
            <p className="fd-eyebrow">Faculty Workspace</p>
            <h1>Faculty Dashboard</h1>
            <p className="fd-subtitle">Manage your courses, assignments, attendance, grades, and quizzes.</p>
            <div className="fd-hero-highlights">
              <article className="fd-highlight-card">
                <p>Courses Assigned</p>
                <strong>{loading ? "—" : courses.length}</strong>
                <span>Active this semester</span>
              </article>
              <article className="fd-highlight-card">
                <p>Recent Submissions</p>
                <strong>{loading ? "—" : recentSubmissions.length}</strong>
                <span>Latest assignment</span>
              </article>
            </div>
          </div>
          <div className="fd-profile-card">
            <div className="fd-profile-avatar">FA</div>
            <div><h2>Faculty</h2><p>Academic Staff</p></div>
          </div>
        </section>

        {courses.length > 0 && (
          <section className="fd-stats-grid">
            {courses.map(c => (
              <article key={c._id} className="fd-card fd-stat-card">
                <p className="fd-label">{c.code}</p>
                <h2 style={{ fontSize: "1.05rem", marginTop: "6px" }}>{c.name}</h2>
              </article>
            ))}
          </section>
        )}

        <section className="fd-main-grid">
          <article className="fd-card fd-card--wide">
            <div className="fd-card-header">
              <h3>Quick Actions</h3>
              <span className="fd-chip">Faculty Tools</span>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "14px" }}>
              {quickLinks.map(item => (
                <Link key={item.to} to={item.to} style={{ textDecoration: "none" }}>
                  <article style={{ padding: "16px", borderRadius: "14px", background: "#f8fbfa", border: "1px solid #edf3f1" }}>
                    <strong style={{ color: "#17324d" }}>{item.label}</strong>
                    <p style={{ margin: "6px 0 0", fontSize: "0.85rem", color: "#6b7280" }}>{item.note}</p>
                  </article>
                </Link>
              ))}
            </div>
          </article>

          {recentSubmissions.length > 0 && (
            <article className="fd-card fd-card--wide">
              <div className="fd-card-header">
                <h3>Recent Submissions</h3>
                <span className="fd-chip">Latest</span>
              </div>
              <div className="fd-table">
                {recentSubmissions.map(s => (
                  <div key={s._id} className="fd-table-row">
                    <div>
                      <strong>{s.studentId?.name ?? "Student"}</strong>
                      <p>{s.studentId?.enrollmentNo ?? "—"}</p>
                    </div>
                    <a href={s.cloudinaryUrl} target="_blank" rel="noreferrer" className="fd-ghost-btn" style={{ textDecoration: "none" }}>View</a>
                  </div>
                ))}
              </div>
            </article>
          )}
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default FacultyDashboard;
