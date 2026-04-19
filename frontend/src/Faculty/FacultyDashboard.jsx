import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
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

<<<<<<< HEAD
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

const pendingSubmissions = [
  { id: 1, student: "Vikram Singh", assignment: "ER Diagram Assignment", due: "Yesterday" },
  { id: 2, student: "Priya Das", assignment: "Process Scheduling Case Study", due: "Tomorrow" },
  { id: 3, student: "Amit Kumar", assignment: "Compiler Lexical Analysis", due: "Today" },
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
  const navigate = useNavigate();
  const [remindersStatus, setRemindersStatus] = useState("idle");
  const [courses, setCourses] = useState([]);
  const [recentSubmissionsApi, setRecentSubmissionsApi] = useState([]);
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
              setRecentSubmissionsApi((sRes.submissions ?? []).slice(0, 5));
            }
          } catch { /* non-critical */ }
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleSendAllReminders = () => {
    setRemindersStatus("sending");
    setTimeout(() => {
      setRemindersStatus("sent");
    }, 1200);
  };

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
                  <button 
                    type="button" 
                    className="fd-ghost-btn"
                    onClick={() => {
                      if (item.title === "Upload Week 6 Assignment") {
                        navigate("/faculty/upload-assignment");
                      }
                    }}
                  >
                    Open
                  </button>
                </li>
              ))}
            </ul>
          </article>


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

          <article className="fd-card fd-card--wide">
            <div className="fd-card-header" style={{ alignItems: "center" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                <h3>Pending Submissions</h3>
                <span className="fd-chip fd-chip--alert">Requires Action</span>
              </div>
              <button 
                type="button" 
                className="fd-ghost-btn"
                onClick={handleSendAllReminders}
                disabled={remindersStatus !== "idle"}
                style={{ 
                  color: remindersStatus === "sent" ? "#10b981" : undefined,
                  fontSize: "13px"
                }}
              >
                {remindersStatus === "sending" ? "Sending..." : remindersStatus === "sent" ? "✓ Reminded All" : "Remind All"}
              </button>
            </div>
            <div className="fd-table">
              {pendingSubmissions.map((item) => (
                <div key={item.id} className="fd-table-row">
                  <div>
                    <strong>{item.student}</strong>
                    <p>{item.assignment} • Due: {item.due}</p>
                  </div>
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

          {recentSubmissionsApi.length > 0 && (
            <article className="fd-card fd-card--wide">
              <div className="fd-card-header">
                <h3>Latest API Submissions</h3>
                <span className="fd-chip">Latest</span>
              </div>
              <div className="fd-table">
                {recentSubmissionsApi.map(s => (
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
