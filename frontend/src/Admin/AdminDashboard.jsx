import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { clearAuth } from "../auth/auth.js";
import Navbar from "../components/Navbar.jsx";
import Footer from "../components/Footer.jsx";
import { getAdminStats } from "../Services/api.js";
import "../Styles/AdminDashboard.css";

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState({ students: "—", faculty: "—", courses: "—" });

  useEffect(() => {
    getAdminStats()
      .then(res => setStats(res.stats ?? {}))
      .catch(() => {});
  }, []);

  const overviewStats = [
    { label: "Active Students", value: String(stats.students ?? "—"), note: "Enrolled across all branches" },
    { label: "Faculty Members", value: String(stats.faculty ?? "—"), note: "Registered in the system" },
    { label: "Courses", value: String(stats.courses ?? "—"), note: "Active courses this semester" },
  ];

  const quickAccessLinks = [
    { title: "Manage Users", description: "Add/remove students and faculty.", to: "/admin/manage-users", cta: "Open" },
    { title: "Manage Courses", description: "Create courses and assign to branches.", to: "/admin/manage-courses", cta: "Open" },
    { title: "Timetable PDFs", description: "Upload and manage timetable files.", to: "/admin/timetable", cta: "Open" },
  ];

  const handleSwitchAccount = () => {
    clearAuth();
    navigate("/login", { replace: true });
  };

  return (
    <div className="ad-page">
      <Navbar />
      <main className="ad-container">
        <section className="ad-hero">
          <div className="ad-hero-copy">
            <p className="ad-eyebrow">Administrative Control Center</p>
            <h1>Admin Dashboard</h1>
            <p className="ad-subtitle">
              Monitor institutional operations and manage users, courses, and timetables.
            </p>
            <div className="ad-hero-actions">
              <Link to="/admin/manage-users" className="ad-btn ad-btn--primary">Manage Users</Link>
              <button type="button" className="ad-btn ad-btn--secondary" onClick={handleSwitchAccount}>Logout</button>
            </div>
          </div>
          <aside className="ad-profile-card">
            <div className="ad-profile-avatar">AD</div>
            <div>
              <h2>Admin Office</h2>
              <p>Campus Operations and Governance</p>
            </div>
          </aside>
        </section>

        <section className="ad-stats-grid">
          {overviewStats.map((stat) => (
            <article key={stat.label} className="ad-card ad-stat-card">
              <p className="ad-label">{stat.label}</p>
              <h2>{stat.value}</h2>
              <span className="ad-note">{stat.note}</span>
            </article>
          ))}
        </section>

        <section className="ad-main-grid">
          <article className="ad-card ad-card--wide">
            <div className="ad-card-header">
              <h3>Quick Access</h3>
              <span className="ad-chip">Admin Tools</span>
            </div>
            <div className="ad-quick-grid">
              {quickAccessLinks.map((item) => (
                <article key={item.title} className="ad-quick-card">
                  <h4>{item.title}</h4>
                  <p>{item.description}</p>
                  <Link to={item.to} className="ad-inline-link">{item.cta} →</Link>
                </article>
              ))}
            </div>
          </article>

          <article className="ad-card">
            <div className="ad-card-header">
              <h3>Admin Actions</h3>
              <span className="ad-chip">Shortcuts</span>
            </div>
            <div className="ad-action-grid">
              <Link to="/admin/manage-users" className="ad-action-btn">Manage Students</Link>
              <Link to="/admin/manage-users" className="ad-action-btn">Manage Faculty</Link>
              <Link to="/admin/manage-courses" className="ad-action-btn">Manage Courses</Link>
              <Link to="/admin/timetable" className="ad-action-btn">Upload Timetable</Link>
            </div>
          </article>
        </section>
      </main>
      <Footer />
    </div>
  );
}
