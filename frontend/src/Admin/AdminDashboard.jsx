import { Link, useNavigate } from "react-router-dom";
import { clearAuth } from "../auth/auth.js";
import Navbar from "../components/Navbar.jsx";
import Footer from "../components/Footer.jsx";
import "../Styles/AdminDashboard.css";

const overviewStats = [
  { label: "Active Students", value: "1,248", note: "Across undergraduate and postgraduate programs" },
  { label: "Faculty Members", value: "86", note: "Permanent, visiting, and adjunct staff" },
  { label: "Open Service Tickets", value: "17", note: "Admissions, IT, and examination workflows" },
  { label: "Fee Collection", value: "92%", note: "Current semester completion rate" },
];

const priorityApprovals = [
  { title: "Approve semester registration corrections", team: "Academic Cell", due: "Due today" },
  { title: "Review hostel allotment exceptions", team: "Student Affairs", due: "Due today" },
  { title: "Publish examination seating plan", team: "Examination Branch", due: "Tomorrow" },
];

const departmentHealth = [
  { department: "Computer Science", utilization: 88 },
  { department: "Electronics", utilization: 74 },
  { department: "Mechanical", utilization: 69 },
  { department: "Civil", utilization: 81 },
];

const recentActivities = [
  { actor: "Admissions Office", action: "Uploaded 42 new enrollment records", status: "Completed" },
  { actor: "Accounts Team", action: "Flagged 9 pending fee reconciliations", status: "Pending" },
  { actor: "Exam Cell", action: "Released mid-sem moderation summary", status: "Completed" },
  { actor: "IT Support", action: "Escalated biometric sync issue for Block B", status: "Attention" },
];

const complianceUpdates = [
  { title: "NAAC documentation pack ready for review", meta: "Quality Assurance Cell" },
  { title: "Faculty workload audit closes this Friday", meta: "Human Resources" },
  { title: "Transport vendor renewal meeting scheduled", meta: "Administration Office" },
];

const systemStatus = [
  { label: "ERP Uptime", value: "99.8%", tone: "good" },
  { label: "Server Load", value: "Moderate", tone: "neutral" },
  { label: "Pending Backups", value: "2 jobs", tone: "alert" },
];

const quickAccessLinks = [
  {
    title: "User Management",
    description: "Review accounts, role access, and staff onboarding requests.",
    to: "/admin/manage-users",
    cta: "Open Manage Users",
  },
  {
    title: "Faculty Workspace",
    description: "Check the academic operations view used by faculty teams.",
    to: "/faculty/dashboard",
    cta: "View Faculty Dashboard",
  },
  {
    title: "Student Portal",
    description: "Inspect the student-facing dashboard and current academic view.",
    to: "/student/dashboard",
    cta: "View Student Dashboard",
  },
];

const statusClassName = {
  Completed: "ad-badge ad-badge--success",
  Pending: "ad-badge ad-badge--pending",
  Attention: "ad-badge ad-badge--alert",
};

export default function AdminDashboard() {
  const navigate = useNavigate();

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
              Monitor institutional operations, approvals, compliance tasks, and campus-wide
              service health from one dashboard.
            </p>

            <div className="ad-hero-actions">
              <Link to="/admin/manage-users" className="ad-btn ad-btn--primary">
                Manage Users
              </Link>
              <button
                type="button"
                className="ad-btn ad-btn--secondary"
                onClick={handleSwitchAccount}
              >
                Switch Account
              </button>
            </div>

            <div className="ad-system-strip">
              {systemStatus.map((item) => (
                <article key={item.label} className={`ad-system-card ad-system-card--${item.tone}`}>
                  <span>{item.label}</span>
                  <strong>{item.value}</strong>
                </article>
              ))}
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
            <article className="ad-card">
              <div className="ad-card-header">
                <h3>Priority Approvals</h3>
                <span className="ad-chip ad-chip--alert">Immediate</span>
              </div>
            <ul className="ad-list">
              {priorityApprovals.map((item) => (
                <li key={item.title} className="ad-list-item">
                  <div>
                    <strong>{item.title}</strong>
                    <p>{item.team}</p>
                  </div>
                  <div className="ad-list-actions">
                    <span className="ad-meta">{item.due}</span>
                    <Link to="/admin/manage-users" className="ad-inline-btn">
                      Review
                    </Link>
                  </div>
                </li>
              ))}
            </ul>
          </article>

          <article className="ad-card">
            <div className="ad-card-header">
              <h3>Compliance Updates</h3>
              <span className="ad-chip">Governance</span>
            </div>
            <ul className="ad-list">
              {complianceUpdates.map((item) => (
                <li key={item.title} className="ad-list-item">
                  <div>
                    <strong>{item.title}</strong>
                    <p>{item.meta}</p>
                  </div>
                  <button type="button" className="ad-inline-btn">
                    View
                  </button>
                </li>
              ))}
            </ul>
          </article>

          <article className="ad-card ad-card--wide">
            <div className="ad-card-header">
              <h3>Recent Administrative Activity</h3>
              <span className="ad-chip">Live updates</span>
            </div>
            <div className="ad-table">
              {recentActivities.map((item) => (
                <div key={`${item.actor}-${item.action}`} className="ad-table-row">
                  <div>
                    <strong>{item.actor}</strong>
                    <p>{item.action}</p>
                  </div>
                  <div className="ad-table-actions">
                    <span className={statusClassName[item.status]}>{item.status}</span>
                    <button type="button" className="ad-inline-btn">
                      Details
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </article>

          <article className="ad-card">
            <div className="ad-card-header">
              <h3>Department Capacity</h3>
              <span className="ad-chip">Resource view</span>
            </div>
            <div className="ad-progress-list">
              {departmentHealth.map((item) => (
                <div key={item.department} className="ad-progress-item">
                  <div className="ad-progress-meta">
                    <strong>{item.department}</strong>
                    <span>{item.utilization}%</span>
                  </div>
                  <div className="ad-progress-track">
                    <div className="ad-progress-fill" style={{ width: `${item.utilization}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </article>

          <article className="ad-card">
            <div className="ad-card-header">
              <h3>Admin Actions</h3>
              <span className="ad-chip">Shortcuts</span>
            </div>
            <div className="ad-action-grid">
              <Link to="/admin/manage-users" className="ad-action-btn">Review User Access</Link>
              <button type="button" className="ad-action-btn">Export Audit Summary</button>
              <Link to="/faculty/dashboard" className="ad-action-btn">Open Faculty Dashboard</Link>
              <Link to="/student/dashboard" className="ad-action-btn">Check Student Portal</Link>
            </div>
          </article>

          <article className="ad-card ad-card--wide">
            <div className="ad-card-header">
              <h3>Quick Access Interface</h3>
              <span className="ad-chip">Navigation</span>
            </div>
            <div className="ad-quick-grid">
              {quickAccessLinks.map((item) => (
                <article key={item.title} className="ad-quick-card">
                  <h4>{item.title}</h4>
                  <p>{item.description}</p>
                  <Link to={item.to} className="ad-inline-link">
                    {item.cta}
                  </Link>
                </article>
              ))}
            </div>
          </article>
        </section>
      </main>

      <Footer />
    </div>
  );
}
