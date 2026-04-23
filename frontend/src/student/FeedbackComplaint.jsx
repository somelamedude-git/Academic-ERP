import { useEffect, useState } from "react";
import Navbar from "../components/Navbar.jsx";
import Footer from "../components/Footer.jsx";
import { getStudentFaculty, submitFeedback, submitComplaint } from "../Services/api.js";

const inputStyle = {
  width: "100%",
  padding: "10px 14px",
  background: "var(--glass)",
  border: "1px solid var(--glass-border)",
  borderRadius: "var(--radius-sm)",
  color: "var(--text-primary)",
  fontSize: "13px",
  outline: "none",
  fontFamily: "inherit",
  boxSizing: "border-box",
  transition: "border-color var(--duration-normal)",
};

const labelStyle = {
  display: "flex",
  flexDirection: "column",
  gap: "6px",
  fontSize: "11px",
  fontWeight: 700,
  textTransform: "uppercase",
  letterSpacing: "0.06em",
  color: "var(--text-muted)",
};

export default function FeedbackComplaint() {
  const [tab, setTab] = useState("feedback");
  const [faculty, setFaculty] = useState([]);

  const [feedbackForm, setFeedbackForm] = useState({ targetId: "", message: "", rating: 7 });
  const [complaintForm, setComplaintForm] = useState({ assignedTo: "", description: "" });

  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    getStudentFaculty()
      .then(res => setFaculty(res.faculty ?? []))
      .catch(() => {});
  }, []);

  const handleFeedback = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError("");
    setSuccess("");
    try {
      await submitFeedback(feedbackForm.targetId, feedbackForm.message, Number(feedbackForm.rating));
      setSuccess("Feedback submitted successfully.");
      setFeedbackForm({ targetId: "", message: "", rating: 7 });
    } catch (err) {
      setError(err.message || "Failed to submit feedback.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleComplaint = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError("");
    setSuccess("");
    try {
      await submitComplaint(complaintForm.description, complaintForm.assignedTo);
      setSuccess("Complaint submitted successfully.");
      setComplaintForm({ assignedTo: "", description: "" });
    } catch (err) {
      setError(err.message || "Failed to submit complaint.");
    } finally {
      setSubmitting(false);
    }
  };

  const ratingLabels = ["", "Terrible", "Bad", "Poor", "Below Avg", "Average", "Decent", "Good", "Very Good", "Excellent", "Outstanding"];

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", background: "var(--bg-deep)" }}>
      <Navbar />
      <main style={{ flex: 1, maxWidth: "680px", margin: "0 auto", padding: "40px 24px 64px", width: "100%" }}>

        {/* Header */}
        <div style={{ marginBottom: "32px" }}>
          <p style={{ fontSize: "11px", fontWeight: 700, color: "var(--accent-cyan)", textTransform: "uppercase", letterSpacing: "1.5px", marginBottom: "8px" }}>
            Student Portal
          </p>
          <h1 style={{ fontSize: "28px", fontWeight: 700, background: "linear-gradient(135deg, var(--text-primary), var(--accent-violet))", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>
            Feedback & Complaints
          </h1>
          <p style={{ fontSize: "14px", color: "var(--text-muted)", marginTop: "6px" }}>
            Share feedback with your faculty or raise a formal complaint.
          </p>
        </div>

        {/* Tabs */}
        <div style={{ display: "flex", gap: "4px", padding: "4px", background: "var(--glass)", border: "1px solid var(--glass-border)", borderRadius: "var(--radius-sm)", marginBottom: "28px", width: "fit-content" }}>
          {["feedback", "complaint"].map(t => (
            <button
              key={t}
              type="button"
              onClick={() => { setTab(t); setSuccess(""); setError(""); }}
              style={{
                padding: "8px 20px", borderRadius: "6px", fontSize: "13px", fontWeight: 600,
                border: "none", cursor: "pointer", transition: "all 0.15s",
                background: tab === t ? "var(--accent-indigo)" : "transparent",
                color: tab === t ? "#fff" : "var(--text-muted)",
                boxShadow: tab === t ? "0 0 12px rgba(99,102,241,0.3)" : "none",
                textTransform: "capitalize",
              }}
            >
              {t === "feedback" ? "Give Feedback" : "Raise Complaint"}
            </button>
          ))}
        </div>

        {/* Alerts */}
        {success && (
          <div style={{ padding: "12px 16px", background: "var(--success-soft)", border: "1px solid rgba(52,211,153,0.2)", borderRadius: "var(--radius-sm)", color: "var(--success)", fontSize: "13px", marginBottom: "20px", display: "flex", alignItems: "center", gap: "8px" }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
            {success}
          </div>
        )}
        {error && (
          <div style={{ padding: "12px 16px", background: "var(--danger-soft)", border: "1px solid rgba(248,113,113,0.2)", borderRadius: "var(--radius-sm)", color: "var(--danger)", fontSize: "13px", marginBottom: "20px" }}>
            {error}
          </div>
        )}

        {/* Feedback Form */}
        {tab === "feedback" && (
          <div style={{ background: "var(--glass)", backdropFilter: "blur(14px)", border: "1px solid var(--glass-border)", borderRadius: "var(--radius-lg)", padding: "28px" }}>
            <h2 style={{ fontSize: "16px", fontWeight: 700, color: "var(--text-primary)", marginBottom: "24px" }}>Faculty Feedback</h2>
            <form onSubmit={handleFeedback} style={{ display: "flex", flexDirection: "column", gap: "20px" }}>

              <label style={labelStyle}>Select Faculty
                <select
                  required
                  value={feedbackForm.targetId}
                  onChange={e => setFeedbackForm(p => ({ ...p, targetId: e.target.value }))}
                  style={inputStyle}
                >
                  <option value="">-- Choose a faculty member --</option>
                  {faculty.length === 0 ? (
                    <option disabled>No faculty found for your courses</option>
                  ) : (
                    faculty.map(f => (
                      <option key={f._id} value={f._id}>
                        {f.name} — {f.designation ?? f.department_name}
                      </option>
                    ))
                  )}
                </select>
              </label>

              <label style={labelStyle}>Your Message
                <textarea
                  required
                  rows={4}
                  value={feedbackForm.message}
                  onChange={e => setFeedbackForm(p => ({ ...p, message: e.target.value }))}
                  placeholder="Share your experience, suggestions, or appreciation..."
                  style={{ ...inputStyle, resize: "vertical", minHeight: "100px" }}
                  onFocus={e => e.target.style.borderColor = "var(--accent-indigo)"}
                  onBlur={e => e.target.style.borderColor = "var(--glass-border)"}
                />
              </label>

              <label style={labelStyle}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span>Rating</span>
                  <span style={{
                    fontSize: "13px", fontWeight: 700, textTransform: "none", letterSpacing: 0,
                    color: feedbackForm.rating >= 8 ? "var(--success)" : feedbackForm.rating >= 5 ? "var(--warning)" : "var(--danger)",
                  }}>
                    {feedbackForm.rating}/10 — {ratingLabels[feedbackForm.rating]}
                  </span>
                </div>
                <div style={{ position: "relative", paddingTop: "8px" }}>
                  <input
                    type="range"
                    min={0}
                    max={10}
                    value={feedbackForm.rating}
                    onChange={e => setFeedbackForm(p => ({ ...p, rating: Number(e.target.value) }))}
                    style={{ width: "100%", accentColor: "var(--accent-indigo)", cursor: "pointer" }}
                  />
                  <div style={{ display: "flex", justifyContent: "space-between", marginTop: "4px" }}>
                    {[0, 2, 4, 6, 8, 10].map(n => (
                      <span key={n} style={{ fontSize: "10px", color: "var(--text-dim)" }}>{n}</span>
                    ))}
                  </div>
                </div>
              </label>

              <button
                type="submit"
                disabled={submitting}
                style={{
                  padding: "12px 28px", background: "var(--accent-indigo)", color: "#fff",
                  border: "none", borderRadius: "var(--radius-sm)", fontWeight: 700,
                  fontSize: "13px", cursor: "pointer", alignSelf: "flex-end",
                  boxShadow: "0 0 20px rgba(99,102,241,0.25)", transition: "all 0.15s",
                  opacity: submitting ? 0.6 : 1,
                }}
              >
                {submitting ? "Submitting..." : "Submit Feedback"}
              </button>
            </form>
          </div>
        )}

        {/* Complaint Form */}
        {tab === "complaint" && (
          <div style={{ background: "var(--glass)", backdropFilter: "blur(14px)", border: "1px solid var(--glass-border)", borderRadius: "var(--radius-lg)", padding: "28px" }}>
            <h2 style={{ fontSize: "16px", fontWeight: 700, color: "var(--text-primary)", marginBottom: "8px" }}>Raise a Complaint</h2>
            <p style={{ fontSize: "13px", color: "var(--text-muted)", marginBottom: "24px" }}>
              Complaints are forwarded to the assigned staff member for review.
            </p>
            <form onSubmit={handleComplaint} style={{ display: "flex", flexDirection: "column", gap: "20px" }}>

              <label style={labelStyle}>Assign To (staff email)
                <input
                  required
                  type="email"
                  value={complaintForm.assignedTo}
                  onChange={e => setComplaintForm(p => ({ ...p, assignedTo: e.target.value }))}
                  placeholder="e.g. faculty@iiitg.ac.in"
                  style={inputStyle}
                  onFocus={e => e.target.style.borderColor = "var(--accent-indigo)"}
                  onBlur={e => e.target.style.borderColor = "var(--glass-border)"}
                />
              </label>

              <label style={labelStyle}>Description
                <textarea
                  required
                  rows={6}
                  value={complaintForm.description}
                  onChange={e => setComplaintForm(p => ({ ...p, description: e.target.value }))}
                  placeholder="Describe your complaint clearly and concisely..."
                  style={{ ...inputStyle, resize: "vertical", minHeight: "140px" }}
                  onFocus={e => e.target.style.borderColor = "var(--accent-indigo)"}
                  onBlur={e => e.target.style.borderColor = "var(--glass-border)"}
                />
              </label>

              <div style={{ padding: "12px 16px", background: "var(--warning-soft)", border: "1px solid rgba(251,191,36,0.2)", borderRadius: "var(--radius-sm)", fontSize: "12px", color: "var(--warning)" }}>
                ⚠ Please ensure your complaint is factual and respectful. False complaints may result in disciplinary action.
              </div>

              <button
                type="submit"
                disabled={submitting}
                style={{
                  padding: "12px 28px", background: "var(--accent-indigo)", color: "#fff",
                  border: "none", borderRadius: "var(--radius-sm)", fontWeight: 700,
                  fontSize: "13px", cursor: "pointer", alignSelf: "flex-end",
                  boxShadow: "0 0 20px rgba(99,102,241,0.25)", transition: "all 0.15s",
                  opacity: submitting ? 0.6 : 1,
                }}
              >
                {submitting ? "Submitting..." : "Submit Complaint"}
              </button>
            </form>
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}
