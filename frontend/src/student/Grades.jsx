import { useEffect, useState } from "react";
import Navbar from "../components/Navbar.jsx";
import Footer from "../components/Footer.jsx";
import { getStudentGrades } from "../Services/api.js";
import "../Styles/StudentDashboard.css";

const gradeColor = (g) => {
  if (!g || g === "Pending") return "#6b7280";
  if (["O", "A+", "A"].includes(g)) return "#166534";
  if (["B+", "B"].includes(g)) return "#0369a1";
  if (["C", "D"].includes(g)) return "#b45309";
  return "#b91c1c";
};

export default function Grades() {
  const [grades, setGrades] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    getStudentGrades()
      .then(res => setGrades(res.grades ?? []))
      .catch(err => setError(err.message || "Failed to load grades."))
      .finally(() => setLoading(false));
  }, []);

  const avg = grades.length
    ? (grades.reduce((s, g) => s + (g.percentage ?? 0), 0) / grades.length).toFixed(1)
    : null;

  return (
    <div className="sd-page">
      <Navbar />
      <main className="sd-container">
        <header className="sd-topbar">
          <div>
            <h1>My Grades</h1>
            <p>Final grades for your current semester courses.</p>
          </div>
          {avg && (
            <div className="sd-actions">
              <div className="sd-card sd-stat-card" style={{ minWidth: "140px", textAlign: "center" }}>
                <p className="sd-label">Semester Average</p>
                <h2>{avg}%</h2>
              </div>
            </div>
          )}
        </header>

        {loading && <p className="sd-muted" style={{ padding: "2rem" }}>Loading grades...</p>}
        {!loading && error && <p className="sd-error" style={{ padding: "2rem" }}>{error}</p>}

        {!loading && !error && grades.length === 0 && (
          <p className="sd-muted" style={{ padding: "2rem" }}>No grades available yet.</p>
        )}

        {!loading && !error && grades.length > 0 && (
          <section className="sd-grid sd-main">
            {grades.map((g, i) => (
              <div key={i} className="sd-card">
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <div>
                    <p className="sd-label">{g.course.code}</p>
                    <h3 style={{ margin: "6px 0 4px", color: "#17324d" }}>{g.course.name}</h3>
                    {g.rollNumber && <p className="sd-subtext">Roll No: {g.rollNumber}</p>}
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <span style={{
                      display: "inline-block", padding: "6px 16px", borderRadius: "999px",
                      fontWeight: 700, fontSize: "1.1rem",
                      background: `${gradeColor(g.grade)}18`,
                      color: gradeColor(g.grade),
                      border: `1.5px solid ${gradeColor(g.grade)}40`
                    }}>
                      {g.grade}
                    </span>
                    {g.percentage !== null && (
                      <p className="sd-subtext" style={{ marginTop: "6px" }}>{g.percentage}%</p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </section>
        )}
      </main>
      <Footer />
    </div>
  );
}
