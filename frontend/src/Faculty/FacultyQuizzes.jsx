import { useEffect, useState } from "react";
import Navbar from "../components/Navbar.jsx";
import Footer from "../components/Footer.jsx";
import {
  getMyCourses,
  getFacultyQuizzes, createQuiz,
  setQuizVisibility, expireQuiz,
  getQuizSubmissions, reviewAndDeleteSubmission,
} from "../Services/api.js";
import "../Styles/Faculty.css";

const emptyQuiz = { title: "", courseId: "", mode: "EXTERNAL_LINK", externalLink: "" };
const emptyQuestion = { questionText: "", options: ["", "", "", ""], correctAnswer: "" };

// ── RAG question card ─────────────────────────────────────────────────────────
function RAGQuestionCard({ q, index, onChange, onRemove }) {
  return (
    <div style={{
      padding: "16px", borderRadius: "var(--radius-sm)",
      background: "var(--glass-light)", border: "1px solid var(--glass-border)",
      marginBottom: "12px",
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "10px" }}>
        <span style={{ fontSize: "11px", fontWeight: 700, color: "var(--accent-cyan)", textTransform: "uppercase", letterSpacing: "0.5px" }}>
          Q{index + 1} · {q.question_type ?? "MCQ"}
        </span>
        <button
          type="button"
          onClick={onRemove}
          style={{ background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer", fontSize: "16px", lineHeight: 1 }}
        >✕</button>
      </div>

      <textarea
        value={q.question_text}
        onChange={e => onChange({ ...q, question_text: e.target.value })}
        rows={2}
        style={{ width: "100%", padding: "8px 12px", background: "var(--glass)", border: "1px solid var(--glass-border)", borderRadius: "var(--radius-xs)", color: "var(--text-primary)", fontSize: "13px", resize: "vertical", fontFamily: "inherit", boxSizing: "border-box", marginBottom: "8px" }}
      />

      {q.options?.length > 0 && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "6px", marginBottom: "8px" }}>
          {q.options.map((opt, oi) => (
            <input
              key={oi}
              value={opt}
              onChange={e => onChange({ ...q, options: q.options.map((o, j) => j === oi ? e.target.value : o) })}
              placeholder={`Option ${oi + 1}`}
              style={{ padding: "7px 10px", background: "var(--glass)", border: "1px solid var(--glass-border)", borderRadius: "var(--radius-xs)", color: "var(--text-primary)", fontSize: "12px" }}
            />
          ))}
        </div>
      )}

      <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
        <span style={{ fontSize: "11px", color: "var(--text-muted)", flexShrink: 0 }}>Correct:</span>
        <input
          value={q.correct_answer}
          onChange={e => onChange({ ...q, correct_answer: e.target.value })}
          placeholder="Correct answer"
          style={{ flex: 1, padding: "6px 10px", background: "var(--success-soft)", border: "1px solid rgba(52,211,153,0.2)", borderRadius: "var(--radius-xs)", color: "var(--success)", fontSize: "12px" }}
        />
      </div>

      {q.explanation && (
        <p style={{ marginTop: "8px", fontSize: "11px", color: "var(--text-dim)", fontStyle: "italic" }}>
          {q.explanation}
        </p>
      )}
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
export default function FacultyQuizzes() {
  const [courses, setCourses] = useState([]);
  const [quizzes, setQuizzes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Create modal state
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState(emptyQuiz);
  const [manualQuestions, setManualQuestions] = useState([{ ...emptyQuestion }]);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");
  const [formSuccess, setFormSuccess] = useState("");

  // RAG flow state
  const [ragStep, setRagStep] = useState("idle"); // idle | uploading | generating | review
  const [ragFile, setRagFile] = useState(null);
  const [ragCount, setRagCount] = useState(5);
  const [ragMaterialId, setRagMaterialId] = useState("");
  const [ragCourseId, setRagCourseId] = useState("");
  const [ragTitle, setRagTitle] = useState("");
  const [ragQuestions, setRagQuestions] = useState([]);
  const [ragError, setRagError] = useState("");

  // Submissions modal
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

  // ── When course changes in RAG mode, just store courseId ──
  const handleRagCourseChange = (courseId) => {
    setForm(p => ({ ...p, courseId, mode: "RAG" }));
    setRagCourseId(courseId);
  };

  // ── Upload PDF + ingest + generate ──
  const handleRagGenerate = async () => {
    if (!ragFile) { setRagError("Select a PDF file first."); return; }
    if (!form.courseId) { setRagError("Select a course first."); return; }
    if (!form.title.trim()) { setRagError("Give the quiz a title first."); return; }
    setRagError("");
    setRagStep("uploading");
    try {
      const auth = JSON.parse(localStorage.getItem("academic-erp-auth") || "null");
      const formData = new FormData();
      formData.append("file", ragFile);
      formData.append("courseId", form.courseId);
      formData.append("title", form.title.trim());

      const ingestRes = await fetch("/api/rag/ingest", {
        method: "POST",
        headers: { Authorization: `Bearer ${auth?.accessToken}` },
        body: formData,
      });
      const ingestData = await ingestRes.json();
      if (!ingestRes.ok) throw new Error(ingestData.message || "Ingest failed.");

      setRagMaterialId(ingestData.materialId);
      setRagCourseId(form.courseId);
      setRagTitle(form.title.trim());
      setRagStep("generating");

      const auth2 = JSON.parse(localStorage.getItem("academic-erp-auth") || "null");
      const genFetch = await fetch("/api/rag/generate-questions", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${auth2?.accessToken}` },
        body: JSON.stringify({
          materialId: ingestData.materialId,
          courseId: form.courseId,
          title: form.title.trim(),
          count: ragCount,
        }),
      });
      const genData = await genFetch.json();
      if (!genFetch.ok) throw new Error(genData.message || "Generation failed.");

      const qs = genData.questions ?? [];
      if (qs.length === 0) throw new Error("No questions returned. Try a different PDF or count.");
      setRagQuestions(qs);
      setRagStep("review");
    } catch (err) {
      setRagError(err.message || "RAG generation failed.");
      setRagStep("idle");
    }
  };

  // ── Confirm RAG questions → create quiz ──
  const handleRagConfirm = async () => {
    if (!form.title.trim()) { setRagError("Give the quiz a title first."); return; }
    setSubmitting(true);
    setRagError("");
    try {
      const questions = ragQuestions.map(q => ({
        questionText: q.question_text,
        options: q.options ?? [],
        correctAnswer: q.correct_answer ?? "",
      }));
      // Store as IN_APP since questions are already generated
      await createQuiz({
        title: form.title,
        courseId: form.courseId,
        mode: "IN_APP",
        questions,
      });
      setFormSuccess("AI-generated quiz created.");
      resetCreate();
      reload();
    } catch (err) {
      setRagError(err.message || "Failed to create quiz.");
    } finally {
      setSubmitting(false);
    }
  };

  // ── Manual quiz create ──
  const handleCreate = async (e) => {
    e.preventDefault();
    setFormError("");
    setSubmitting(true);
    try {
      const payload = { ...form };
      if (form.mode === "IN_APP") {
        payload.questions = manualQuestions.map(q => ({
          questionText: q.questionText,
          options: q.options.filter(Boolean),
          correctAnswer: q.correctAnswer,
        }));
      }
      await createQuiz(payload);
      setFormSuccess("Quiz created.");
      resetCreate();
      reload();
    } catch (err) {
      setFormError(err.message || "Failed to create quiz.");
    } finally {
      setSubmitting(false);
    }
  };

  const resetCreate = () => {
    setShowCreate(false);
    setForm(emptyQuiz);
    setManualQuestions([{ ...emptyQuestion }]);
    setRagStep("idle");
    setRagFile(null);
    setRagMaterialId("");
    setRagCourseId("");
    setRagTitle("");
    setRagQuestions([]);
    setRagError("");
    setFormError("");
  };

  const handleVisibility = async (quiz) => {
    try { await setQuizVisibility(quiz._id, !quiz.isVisible); reload(); }
    catch (err) { alert(err.message); }
  };

  const handleExpire = async (quiz) => {
    if (!confirm(`Expire quiz "${quiz.title}"?`)) return;
    try { await expireQuiz(quiz._id); reload(); }
    catch (err) { alert(err.message); }
  };

  const handleViewSubs = async (quiz) => {
    setViewSubs(quiz);
    setSubsLoading(true);
    try { const res = await getQuizSubmissions(quiz._id); setSubs(res.submissions ?? []); }
    catch { setSubs([]); }
    finally { setSubsLoading(false); }
  };

  const exportToExcel = () => {
    if (!subs.length) return;
    const rows = [
      ["Student Name", "Enrollment No", "Score", "Total", "Percentage", "Submitted At"],
      ...subs.map(s => [
        s.studentId?.name ?? "—",
        s.studentId?.enrollmentNo ?? "—",
        s.score ?? 0,
        s.totalMarks ?? 0,
        `${s.percentage ?? 0}%`,
        new Date(s.submittedAt).toLocaleString("en-IN"),
      ]),
    ];
    const csv = rows.map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${viewSubs?.title ?? "quiz"}_results.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const quizStatus = (q) => {
    if (q.isExpired) return { label: "Expired", cls: "fc-badge--expired" };
    if (q.isVisible) return { label: "Visible", cls: "fc-badge--visible" };
    return { label: "Hidden", cls: "fc-badge--hidden" };
  };

  const isRagMode = form.mode === "RAG";

  return (
    <div className="fc-page">
      <Navbar />
      <main className="fc-container">
        <header className="fc-header">
          <div><h1>Quizzes</h1><p>Create and manage quizzes for your courses.</p></div>
          <div className="fc-header-actions">
            <button className="fc-btn fc-btn--primary" onClick={() => { setShowCreate(true); setFormError(""); }}>
              + New Quiz
            </button>
          </div>
        </header>

        {formSuccess && <p className="fc-success">{formSuccess}</p>}
        {loading && <p className="fc-muted">Loading quizzes...</p>}
        {!loading && error && <p className="fc-error">{error}</p>}

        {!loading && !error && (
          <div className="fc-card">
            <div className="fc-card-header">
              <h3>All Quizzes</h3>
              <span className="fc-chip">{quizzes.length} total</span>
            </div>
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

        {/* ── Create Quiz Modal ── */}
        {showCreate && (
          <div className="fc-modal-overlay" onClick={resetCreate}>
            <div className="fc-modal" style={{ maxWidth: "680px" }} onClick={e => e.stopPropagation()}>

              {/* Header */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
                <h2 style={{ margin: 0 }}>New Quiz</h2>
                {/* Mode toggle */}
                <div style={{ display: "flex", gap: "4px", padding: "4px", background: "var(--glass-light)", borderRadius: "var(--radius-sm)", border: "1px solid var(--glass-border)" }}>
                  {["EXTERNAL_LINK", "IN_APP", "RAG"].map(m => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => { setForm(p => ({ ...p, mode: m })); setRagStep(m === "RAG" ? "picking" : "idle"); setRagError(""); }}
                      style={{
                        padding: "6px 14px", borderRadius: "6px", fontSize: "11px", fontWeight: 700,
                        border: "none", cursor: "pointer", transition: "all 0.15s",
                        background: form.mode === m ? "var(--accent-indigo)" : "transparent",
                        color: form.mode === m ? "#fff" : "var(--text-muted)",
                        boxShadow: form.mode === m ? "0 0 12px rgba(99,102,241,0.3)" : "none",
                      }}
                    >
                      {m === "EXTERNAL_LINK" ? "Link" : m === "IN_APP" ? "Manual" : "✦ AI Generate"}
                    </button>
                  ))}
                </div>
              </div>

              {(formError || ragError) && <p className="fc-error">{formError || ragError}</p>}

              {/* ── RAG flow ── */}
              {isRagMode && (
                <div className="fc-form">
                  <label>Quiz Title
                    <input required value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} placeholder="e.g. Chapter 3 Assessment" />
                  </label>

                  <label>Course
                    <select required value={form.courseId} onChange={e => handleRagCourseChange(e.target.value)}>
                      <option value="">-- Select Course --</option>
                      {courses.map(c => <option key={c._id} value={c._id}>{c.name} ({c.code})</option>)}
                    </select>
                  </label>

                  {ragStep !== "review" && (
                    <>
                      <label>Upload PDF from your computer
                        <div
                          style={{
                            display: "inline-flex", alignItems: "center", gap: "10px",
                            padding: "10px 16px",
                            border: "1.5px dashed rgba(99,102,241,0.4)",
                            borderRadius: "var(--radius-sm)",
                            background: "var(--accent-indigo-soft)",
                            cursor: "pointer",
                            width: "fit-content",
                            transition: "border-color 0.15s, background 0.15s",
                          }}
                          onClick={() => document.getElementById("rag-pdf-input").click()}
                        >
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: "var(--accent-indigo)", flexShrink: 0 }}>
                            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                            <polyline points="14 2 14 8 20 8"/>
                            <line x1="12" y1="18" x2="12" y2="12"/>
                            <line x1="9" y1="15" x2="15" y2="15"/>
                          </svg>
                          <span style={{ color: "var(--accent-indigo)", fontWeight: 600, fontSize: "13px", whiteSpace: "nowrap" }}>
                            {ragFile ? ragFile.name : "Choose PDF"}
                          </span>
                          <input
                            id="rag-pdf-input"
                            type="file"
                            accept="application/pdf"
                            style={{ display: "none" }}
                            onChange={e => setRagFile(e.target.files?.[0] ?? null)}
                          />
                        </div>
                      </label>

                      <label>Number of Questions (1–20)
                        <input type="number" min={1} max={20} value={ragCount} onChange={e => setRagCount(Number(e.target.value))} />
                      </label>

                      <div style={{ padding: "12px 16px", background: "var(--accent-indigo-soft)", borderRadius: "var(--radius-sm)", border: "1px solid rgba(99,102,241,0.15)", fontSize: "12px", color: "var(--text-secondary)" }}>
                        ✦ Upload a PDF from your computer. The AI will read it and generate quiz questions. You can review and edit them before creating the quiz.
                      </div>

                      <div className="fc-form-actions">
                        <button type="button" className="fc-btn fc-btn--ghost" onClick={resetCreate}>Cancel</button>
                        <button
                          type="button"
                          className="fc-btn fc-btn--primary"
                          disabled={!ragFile || !form.courseId || !form.title.trim() || ragStep === "uploading" || ragStep === "generating"}
                          onClick={handleRagGenerate}
                        >
                          {ragStep === "uploading" ? "Uploading & Indexing..." : ragStep === "generating" ? "Generating Questions..." : "✦ Generate Questions"}
                        </button>
                      </div>
                    </>
                  )}

                  {/* ── Review step ── */}
                  {ragStep === "review" && (
                    <>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "4px" }}>
                        <strong style={{ color: "var(--text-primary)", fontSize: "14px" }}>
                          {ragQuestions.length} questions generated — review and edit before confirming
                        </strong>
                        <button
                          type="button"
                          className="fc-btn fc-btn--ghost"
                          style={{ padding: "5px 12px", fontSize: "11px" }}
                          onClick={() => { setRagStep("picking"); setRagQuestions([]); }}
                        >
                          ← Regenerate
                        </button>
                      </div>

                      <div style={{ maxHeight: "380px", overflowY: "auto", paddingRight: "4px" }}>
                        {ragQuestions.map((q, i) => (
                          <RAGQuestionCard
                            key={i}
                            q={q}
                            index={i}
                            onChange={updated => setRagQuestions(prev => prev.map((x, j) => j === i ? updated : x))}
                            onRemove={() => setRagQuestions(prev => prev.filter((_, j) => j !== i))}
                          />
                        ))}
                      </div>

                      {ragQuestions.length === 0 && (
                        <p style={{ color: "var(--danger)", fontSize: "13px" }}>All questions removed. Regenerate or go back.</p>
                      )}

                      <div className="fc-form-actions">
                        <button type="button" className="fc-btn fc-btn--ghost" onClick={resetCreate}>Cancel</button>
                        <button
                          type="button"
                          className="fc-btn fc-btn--primary"
                          disabled={submitting || ragQuestions.length === 0}
                          onClick={handleRagConfirm}
                        >
                          {submitting ? "Creating..." : `✓ Confirm & Create Quiz (${ragQuestions.length} questions)`}
                        </button>
                      </div>
                    </>
                  )}
                </div>
              )}

              {/* ── Manual / External flow ── */}
              {!isRagMode && (
                <form onSubmit={handleCreate} className="fc-form">
                  <label>Title<input required value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} /></label>
                  <label>Course
                    <select required value={form.courseId} onChange={e => setForm(p => ({ ...p, courseId: e.target.value }))}>
                      <option value="">-- Select Course --</option>
                      {courses.map(c => <option key={c._id} value={c._id}>{c.name} ({c.code})</option>)}
                    </select>
                  </label>

                  {form.mode === "EXTERNAL_LINK" && (
                    <label>External Quiz URL
                      <input required type="url" value={form.externalLink} onChange={e => setForm(p => ({ ...p, externalLink: e.target.value }))} placeholder="https://forms.google.com/..." />
                    </label>
                  )}

                  {form.mode === "IN_APP" && (
                    <div>
                      <strong style={{ fontSize: "13px", color: "var(--text-secondary)" }}>Questions</strong>
                      {manualQuestions.map((q, qi) => (
                        <div key={qi} style={{ marginTop: "12px", padding: "14px", background: "var(--glass-light)", borderRadius: "var(--radius-sm)", border: "1px solid var(--glass-border)" }}>
                          <input
                            placeholder={`Question ${qi + 1}`}
                            value={q.questionText}
                            onChange={e => setManualQuestions(prev => prev.map((x, i) => i === qi ? { ...x, questionText: e.target.value } : x))}
                            style={{ width: "100%", padding: "8px 12px", background: "var(--glass)", border: "1px solid var(--glass-border)", borderRadius: "var(--radius-xs)", color: "var(--text-primary)", marginBottom: "8px", fontSize: "13px", boxSizing: "border-box" }}
                          />
                          {q.options.map((opt, oi) => (
                            <input
                              key={oi}
                              placeholder={`Option ${oi + 1}`}
                              value={opt}
                              onChange={e => setManualQuestions(prev => prev.map((x, i) => i === qi ? { ...x, options: x.options.map((o, j) => j === oi ? e.target.value : o) } : x))}
                              style={{ width: "100%", padding: "7px 12px", background: "var(--glass)", border: "1px solid var(--glass-border)", borderRadius: "var(--radius-xs)", color: "var(--text-primary)", marginBottom: "6px", fontSize: "12px", boxSizing: "border-box" }}
                            />
                          ))}
                          <input
                            placeholder="Correct answer"
                            value={q.correctAnswer}
                            onChange={e => setManualQuestions(prev => prev.map((x, i) => i === qi ? { ...x, correctAnswer: e.target.value } : x))}
                            style={{ width: "100%", padding: "7px 12px", background: "var(--success-soft)", border: "1px solid rgba(52,211,153,0.2)", borderRadius: "var(--radius-xs)", color: "var(--success)", fontSize: "12px", boxSizing: "border-box" }}
                          />
                        </div>
                      ))}
                      <button
                        type="button"
                        className="fc-btn fc-btn--ghost"
                        style={{ marginTop: "10px", padding: "7px 14px", fontSize: "12px" }}
                        onClick={() => setManualQuestions(prev => [...prev, { ...emptyQuestion }])}
                      >
                        + Add Question
                      </button>
                    </div>
                  )}

                  <div className="fc-form-actions">
                    <button type="button" className="fc-btn fc-btn--ghost" onClick={resetCreate}>Cancel</button>
                    <button type="submit" className="fc-btn fc-btn--primary" disabled={submitting}>
                      {submitting ? "Creating..." : "Create Quiz"}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        )}

        {/* ── Submissions Modal ── */}
        {viewSubs && (
          <div className="fc-modal-overlay" onClick={() => setViewSubs(null)}>
            <div className="fc-modal" style={{ maxWidth: "780px" }} onClick={e => e.stopPropagation()}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
                <h2 style={{ margin: 0 }}>Submissions — {viewSubs.title}</h2>
                {subs.length > 0 && (
                  <button className="fc-btn fc-btn--ghost" style={{ padding: "7px 16px", fontSize: "12px" }} onClick={exportToExcel}>
                    ↓ Export CSV
                  </button>
                )}
              </div>
              {subsLoading && <p className="fc-muted">Loading...</p>}
              {!subsLoading && subs.length === 0 && <p className="fc-empty">No submissions yet.</p>}
              {!subsLoading && subs.length > 0 && (
                <div className="fc-table-shell">
                  <table className="fc-table">
                    <thead>
                      <tr>
                        <th>Student</th>
                        <th>Enrollment No</th>
                        <th>Score</th>
                        <th>%</th>
                        <th>Submitted</th>
                      </tr>
                    </thead>
                    <tbody>
                      {subs.map(s => (
                        <tr key={s._id}>
                          <td><strong>{s.studentId?.name ?? "—"}</strong></td>
                          <td>{s.studentId?.enrollmentNo ?? "—"}</td>
                          <td>
                            <span style={{
                              fontWeight: 700,
                              color: (s.percentage ?? 0) >= 70 ? "var(--success)" : (s.percentage ?? 0) >= 40 ? "var(--warning)" : "var(--danger)",
                            }}>
                              {s.score ?? 0} / {s.totalMarks ?? 0}
                            </span>
                          </td>
                          <td>
                            <span style={{
                              padding: "3px 10px", borderRadius: "var(--radius-full)", fontSize: "11px", fontWeight: 700,
                              background: (s.percentage ?? 0) >= 70 ? "var(--success-soft)" : (s.percentage ?? 0) >= 40 ? "var(--warning-soft)" : "var(--danger-soft)",
                              color: (s.percentage ?? 0) >= 70 ? "var(--success)" : (s.percentage ?? 0) >= 40 ? "var(--warning)" : "var(--danger)",
                            }}>
                              {s.percentage ?? 0}%
                            </span>
                          </td>
                          <td style={{ fontSize: "12px", color: "var(--text-muted)" }}>
                            {new Date(s.submittedAt).toLocaleDateString("en-IN")}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
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
