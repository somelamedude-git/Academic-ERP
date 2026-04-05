import { useEffect, useState } from "react";
import Navbar from "../components/Navbar.jsx";
import Footer from "../components/Footer.jsx";
import "../Styles/StudentDashboard.css";

const StudentDashBoard = () => {
  const [quickStats, setQuickStats] = useState([]);
  const [statsLoading, setStatsLoading] = useState(true);
  const [statsError, setStatsError] = useState("");

  const [todaysSchedule, setTodaysSchedule] = useState([]);
  const [scheduleLoading, setScheduleLoading] = useState(true);
  const [scheduleError, setScheduleError] = useState("");

  const [assignments, setAssignments] = useState([]);
  const [assignmentsLoading, setAssignmentsLoading] = useState(true);
  const [assignmentsError, setAssignmentsError] = useState("");

  const [announcements, setAnnouncements] = useState([]);
  const [announcementsLoading, setAnnouncementsLoading] = useState(true);
  const [announcementsError, setAnnouncementsError] = useState("");

  const [attendanceTrend, setAttendanceTrend] = useState([]);
  const [trendLoading, setTrendLoading] = useState(true);
  const [trendError, setTrendError] = useState("");

  useEffect(() => {
    let isMounted = true;

    const loadQuickStats = async () => {
      try {
        setStatsLoading(true);
        setStatsError("");

        const response = await fetch("/student/quick-stats");
        if (!response.ok) {
          throw new Error(`Failed to load stats (${response.status})`);
        }

        const data = await response.json();
        if (isMounted) {
          setQuickStats(Array.isArray(data) ? data : []);
        }
      } catch (error) {
        if (isMounted) {
          setStatsError(error.message || "Failed to load quick stats.");
        }
      } finally {
        if (isMounted) {
          setStatsLoading(false);
        }
      }
    };

    loadQuickStats();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    let isMounted = true;

    const loadSchedule = async () => {
      try {
        setScheduleLoading(true);
        setScheduleError("");

        const response = await fetch("/student/todays-schedule");
        if (!response.ok) {
          throw new Error(`Failed to load schedule (${response.status})`);
        }

        const data = await response.json();
        if (isMounted) {
          setTodaysSchedule(Array.isArray(data) ? data : []);
        }
      } catch (error) {
        if (isMounted) {
          setScheduleError(error.message || "Failed to load schedule.");
        }
      } finally {
        if (isMounted) {
          setScheduleLoading(false);
        }
      }
    };

    loadSchedule();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    let isMounted = true;

    const loadAssignments = async () => {
      try {
        setAssignmentsLoading(true);
        setAssignmentsError("");

        const response = await fetch("/student/assignments");
        if (!response.ok) {
          throw new Error(`Failed to load assignments (${response.status})`);
        }

        const data = await response.json();
        if (isMounted) {
          setAssignments(Array.isArray(data) ? data : []);
        }
      } catch (error) {
        if (isMounted) {
          setAssignmentsError(error.message || "Failed to load assignments.");
        }
      } finally {
        if (isMounted) {
          setAssignmentsLoading(false);
        }
      }
    };

    loadAssignments();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    let isMounted = true;

    const loadAnnouncements = async () => {
      try {
        setAnnouncementsLoading(true);
        setAnnouncementsError("");

        const response = await fetch("/student/announcements");
        if (!response.ok) {
          throw new Error(`Failed to load announcements (${response.status})`);
        }

        const data = await response.json();
        if (isMounted) {
          setAnnouncements(Array.isArray(data) ? data : []);
        }
      } catch (error) {
        if (isMounted) {
          setAnnouncementsError(error.message || "Failed to load announcements.");
        }
      } finally {
        if (isMounted) {
          setAnnouncementsLoading(false);
        }
      }
    };

    loadAnnouncements();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    let isMounted = true;

    const loadAttendanceTrend = async () => {
      try {
        setTrendLoading(true);
        setTrendError("");

        const response = await fetch("/student/attendance-trend");
        if (!response.ok) {
          throw new Error(`Failed to load attendance trend (${response.status})`);
        }

        const data = await response.json();
        if (isMounted) {
          setAttendanceTrend(Array.isArray(data) ? data : []);
        }
      } catch (error) {
        if (isMounted) {
          setTrendError(error.message || "Failed to load attendance trend.");
        }
      } finally {
        if (isMounted) {
          setTrendLoading(false);
        }
      }
    };

    loadAttendanceTrend();

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <div className="sd-page">
      <Navbar />
      <main className="sd-container">
        <header className="sd-topbar">
          <div>
            <h1>Student Dashboard</h1>
            <p>Welcome back, Farhan. Here is your academic snapshot.</p>
          </div>
          <div className="sd-actions">
            <input className="sd-search" type="text" placeholder="Search courses, assignments..." />
            <div className="sd-avatar">FM</div>
          </div>
        </header>

        <section className="sd-grid sd-stats">
          {statsLoading && <p className="sd-muted">Loading stats...</p>}
          {!statsLoading && statsError && (
            <p className="sd-error">{statsError}</p>
          )}
          {!statsLoading &&
            !statsError &&
            quickStats.map((stat) => (
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
              <h3>Today&apos;s Schedule</h3>
              <span className="sd-chip">Mon</span>
            </div>
            {scheduleLoading && <p className="sd-muted">Loading schedule...</p>}
            {!scheduleLoading && scheduleError && (
              <p className="sd-error">{scheduleError}</p>
            )}
            {!scheduleLoading && !scheduleError && (
              <ul className="sd-list">
                {todaysSchedule.map((item) => (
                  <li key={`${item.time}-${item.course}`} className="sd-list-item">
                    <div>
                      <strong>{item.time}</strong>
                      <p>{item.course}</p>
                    </div>
                    <span className="sd-room">{item.room}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="sd-card">
            <div className="sd-card-header">
              <h3>Assignments</h3>
              <button className="sd-link">View All</button>
            </div>
            {assignmentsLoading && <p className="sd-muted">Loading assignments...</p>}
            {!assignmentsLoading && assignmentsError && (
              <p className="sd-error">{assignmentsError}</p>
            )}
            {!assignmentsLoading && !assignmentsError && (
              <ul className="sd-list">
                {assignments.map((item) => (
                  <li key={item.title} className="sd-list-item">
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

          <div className="sd-card">
            <div className="sd-card-header">
              <h3>Announcements</h3>
              <button className="sd-link">See Updates</button>
            </div>
            {announcementsLoading && <p className="sd-muted">Loading updates...</p>}
            {!announcementsLoading && announcementsError && (
              <p className="sd-error">{announcementsError}</p>
            )}
            {!announcementsLoading && !announcementsError && (
              <ul className="sd-list">
                {announcements.map((item) => (
                  <li key={item.title} className="sd-list-item">
                    <div>
                      <strong>{item.title}</strong>
                      <p className="sd-tag">{item.tag}</p>
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
            {trendLoading && <p className="sd-muted">Loading trend...</p>}
            {!trendLoading && trendError && <p className="sd-error">{trendError}</p>}
            {!trendLoading && !trendError && (
              <div className="sd-chart">
                {attendanceTrend.map((val, index) => (
                  <div key={val + index} className="sd-bar-col">
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
      </main>
      <Footer />
    </div>
  );
};

export default StudentDashBoard;
