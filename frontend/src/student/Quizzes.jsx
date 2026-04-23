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
  const [quizResult, setQuizResult] = useState(null); // { score, totalMarks, percentage, details }

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
      const res = await submitQuiz(activeQuiz._id, answerArray);
      setQuizResult(res.result ?? null);
      setActiveQuiz(null);
      setAnswers({});
      // Refresh quiz list
      const refreshed = await getCourseQuizzes(selectedCourse);
      setQuizzes(refreshed.quizzes ?? []);
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
              style={{
                padding: "9px 14px", border: "1px solid var(--glass-border)",
                borderRadius: "var(--radius-sm)", fontSize: "13px",
                background: "var(--glass)", color: "var(--text-primary)", outline: "none",
              }}
              value={selectedCourse}
              onChange={e => setSelectedCourse(e.target.value)}
            >
              {courses.map(c => <option key={c._id} value={c._id}>{c.name} ({c.code})</option>)}
            </select>
          </div>
        </header>

        {submitSuccess && <p className="sd-muted" style={{ padding: "0 0 1rem", color: "#166534", background: "#f0fdf4", borderRadius: "10px", padding: "10px 16px", marginBottom: "16px" }}>{submitSuccess}</p>}        {loading && <p className="sd-muted" style={{ padding: "2rem" }}>Loading quizzes...</p>}
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
                    style={{
                      display: "inline-flex", alignItems: "center", padding: "9px 20px",
                      background: "var(--accent-indigo)", color: "#fff",
                      borderRadius: "var(--radius-sm)", fontWeight: 700,
                      textDecoration: "none", fontSize: "13px",
                      boxShadow: "0 0 16px rgba(99,102,241,0.25)",
                    }}>
                    Open Quiz ↗
                  </a>
                )}
                {q.mode === "IN_APP" && (
                  <button
                    style={{
                      padding: "9px 20px", background: "var(--accent-indigo)", color: "#fff",
                      border: "none", borderRadius: "var(--radius-sm)", fontWeight: 700,
                      cursor: "pointer", fontSize: "13px",
                      boxShadow: "0 0 16px rgba(99,102,241,0.25)",
                    }}
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
          <div
            style={{
              position: "fixed", inset: 0,
              background: "rgba(0,0,0,0.7)", backdropFilter: "blur(8px)",
              display: "flex", alignItems: "center", justifyContent: "center",
              zIndex: 1000, padding: "20px",
            }}
            onClick={() => setActiveQuiz(null)}
          >
            <div
              style={{
                background: "var(--bg-elevated)", border: "1px solid var(--glass-border)",
                borderRadius: "var(--radius-xl)", padding: "32px",
                width: "100%", maxWidth: "640px", maxHeight: "90vh", overflowY: "auto",
                boxShadow: "var(--shadow-lg)",
              }}
              onClick={e => e.stopPropagation()}
            >
              <h2 style={{ margin: "0 0 24px", color: "var(--text-primary)", fontSize: "20px", fontWeight: 700 }}>
                {activeQuiz.title}
              </h2>

              {submitError && (
                <p style={{
                  color: "var(--danger)", background: "var(--danger-soft)",
                  border: "1px solid rgba(248,113,113,0.2)", borderRadius: "var(--radius-sm)",
                  padding: "10px 14px", marginBottom: "20px", fontSize: "13px",
                }}>
                  {submitError}
                </p>
              )}

              <div style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
                {activeQuiz.questions.map((q, qi) => (
                  <div
                    key={q._id}
                    style={{
                      padding: "18px", background: "var(--glass)", border: "1px solid var(--glass-border)",
                      borderRadius: "var(--radius-md)", transition: "border-color 0.15s",
                    }}
                  >
                    <p style={{
                      margin: "0 0 14px", fontWeight: 600, color: "var(--text-primary)",
                      fontSize: "14px", lineHeight: 1.5,
                    }}>
                      <span style={{ color: "var(--accent-cyan)", marginRight: "8px" }}>Q{qi + 1}.</span>
                      {q.questionText}
                    </p>

                    {q.options.length > 0 ? (
                      <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                        {q.options.map((opt, oi) => {
                          const isSelected = answers[q._id] === opt;
                          return (
                            <label
                              key={oi}
                              style={{
                                display: "flex", alignItems: "center", gap: "12px",
                                padding: "10px 14px", borderRadius: "var(--radius-sm)",
                                background: isSelected ? "var(--accent-indigo-soft)" : "var(--glass-light)",
                                border: `1px solid ${isSelected ? "var(--accent-indigo)" : "var(--glass-border)"}`,
                                cursor: "pointer", transition: "all 0.15s",
                                fontSize: "13px", color: "var(--text-primary)",
                              }}
                            >
                              <input
                                type="radio"
                                name={q._id}
                                value={opt}
                                checked={isSelected}
                                onChange={() => setAnswers(p => ({ ...p, [q._id]: opt }))}
                                style={{ accentColor: "var(--accent-indigo)" }}
                              />
                              {opt}
                            </label>
                          );
                        })}
                      </div>
                    ) : (
                      <input
                        placeholder="Type your answer..."
                        value={answers[q._id] ?? ""}
                        onChange={e => setAnswers(p => ({ ...p, [q._id]: e.target.value }))}
                        style={{
                          width: "100%", padding: "10px 14px",
                          background: "var(--glass)", border: "1px solid var(--glass-border)",
                          borderRadius: "var(--radius-sm)", color: "var(--text-primary)",
                          fontSize: "13px", outline: "none", boxSizing: "border-box",
                          transition: "border-color 0.15s",
                        }}
                        onFocus={e => e.target.style.borderColor = "var(--accent-indigo)"}
                        onBlur={e => e.target.style.borderColor = "var(--glass-border)"}
                      />
                    )}
                  </div>
                ))}
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "28px" }}>
                <button
                  style={{
                    padding: "10px 24px", borderRadius: "var(--radius-sm)",
                    border: "1px solid var(--glass-border)", background: "var(--glass)",
                    color: "var(--text-secondary)", cursor: "pointer", fontWeight: 600,
                    fontSize: "13px", transition: "all 0.15s",
                  }}
                  onClick={() => setActiveQuiz(null)}
                >
                  Cancel
                </button>
                <button
                  style={{
                    padding: "10px 24px", borderRadius: "var(--radius-sm)",
                    background: "var(--accent-indigo)", color: "#fff",
                    border: "none", cursor: "pointer", fontWeight: 700,
                    fontSize: "13px", boxShadow: "0 0 20px rgba(99,102,241,0.25)",
                    transition: "all 0.15s",
                  }}
                  onClick={handleSubmitQuiz}
                  disabled={submitting}
                  onMouseEnter={e => !submitting && (e.target.style.background = "#818cf8")}
                  onMouseLeave={e => e.target.style.background = "var(--accent-indigo)"}
                >
                  {submitting ? "Submitting..." : "Submit Quiz"}
                </button>
              </div>
            </div>
          </div>
        )}
        {/* Result Modal */}
        {quizResult && (
          <div
            style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", backdropFilter: "blur(8px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: "20px" }}
            onClick={() => setQuizResult(null)}
          >
            <div
              style={{ background: "var(--bg-elevated)", border: "1px solid var(--glass-border)", borderRadius: "var(--radius-xl)", padding: "32px", width: "100%", maxWidth: "600px", maxHeight: "90vh", overflowY: "auto", boxShadow: "var(--shadow-lg)" }}
              onClick={e => e.stopPropagation()}
            >
              {/* Score header */}
              <div style={{ textAlign: "center", marginBottom: "28px" }}>
                <div style={{
                  width: "80px", height: "80px", borderRadius: "50%", margin: "0 auto 16px",
                  background: quizResult.percentage >= 70 ? "var(--success-soft)" : quizResult.percentage >= 40 ? "var(--warning-soft)" : "var(--danger-soft)",
                  border: `3px solid ${quizResult.percentage >= 70 ? "var(--success)" : quizResult.percentage >= 40 ? "var(--warning)" : "var(--danger)"}`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: "22px", fontWeight: 800,
                  color: quizResult.percentage >= 70 ? "var(--success)" : quizResult.percentage >= 40 ? "var(--warning)" : "var(--danger)",
                }}>
                  {quizResult.percentage}%
                </div>
                <h2 style={{ color: "var(--text-primary)", fontSize: "20px", marginBottom: "4px" }}>
                  {quizResult.percentage >= 70 ? "Great job!" : quizResult.percentage >= 40 ? "Not bad!" : "Keep practicing!"}
                </h2>
                <p style={{ color: "var(--text-muted)", fontSize: "14px" }}>
                  You scored <strong style={{ color: "var(--text-primary)" }}>{quizResult.score}</strong> out of <strong style={{ color: "var(--text-primary)" }}>{quizResult.totalMarks}</strong>
                </p>
              </div>

              {/* Per-question breakdown */}
              {quizResult.details?.length > 0 && (
                <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                  {quizResult.details.map((d, i) => (
                    <div key={i} style={{
                      padding: "14px 16px", borderRadius: "var(--radius-sm)",
                      background: d.isCorrect ? "var(--success-soft)" : "var(--danger-soft)",
                      border: `1px solid ${d.isCorrect ? "rgba(52,211,153,0.2)" : "rgba(248,113,113,0.2)"}`,
                    }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "12px" }}>
                        <p style={{ fontSize: "13px", color: "var(--text-primary)", fontWeight: 600, flex: 1 }}>
                          Q{i + 1}. {d.questionText}
                        </p>
                        <span style={{ fontSize: "16px", flexShrink: 0 }}>{d.isCorrect ? "✓" : "✗"}</span>
                      </div>
                      <div style={{ marginTop: "8px", fontSize: "12px" }}>
                        <span style={{ color: "var(--text-muted)" }}>Your answer: </span>
                        <span style={{ color: d.isCorrect ? "var(--success)" : "var(--danger)", fontWeight: 600 }}>
                          {d.yourAnswer || "—"}
                        </span>
                        {!d.isCorrect && (
                          <>
                            <span style={{ color: "var(--text-muted)", marginLeft: "12px" }}>Correct: </span>
                            <span style={{ color: "var(--success)", fontWeight: 600 }}>{d.correctAnswer}</span>
                          </>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <button
                style={{ width: "100%", marginTop: "24px", padding: "12px", background: "var(--accent-indigo)", color: "#fff", border: "none", borderRadius: "var(--radius-sm)", fontWeight: 700, fontSize: "14px", cursor: "pointer" }}
                onClick={() => setQuizResult(null)}
              >
                Done
              </button>
            </div>
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}
