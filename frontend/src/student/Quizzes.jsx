import { useEffect, useState } from "react";
import Navbar from "../components/Navbar.jsx";
import Footer from "../components/Footer.jsx";
import { getStudentCourses, getCourseQuizzes, submitQuiz } from "../Services/api.js";
import "../Styles/StudentDashboard.css";

export default function Quizzes() {
  const [courses, setCourses] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState("");
  const [quizzes, setQuizzes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [activeQuiz, setActiveQuiz] = useState(null);
  const [answers, setAnswers] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState("");
  const [submitError, setSubmitError] = useState("");

  useEffect(() => {
    getStudentCourses()
      .then(res => {
        const list = res.courses ?? [];
        setCourses(list);
        if (list.length > 0) setSelectedCourse(list[0]._id);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!selectedCourse) return;
    setLoading(true);
    setError("");
    getCourseQuizzes(selectedCourse)
      .then(res => setQuizzes(res.quizzes ?? []))
      .catch(err => setError(err.message || "Failed to load quizzes."))
      .finally(() => setLoading(false));
  }, [selectedCourse]);

  const handleSubmitQuiz = async () => {
    const answerArray = Object.entries(answers).map(([questionId, answerText]) => ({ questionId, answerText }));
    setSubmitting(true);
    setSubmitError("");
    try {
      await submitQuiz(activeQuiz._id, answerArray);
      setSubmitSuccess("Quiz submitted successfully!");
      setActiveQuiz(null);
      setAnswers({});
      // Refresh quiz list
      const res = await getCourseQuizzes(selectedCourse);
      setQuizzes(res.quizzes ?? []);
    } catch (err) {
      setSubmitError(err.message || "Failed to submit quiz.");
    } finally {
      setSubmitting(false);
    }
  };

  const timeLeft = (expiresAt) => {
    if (!expiresAt) return null;
    const diff = new Date(expiresAt) - new Date();
    if (diff <= 0) return "Expired";
    const hours = Math.floor(diff / 3600000);
    const mins = Math.floor((diff % 3600000) / 60000);
    return hours > 0 ? `${hours}h ${mins}m left` : `${mins}m left`;
  };

  return (
    <div className="sd-page">
      <Navbar />
      <main className="sd-container">
        <header className="sd-topbar">
          <div>
            <h1>Quizzes</h1>
            <p>Active quizzes for your enrolled courses.</p>
          </div>
          <div className="sd-actions">
            <select
              style={{ padding: "10px 14px", border: "1px solid #dbe7e4", borderRadius: "10px", fontSize: "0.9rem", background: "#fff" }}
              value={selectedCourse}
              onChange={e => setSelectedCourse(e.target.value)}
            >
              {courses.map(c => <option key={c._id} value={c._id}>{c.name} ({c.code})</option>)}
            </select>
          </div>
        </header>

        {submitSuccess && <p className="sd-muted" style={{ padding: "0 0 1rem", color: "#166534", background: "#f0fdf4", borderRadius: "10px", padding: "10px 16px", marginBottom: "16px" }}>{submitSuccess}</p>}
        {loading && <p className="sd-muted" style={{ padding: "2rem" }}>Loading quizzes...</p>}
        {!loading && error && <p className="sd-error" style={{ padding: "2rem" }}>{error}</p>}
        {!loading && !error && quizzes.length === 0 && (
          <p className="sd-muted" style={{ padding: "2rem" }}>No active quizzes for this course.</p>
        )}

        {!loading && !error && quizzes.length > 0 && (
          <section className="sd-grid sd-main">
            {quizzes.map(q => (
              <div key={q._id} className="sd-card">
                <div className="sd-card-header">
                  <h3>{q.title}</h3>
                  <span className="sd-chip">{q.mode}</span>
                </div>
                {q.expiresAt && (
                  <p className="sd-subtext" style={{ marginBottom: "12px" }}>{timeLeft(q.expiresAt)}</p>
                )}
                {q.mode === "EXTERNAL_LINK" && (
                  <a href={q.externalLink} target="_blank" rel="noreferrer"
                    style={{ display: "inline-block", padding: "10px 20px", background: "linear-gradient(135deg,#0f5f56,#1f8a70)", color: "#fff", borderRadius: "999px", fontWeight: 700, textDecoration: "none", fontSize: "0.9rem" }}>
                    Open Quiz
                  </a>
                )}
                {q.mode === "IN_APP" && (
                  <button
                    style={{ padding: "10px 20px", background: "linear-gradient(135deg,#0f5f56,#1f8a70)", color: "#fff", border: "none", borderRadius: "999px", fontWeight: 700, cursor: "pointer", fontSize: "0.9rem" }}
                    onClick={() => { setActiveQuiz(q); setAnswers({}); setSubmitError(""); setSubmitSuccess(""); }}
                  >
                    Start Quiz
                  </button>
                )}
              </div>
            ))}
          </section>
        )}

        {/* In-App Quiz Modal */}
        {activeQuiz && (
          <div style={{ position: "fixed", inset: 0, background: "rgba(15,30,50,0.5)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: "20px" }}
            onClick={() => setActiveQuiz(null)}>
            <div style={{ background: "#fff", borderRadius: "24px", padding: "32px", width: "100%", maxWidth: "600px", maxHeight: "90vh", overflowY: "auto", boxShadow: "0 32px 64px rgba(15,30,50,0.2)" }}
              onClick={e => e.stopPropagation()}>
              <h2 style={{ margin: "0 0 20px", color: "#17324d" }}>{activeQuiz.title}</h2>
              {submitError && <p style={{ color: "#b91c1c", background: "#fff5f5", border: "1px solid #fecaca", borderRadius: "10px", padding: "10px 14px", marginBottom: "16px" }}>{submitError}</p>}
              <div style={{ display: "grid", gap: "20px" }}>
                {activeQuiz.questions.map((q, qi) => (
                  <div key={q._id} style={{ padding: "16px", background: "#f8fbfa", borderRadius: "14px", border: "1px solid #edf3f1" }}>
                    <p style={{ margin: "0 0 12px", fontWeight: 600, color: "#17324d" }}>{qi + 1}. {q.questionText}</p>
                    {q.options.length > 0 ? (
                      <div style={{ display: "grid", gap: "8px" }}>
                        {q.options.map((opt, oi) => (
                          <label key={oi} style={{ display: "flex", alignItems: "center", gap: "10px", cursor: "pointer", padding: "8px 12px", borderRadius: "8px", background: answers[q._id] === opt ? "#e5f2ef" : "#fff", border: `1px solid ${answers[q._id] === opt ? "#0f5f56" : "#dbe7e4"}` }}>
                            <input type="radio" name={q._id} value={opt} checked={answers[q._id] === opt} onChange={() => setAnswers(p => ({ ...p, [q._id]: opt }))} />
                            {opt}
                          </label>
                        ))}
                      </div>
                    ) : (
                      <input
                        placeholder="Your answer..."
                        value={answers[q._id] ?? ""}
                        onChange={e => setAnswers(p => ({ ...p, [q._id]: e.target.value }))}
                        style={{ width: "100%", padding: "9px 12px", border: "1px solid #dbe7e4", borderRadius: "8px", fontSize: "0.9rem", boxSizing: "border-box" }}
                      />
                    )}
                  </div>
                ))}
              </div>
              <div style={{ display: "flex", justifyContent: "flex-end", gap: "12px", marginTop: "24px" }}>
                <button style={{ padding: "10px 20px", borderRadius: "999px", border: "1px solid #dbe7e4", background: "#fff", cursor: "pointer", fontWeight: 600 }} onClick={() => setActiveQuiz(null)}>Cancel</button>
                <button style={{ padding: "10px 20px", borderRadius: "999px", background: "linear-gradient(135deg,#0f5f56,#1f8a70)", color: "#fff", border: "none", cursor: "pointer", fontWeight: 700 }} onClick={handleSubmitQuiz} disabled={submitting}>
                  {submitting ? "Submitting..." : "Submit Quiz"}
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}
