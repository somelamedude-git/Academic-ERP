import { useEffect, useState } from "react";
import Navbar from "../components/Navbar.jsx";
import Footer from "../components/Footer.jsx";
import { getMyCourses, getFacultyQuizzes, createQuiz, setQuizVisibility, expireQuiz, getQuizSubmissions, reviewAndDeleteSubmission } from "../Services/api.js";
import "../Styles/Faculty.css";

const emptyQuiz = { title: "", courseId: "", mode: "EXTERNAL_LINK", externalLink: "", questions: [] };
const emptyQuestion = { questionText: "", options: ["", "", "", ""], correctAnswer: "" };

export default function FacultyQuizzes() {
  const [courses, setCourses] = useState([]);
  const [quizzes, setQuizzes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState(emptyQuiz);
  const [questions, setQuestions] = useState([{ ...emptyQuestion }]);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");
  const [formSuccess, setFormSuccess] = useState("");

  const [viewSubs, setViewSubs] = useState(null);
  const [subs, setSubs] = useState([]);
  const [subsLoading, setSubsLoading] = useState(false);

  useEffect(() => {
    Promise.all([getMyCourses(), getFacultyQuizzes()])
      .then(([cRes, qRes]) => {
        setCourses(cRes.courses ?? []);
        setQuizzes(qRes.quizzes ?? []);
      })
      .catch(err => setError(err.message || "Failed to load."))
      .finally(() => setLoading(false));
  }, []);

  const reload = () => getFacultyQuizzes().then(r => setQuizzes(r.quizzes ?? [])).catch(() => {});

  const handleCreate = async (e) => {
    e.preventDefault();
    setFormError("");
    setSubmitting(true);
    try {
      const payload = { ...form };
      if (form.mode === "IN_APP") {
        payload.questions = questions.map(q => ({
          questionText: q.questionText,
          options: q.options.filter(Boolean),
          correctAnswer: q.correctAnswer
        }));
      }
      await createQuiz(payload);
      setFormSuccess("Quiz created.");
      setForm(emptyQuiz);
      setQuestions([{ ...emptyQuestion }]);
      setShowCreate(false);
      reload();
    } catch (err) {
      setFormError(err.message || "Failed to create quiz.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleVisibility = async (quiz) => {
    try {
      await setQuizVisibility(quiz._id, !quiz.isVisible);
      reload();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleExpire = async (quiz) => {
    if (!confirm(`Expire quiz "${quiz.title}"? Students will no longer see it.`)) return;
    try {
      await expireQuiz(quiz._id);
      reload();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleViewSubs = async (quiz) => {
    setViewSubs(quiz);
    setSubsLoading(true);
    try {
      const res = await getQuizSubmissions(quiz._id);
      setSubs(res.submissions ?? []);
    } catch { setSubs([]); }
    finally { setSubsLoading(false); }
  };

  const handleReviewDelete = async (subId) => {
    try {
      await reviewAndDeleteSubmission(subId);
      setSubs(prev => prev.filter(s => s._id !== subId));
    } catch (err) { alert(err.message); }
  };

  const quizStatus = (q) => {
    if (q.isExpired) return { label: "Expired", cls: "fc-badge--expired" };
    if (q.isVisible) return { label: "Visible", cls: "fc-badge--visible" };
    return { label: "Hidden", cls: "fc-badge--hidden" };
  };

  return (
    <div className="fc-page">
      <Navbar />
      <main className="fc-container">
        <header className="fc-header">
          <div><h1>Quizzes</h1><p>Create and manage quizzes for your courses.</p></div>
          <div className="fc-header-actions">
            <button className="fc-btn fc-btn--primary" onClick={() => { setShowCreate(true); setFormError(""); }}>+ New Quiz</button>
          </div>
        </header>

        {formSuccess && <p className="fc-success">{formSuccess}</p>}
        {loading && <p className="fc-muted">Loading quizzes...</p>}
        {!loading && error && <p className="fc-error">{error}</p>}

        {!loading && !error && (
          <div className="fc-card">
            <div className="fc-card-header"><h3>All Quizzes</h3><span className="fc-chip">{quizzes.length} total</span></div>
            {quizzes.length === 0 ? <p className="fc-empty">No quizzes yet.</p> : (
              <ul className="fc-list">
                {quizzes.map(q => {
                  const st = quizStatus(q);
                  return (
                    <li key={q._id} className="fc-list-item">
                      <div>
                        <strong>{q.title}</strong>
                        <p>{q.courseId?.name ?? "—"} · {q.mode} · {q.expiresAt ? `Expires ${new Date(q.expiresAt).toLocaleDateString("en-IN")}` : "No expiry"}</p>
                      </div>
                      <div className="fc-list-actions">
                        <span className={`fc-badge ${st.cls}`}>{st.label}</span>
                        {!q.isExpired && (
                          <button className="fc-btn fc-btn--ghost" style={{ padding: "6px 12px", fontSize: "0.82rem" }} onClick={() => handleVisibility(q)}>
                            {q.isVisible ? "Hide" : "Publish"}
                          </button>
                        )}
                        {!q.isExpired && (
                          <button className="fc-btn fc-btn--danger" style={{ padding: "6px 12px", fontSize: "0.82rem" }} onClick={() => handleExpire(q)}>Expire</button>
                        )}
                        <button className="fc-btn fc-btn--ghost" style={{ padding: "6px 12px", fontSize: "0.82rem" }} onClick={() => handleViewSubs(q)}>Submissions</button>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        )}

        {/* Create Quiz Modal */}
        {showCreate && (
          <div className="fc-modal-overlay" onClick={() => setShowCreate(false)}>
            <div className="fc-modal" style={{ maxWidth: "640px" }} onClick={e => e.stopPropagation()}>
              <h2>New Quiz</h2>
              {formError && <p className="fc-error">{formError}</p>}
              <form onSubmit={handleCreate} className="fc-form">
                <label>Title<input required value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} /></label>
                <label>Course
                  <select required value={form.courseId} onChange={e => setForm(p => ({ ...p, courseId: e.target.value }))}>
                    <option value="">-- Select Course --</option>
                    {courses.map(c => <option key={c._id} value={c._id}>{c.name} ({c.code})</option>)}
                  </select>
                </label>
                <label>Mode
                  <select value={form.mode} onChange={e => setForm(p => ({ ...p, mode: e.target.value }))}>
                    <option value="EXTERNAL_LINK">External Link</option>
                    <option value="IN_APP">In-App Questions</option>
                  </select>
                </label>

                {form.mode === "EXTERNAL_LINK" && (
                  <label>External Quiz URL<input required type="url" value={form.externalLink} onChange={e => setForm(p => ({ ...p, externalLink: e.target.value }))} placeholder="https://forms.google.com/..." /></label>
                )}

                {form.mode === "IN_APP" && (
                  <div>
                    <strong style={{ color: "var(--fc-secondary)", fontSize: "0.9rem" }}>Questions</strong>
                    {questions.map((q, qi) => (
                      <div key={qi} style={{ marginTop: "12px", padding: "14px", background: "#f8fbfa", borderRadius: "12px", border: "1px solid var(--fc-border)" }}>
                        <input placeholder={`Question ${qi + 1}`} value={q.questionText} onChange={e => setQuestions(prev => prev.map((x, i) => i === qi ? { ...x, questionText: e.target.value } : x))} style={{ width: "100%", padding: "8px 12px", border: "1px solid var(--fc-border)", borderRadius: "8px", marginBottom: "8px", fontSize: "0.88rem" }} />
                        {q.options.map((opt, oi) => (
                          <input key={oi} placeholder={`Option ${oi + 1}`} value={opt} onChange={e => setQuestions(prev => prev.map((x, i) => i === qi ? { ...x, options: x.options.map((o, j) => j === oi ? e.target.value : o) } : x))} style={{ width: "100%", padding: "7px 12px", border: "1px solid var(--fc-border)", borderRadius: "8px", marginBottom: "6px", fontSize: "0.85rem" }} />
                        ))}
                        <input placeholder="Correct answer" value={q.correctAnswer} onChange={e => setQuestions(prev => prev.map((x, i) => i === qi ? { ...x, correctAnswer: e.target.value } : x))} style={{ width: "100%", padding: "7px 12px", border: "1px solid #bbf7d0", borderRadius: "8px", fontSize: "0.85rem", background: "#f0fdf4" }} />
                      </div>
                    ))}
                    <button type="button" className="fc-btn fc-btn--ghost" style={{ marginTop: "10px", padding: "7px 14px", fontSize: "0.82rem" }} onClick={() => setQuestions(prev => [...prev, { ...emptyQuestion }])}>+ Add Question</button>
                  </div>
                )}

                <div className="fc-form-actions">
                  <button type="button" className="fc-btn fc-btn--ghost" onClick={() => setShowCreate(false)}>Cancel</button>
                  <button type="submit" className="fc-btn fc-btn--primary" disabled={submitting}>{submitting ? "Creating..." : "Create Quiz"}</button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Submissions Modal */}
        {viewSubs && (
          <div className="fc-modal-overlay" onClick={() => setViewSubs(null)}>
            <div className="fc-modal" style={{ maxWidth: "680px" }} onClick={e => e.stopPropagation()}>
              <h2>Submissions — {viewSubs.title}</h2>
              {subsLoading && <p className="fc-muted">Loading...</p>}
              {!subsLoading && subs.length === 0 && <p className="fc-empty">No submissions yet.</p>}
              {!subsLoading && subs.length > 0 && (
                <ul className="fc-list">
                  {subs.map(s => (
                    <li key={s._id} className="fc-list-item">
                      <div>
                        <strong>{s.studentId?.name ?? "—"}</strong>
                        <p>{s.studentId?.enrollmentNo ?? "—"} · {new Date(s.createdAt).toLocaleDateString("en-IN")}</p>
                      </div>
                      <button className="fc-btn fc-btn--danger" style={{ padding: "6px 12px", fontSize: "0.82rem" }} onClick={() => handleReviewDelete(s._id)}>Review & Delete</button>
                    </li>
                  ))}
                </ul>
              )}
              <div className="fc-form-actions" style={{ marginTop: "16px" }}>
                <button className="fc-btn fc-btn--ghost" onClick={() => setViewSubs(null)}>Close</button>
              </div>
            </div>
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}
