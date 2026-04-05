import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import Navbar from "../components/Navbar.jsx";
import Footer from "../components/Footer.jsx";
import "../Styles/Home.css";

const roleContent = {
  student: {
    badge: "Student Home",
    title: "Stay on top of classes, assignments, and attendance.",
    description:
      "The homepage should immediately help students reach the next academic task, not show unrelated promotional content.",
    primaryAction: { label: "Open Student Dashboard", to: "/student/dashboard" },
    secondaryAction: { label: "View Timetable", to: "/student/timetable" },
    metrics: [
      { value: "84%", label: "Attendance", note: "Healthy academic standing this term" },
      { value: "4", label: "Pending Tasks", note: "Assignments and submission checkpoints" },
      { value: "3", label: "Classes Today", note: "Lectures and labs on your schedule" },
    ],
    snapshot: [
      { title: "Academic Standing", value: "On Track", detail: "Attendance and submissions are in a safe range" },
      { title: "Upcoming Deadline", value: "24 hrs", detail: "Nearest assignment submission window" },
      { title: "Weekly Load", value: "18 hrs", detail: "Total lecture and lab hours this week" },
    ],
    quickLinks: [
      { title: "Dashboard", to: "/student/dashboard", note: "Overview, stats, announcements" },
      { title: "Assignments", to: "/student/assignments", note: "Check pending and submitted work" },
      { title: "Timetable", to: "/student/timetable", note: "Track today and weekly schedule" },
    ],
    priorities: [
      { title: "Complete DBMS assignment", meta: "Due tomorrow, 11:59 PM" },
      { title: "Review attendance trend", meta: "Check subjects that need attention" },
      { title: "Read new faculty notices", meta: "Stay updated on reschedules and announcements" },
    ],
  },
  faculty: {
    badge: "Faculty Home",
    title: "Manage teaching work, reviews, and classroom coordination.",
    description:
      "Faculty home should prioritize operational tasks like teaching plans, review queues, and course progress from the first screen.",
    primaryAction: { label: "Open Faculty Dashboard", to: "/faculty/dashboard" },
    secondaryAction: { label: "Go to Secure Login", to: "/login" },
    metrics: [
      { value: "3", label: "Classes Today", note: "Two lectures and one lab session" },
      { value: "18", label: "Pending Reviews", note: "Assignments awaiting feedback" },
      { value: "4", label: "Active Courses", note: "Current teaching responsibilities" },
    ],
    snapshot: [
      { title: "Course Coverage", value: "72%", detail: "Average syllabus completion across active courses" },
      { title: "Review Queue", value: "11 new", detail: "Recent student submissions since morning" },
      { title: "Teaching Load", value: "14 hrs", detail: "Faculty sessions scheduled this week" },
    ],
    quickLinks: [
      { title: "Faculty Dashboard", to: "/faculty/dashboard", note: "Teaching plan, action items, submissions" },
      { title: "Student View", to: "/student/dashboard", note: "Check what students currently see" },
      { title: "Login", to: "/login", note: "Secure institutional access" },
    ],
    priorities: [
      { title: "Publish mid-sem marks", meta: "Due today before 5:00 PM" },
      { title: "Review late submissions", meta: "Close backlog for OS and DBMS" },
      { title: "Approve attendance records", meta: "Finalize classroom logs for the week" },
    ],
  },
};

const Home = () => {
  const [activeRole, setActiveRole] = useState("student");
  const currentRole = useMemo(() => roleContent[activeRole], [activeRole]);

  return (
    <div className="home-page">
      <Navbar />
      <main className="home-main">
        <section className="home-hero">
          <div className="home-hero__content">
            <span className="home-eyebrow">{currentRole.badge}</span>
            <h1>{currentRole.title}</h1>
            <p>{currentRole.description}</p>

            <div className="home-role-switch" aria-label="Select role home">
              {Object.keys(roleContent).map((role) => (
                <button
                  key={role}
                  type="button"
                  className={`home-role-pill ${activeRole === role ? "home-role-pill--active" : ""}`}
                  onClick={() => setActiveRole(role)}
                >
                  {role === "student" ? "Student" : "Faculty"}
                </button>
              ))}
            </div>

            <div className="home-hero__actions">
              <Link to={currentRole.primaryAction.to} className="home-btn home-btn--primary">
                {currentRole.primaryAction.label}
              </Link>
              <Link to={currentRole.secondaryAction.to} className="home-btn home-btn--secondary">
                {currentRole.secondaryAction.label}
              </Link>
            </div>

            <div className="home-metric-row">
              {currentRole.metrics.map((item) => (
                <article key={item.label} className="home-metric-card">
                  <strong>{item.value}</strong>
                  <h3>{item.label}</h3>
                  <p>{item.note}</p>
                </article>
              ))}
            </div>
          </div>

          <aside className="home-showcase">
            <div className="home-showcase__card home-showcase__card--primary">
              <span>Role Snapshot</span>
              <h2>{activeRole === "student" ? "Student Workspace" : "Faculty Workspace"}</h2>
              {currentRole.snapshot.map((item) => (
                <div key={item.title} className="home-progress">
                  <div>
                    <strong>{item.title}</strong>
                    <p>{item.detail}</p>
                  </div>
                  <b>{item.value}</b>
                </div>
              ))}
            </div>

            <div className="home-showcase__panel">
              {currentRole.quickLinks.map((item) => (
                <article key={item.title} className="home-mini-card">
                  <p>{item.title}</p>
                  <strong>{item.note}</strong>
                  <Link to={item.to} className="home-inline-link">
                    Open Page
                  </Link>
                </article>
              ))}
            </div>
          </aside>
        </section>

        <section className="home-section">
          <div className="home-section__heading">
            <div>
              <span className="home-eyebrow">Page Traversal</span>
              <h2>Move to the right workspace without guessing.</h2>
            </div>
            <p>
              Choose a role, review role-specific quick links, and jump directly to the exact page you need.
            </p>
          </div>

          <div className="home-feature-grid home-feature-grid--links">
            {currentRole.quickLinks.map((item) => (
              <article key={item.title} className="home-feature-card">
                <h3>{item.title}</h3>
                <p>{item.note}</p>
                <Link to={item.to} className="home-inline-link">
                  Go to {item.title}
                </Link>
              </article>
            ))}
          </div>
        </section>

        <section className="home-section home-section--analytics">
          <div className="home-section__heading">
            <div>
              <span className="home-eyebrow">Current Priorities</span>
              <h2>
                {activeRole === "student"
                  ? "What a student usually needs next"
                  : "What a faculty member usually needs next"}
              </h2>
            </div>
            <p>
              The homepage stays useful by surfacing real academic work items instead of generic advertisement blocks.
            </p>
          </div>

          <div className="home-priority-grid">
            {currentRole.priorities.map((item) => (
              <article key={item.title} className="home-priority-card">
                <h3>{item.title}</h3>
                <p>{item.meta}</p>
              </article>
            ))}
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default Home;
