import { useEffect, useState } from "react";
import Navbar from "../components/Navbar.jsx";
import Footer from "../components/Footer.jsx";
import "../Styles/StudentDashboard.css";
import { getStudentDashboard } from "../Services/api.js";

const StudentDashBoard = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let isMounted = true;
    getStudentDashboard()
      .then(res => { if (isMounted) setData(res); })
      .catch(err => { if (isMounted) setError(err.message || "Failed to load dashboard."); })
      .finally(() => { if (isMounted) setLoading(false); });
    return () => { isMounted = false; };
  }, []);

  const quickStats = data?.quickStats ?? [];
  const assignments = data?.assignments ?? [];
  const attendanceTrend = data?.attendanceTrend ?? [];
  const studentName = data?.student?.name ?? "";

  return (
    <div className="sd-page">
      <Navbar />
      <main className="sd-container">
        <header className="sd-topbar">
          <div>
            <h1>Student Dashboard</h1>
            <p>Welcome back{studentName ? `, ${studentName}` : ""}. Here is your academic snapshot.</p>
          </div>
          <div className="sd-actions">
            <input className="sd-search" type="text" placeholder="Search courses, assignments..." />
            <div className="sd-avatar">{studentName ? studentName.slice(0, 2).toUpperCase() : "ST"}</div>
          </div>
        </header>

        {loading && <p className="sd-muted" style={{ padding: "2rem" }}>Loading dashboard...</p>}
        {!loading && error && <p className="sd-error" style={{ padding: "2rem" }}>{error}</p>}

        {!loading && !error && (
          <>
            <section className="sd-grid sd-stats">
              {quickStats.map((stat) => (
                <div key={stat.label} className="sd-card sd-stat-card">
                  <p className="sd-label">{stat.label}</p>
                  <h2>{stat.value}</h2>
                  <span className="sd-subtext">{stat.subtext}</span>
                </div>
              ))}
            </section>

            <section className="sd-grid sd-main">
              <div className="sd-card">
                <div className="sd-card-header">
                  <h3>Assignments</h3>
                  <a href="/student/assignments" className="sd-link">View All</a>
                </div>
                {assignments.length === 0 ? (
                  <p className="sd-muted">No assignments yet.</p>
                ) : (
                  <ul className="sd-list">
                    {assignments.map((item) => (
                      <li key={item.id} className="sd-list-item">
                        <div>
                          <strong>{item.title}</strong>
                          <p>{item.course}</p>
                        </div>
                        <div className={`sd-pill ${item.status === "Submitted" ? "sd-pill--ok" : "sd-pill--warn"}`}>
                          {item.due}
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <div className="sd-card sd-wide">
                <div className="sd-card-header">
                  <h3>Attendance Trend</h3>
                  <span className="sd-chip">Last 8 weeks</span>
                </div>
                {attendanceTrend.length === 0 ? (
                  <p className="sd-muted">No attendance data yet.</p>
                ) : (
                  <div className="sd-chart">
                    {attendanceTrend.map((val, index) => (
                      <div key={index} className="sd-bar-col">
                        <div className="sd-bar" style={{ height: `${val}%` }}>
                          <span>{val}%</span>
                        </div>
                        <span className="sd-week">W{index + 1}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </section>
          </>
        )}
      </main>
      <Footer />
    </div>
  );
};

export default StudentDashBoard;
