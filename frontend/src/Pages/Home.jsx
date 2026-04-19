import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import Navbar from "../components/Navbar.jsx";
import Footer from "../components/Footer.jsx";
import "../Styles/Home.css";

const roleContent = {
  student: {
    badge: "Student Portal",
    title: "Your academics, organized and on track.",
    description:
      "Access assignments, check attendance, view your timetable, and stay ahead of every deadline — all from one dashboard.",
    primaryAction: { label: "Open Dashboard", to: "/student/dashboard" },
    secondaryAction: { label: "View Timetable", to: "/student/timetable" },
    metrics: [
      { value: "84%", label: "Attendance", note: "Current semester standing" },
      { value: "4", label: "Pending Tasks", note: "Assignments due this week" },
      { value: "3", label: "Classes Today", note: "Lectures and labs scheduled" },
    ],
    snapshot: [
      { title: "Academic Standing", value: "On Track", detail: "Attendance and submissions healthy" },
      { title: "Next Deadline", value: "24 hrs", detail: "Nearest assignment due" },
      { title: "Weekly Load", value: "18 hrs", detail: "Total scheduled hours" },
    ],
    quickLinks: [
      { title: "Dashboard", to: "/student/dashboard", note: "Stats, schedule, announcements" },
      { title: "Assignments", to: "/student/assignments", note: "Track submissions and progress" },
      { title: "Timetable", to: "/student/timetable", note: "Weekly class calendar" },
    ],
    priorities: [
      { title: "Complete DBMS assignment", meta: "Due tomorrow, 11:59 PM" },
      { title: "Review attendance trend", meta: "Check subjects that need attention" },
      { title: "Read new faculty notices", meta: "Stay updated on changes" },
    ],
  },
  faculty: {
    badge: "Faculty Portal",
    title: "Teaching workflows, simplified.",
    description:
      "Manage courses, review student submissions, track class progress, and stay on top of academic responsibilities.",
    primaryAction: { label: "Open Dashboard", to: "/faculty/dashboard" },
    secondaryAction: { label: "Secure Login", to: "/login" },
    metrics: [
      { value: "3", label: "Classes Today", note: "Two lectures, one lab" },
      { value: "18", label: "Pending Reviews", note: "Assignments awaiting feedback" },
      { value: "4", label: "Active Courses", note: "Current teaching load" },
    ],
    snapshot: [
      { title: "Course Coverage", value: "72%", detail: "Average syllabus completion" },
      { title: "Review Queue", value: "11 new", detail: "Recent submissions today" },
      { title: "Teaching Load", value: "14 hrs", detail: "Weekly scheduled hours" },
    ],
    quickLinks: [
      { title: "Faculty Dashboard", to: "/faculty/dashboard", note: "Teaching plan and submissions" },
      { title: "Student View", to: "/student/dashboard", note: "Check student experience" },
      { title: "Login", to: "/login", note: "Secure institutional access" },
    ],
    priorities: [
      { title: "Publish mid-sem marks", meta: "Due today before 5:00 PM" },
      { title: "Review late submissions", meta: "Close backlog for OS and DBMS" },
      { title: "Approve attendance records", meta: "Finalize weekly classroom logs" },
    ],
  },
};

const Home = () => {
  const [activeRole, setActiveRole] = useState("student");
  const currentRole = useMemo(() => roleContent[activeRole], [activeRole]);

  return (
    <div className="home-page">
      <Navbar />

      <main>
        {/* Hero */}
        <section className="hero">
          <div className="hero__inner">
            <div>
              <span className="hero__badge">{currentRole.badge}</span>
              <h1 className="hero__title">{currentRole.title}</h1>
              <p className="hero__desc">{currentRole.description}</p>

              <div className="role-toggle">
                {Object.keys(roleContent).map((role) => (
                  <button
                    key={role}
                    type="button"
                    className={`role-pill ${activeRole === role ? "role-pill--active" : ""}`}
                    onClick={() => setActiveRole(role)}
                  >
                    {role === "student" ? "Student" : "Faculty"}
                  </button>
                ))}
              </div>

              <div className="hero__actions">
                <Link to={currentRole.primaryAction.to} className="btn btn--primary">
                  {currentRole.primaryAction.label}
                </Link>
                <Link to={currentRole.secondaryAction.to} className="btn btn--ghost">
                  {currentRole.secondaryAction.label}
                </Link>
              </div>

              <div className="metrics">
                {currentRole.metrics.map((item) => (
                  <article key={item.label} className="metric-card">
                    <strong>{item.value}</strong>
                    <h3>{item.label}</h3>
                    <p>{item.note}</p>
                  </article>
                ))}
              </div>
            </div>

            <aside className="showcase">
              <div className="showcase__main">
                <span>Workspace Snapshot</span>
                <h2>{activeRole === "student" ? "Student Overview" : "Faculty Overview"}</h2>
                {currentRole.snapshot.map((item) => (
                  <div key={item.title} className="snap-item">
                    <div>
                      <strong>{item.title}</strong>
                      <p>{item.detail}</p>
                    </div>
                    <b>{item.value}</b>
                  </div>
                ))}
              </div>

              <div className="showcase__links">
                {currentRole.quickLinks.map((item) => (
                  <article key={item.title} className="mini-card">
                    <p>{item.title}</p>
                    <strong>{item.note}</strong>
                    <Link to={item.to} className="mini-link">
                      Open
                    </Link>
                  </article>
                ))}
              </div>
            </aside>
          </div>
        </section>

        {/* Quick Links section */}
        <div className="section">
          <div className="section__head">
            <div>
              <span className="eyebrow">Quick Navigation</span>
              <h2>Jump to the right workspace instantly.</h2>
            </div>
            <p>Role-specific pages and tools at your fingertips.</p>
          </div>

          <div className="feature-grid">
            {currentRole.quickLinks.map((item) => (
              <article key={item.title} className="feature-card">
                <h3>{item.title}</h3>
                <p>{item.note}</p>
                <Link to={item.to} className="feat-link">
                  Go to {item.title}
                </Link>
              </article>
            ))}
          </div>
        </div>

        {/* Priorities section */}
        <div className="section--dark">
          <div className="section-inner">
            <div className="section__head">
              <div>
                <span className="eyebrow">Current Priorities</span>
                <h2>
                  {activeRole === "student"
                    ? "What needs your attention now"
                    : "Faculty action items today"}
                </h2>
              </div>
              <p>Real academic tasks instead of noise.</p>
            </div>

            <div className="priority-grid">
              {currentRole.priorities.map((item) => (
                <article key={item.title} className="priority-card">
                  <h3>{item.title}</h3>
                  <p>{item.meta}</p>
                </article>
              ))}
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Home;
