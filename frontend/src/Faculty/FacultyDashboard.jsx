import Navbar from "../components/Navbar.jsx";
import Footer from "../components/Footer.jsx";
import "../Styles/FacultyDashboard.css";

const overviewStats = [
  { label: "Courses Managed", value: "4", note: "B.Tech and M.Tech sections" },
  { label: "Classes Today", value: "3", note: "2 lectures and 1 lab" },
  { label: "Pending Reviews", value: "18", note: "Assignments awaiting feedback" },
  { label: "Average Attendance", value: "84%", note: "Across active courses" },
];

const todaysSchedule = [
  { time: "09:00 AM", course: "Database Management Systems", room: "C-204" },
  { time: "11:00 AM", course: "Operating Systems", room: "Lab-3" },
  { time: "02:00 PM", course: "Compiler Design", room: "B-112" },
];

const recentSubmissions = [
  { student: "Ananya Sharma", assignment: "SQL Query Optimization", status: "New" },
  { student: "Rohit Verma", assignment: "Process Scheduling Case Study", status: "Reviewed" },
  { student: "Sneha Patel", assignment: "Intermediate Code Generation", status: "Late" },
];

const actionItems = [
  { title: "Publish Mid-Sem Marks", deadline: "Due today" },
  { title: "Upload Week 6 Assignment", deadline: "Due tomorrow" },
  { title: "Approve Lab Attendance", deadline: "Pending faculty action" },
];

const announcements = [
  { title: "Department meeting at 4:30 PM", meta: "Conference Hall" },
  { title: "LMS maintenance window this Saturday", meta: "11:00 PM to 01:00 AM" },
  { title: "Final year project review slots released", meta: "Check shared calendar" },
];

const performance = [
  { course: "DBMS", completion: 72 },
  { course: "OS", completion: 64 },
  { course: "CD", completion: 81 },
  { course: "ADA", completion: 58 },
];

const spotlightCards = [
  { label: "Student Doubt Queue", value: "11", note: "Questions waiting for faculty response" },
  { label: "Lab Utilization", value: "76%", note: "This week across scheduled sessions" },
];

const statusClassName = {
  New: "fd-badge fd-badge--new",
  Reviewed: "fd-badge fd-badge--reviewed",
  Late: "fd-badge fd-badge--late",
};

const FacultyDashboard = () => {
  return (
    <div className="fd-page">
      <Navbar />

      <main className="fd-container">
        <section className="fd-hero">
          <div className="fd-hero-copy">
            <p className="fd-eyebrow">Faculty Workspace</p>
            <h1>Faculty Dashboard</h1>
            <p className="fd-subtitle">
              Track classes, recent submissions, and teaching priorities in one place.
            </p>

            <div className="fd-hero-highlights">
              {spotlightCards.map((item) => (
                <article key={item.label} className="fd-highlight-card">
                  <p>{item.label}</p>
                  <strong>{item.value}</strong>
                  <span>{item.note}</span>
                </article>
              ))}
            </div>
          </div>

          <div className="fd-profile-card">
            <div className="fd-profile-avatar">DR</div>
            <div>
              <h2>Ajay Kumar </h2>
              <p>Computer Science Department</p>
            </div>
          </div>
        </section>

        <section className="fd-stats-grid">
          {overviewStats.map((stat) => (
            <article key={stat.label} className="fd-card fd-stat-card">
              <p className="fd-label">{stat.label}</p>
              <h2>{stat.value}</h2>
              <span className="fd-note">{stat.note}</span>
            </article>
          ))}
        </section>

        <section className="fd-main-grid">
          <article className="fd-card">
            <div className="fd-card-header">
              <h3>Today&apos;s Teaching Plan</h3>
              <span className="fd-chip">March Schedule</span>
            </div>
            <ul className="fd-list">
              {todaysSchedule.map((item) => (
                <li key={`${item.time}-${item.course}`} className="fd-list-item">
                  <div>
                    <strong>{item.time}</strong>
                    <p>{item.course}</p>
                  </div>
                  <span className="fd-room">{item.room}</span>
                </li>
              ))}
            </ul>
          </article>

          <article className="fd-card">
            <div className="fd-card-header">
              <h3>Action Items</h3>
              <span className="fd-chip fd-chip--alert">Priority</span>
            </div>
            <ul className="fd-list">
              {actionItems.map((item) => (
                <li key={item.title} className="fd-list-item">
                  <div>
                    <strong>{item.title}</strong>
                    <p>{item.deadline}</p>
                  </div>
                  <button type="button" className="fd-ghost-btn">Open</button>
                </li>
              ))}
            </ul>
          </article>

          <article className="fd-card fd-card--wide">
            <div className="fd-card-header">
              <h3>Recent Submissions</h3>
              <span className="fd-chip">Latest uploads</span>
            </div>
            <div className="fd-table">
              {recentSubmissions.map((item) => (
                <div key={`${item.student}-${item.assignment}`} className="fd-table-row">
                  <div>
                    <strong>{item.student}</strong>
                    <p>{item.assignment}</p>
                  </div>
                  <span className={statusClassName[item.status]}>{item.status}</span>
                </div>
              ))}
            </div>
          </article>

          <article className="fd-card">
            <div className="fd-card-header">
              <h3>Department Updates</h3>
              <span className="fd-chip">Noticeboard</span>
            </div>
            <ul className="fd-list">
              {announcements.map((item) => (
                <li key={item.title} className="fd-list-item">
                  <div>
                    <strong>{item.title}</strong>
                    <p>{item.meta}</p>
                  </div>
                </li>
              ))}
            </ul>
          </article>

          <article className="fd-card">
            <div className="fd-card-header">
              <h3>Course Progress</h3>
              <span className="fd-chip">Coverage</span>
            </div>
            <div className="fd-progress-list">
              {performance.map((item) => (
                <div key={item.course} className="fd-progress-item">
                  <div className="fd-progress-meta">
                    <strong>{item.course}</strong>
                    <span>{item.completion}%</span>
                  </div>
                  <div className="fd-progress-track">
                    <div className="fd-progress-fill" style={{ width: `${item.completion}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </article>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default FacultyDashboard;
