import { useEffect, useState } from "react";
import Navbar from "../components/Navbar.jsx";
import Footer from "../components/Footer.jsx";
import { listFaculty, submitFeedback, submitComplaint } from "../Services/api.js";
import "../Styles/StudentDashboard.css";

export default function FeedbackComplaint() {
  const [tab, setTab] = useState("feedback");
  const [faculty, setFaculty] = useState([]);

  const [feedbackForm, setFeedbackForm] = useState({ targetId: "", message: "", rating: 7 });
  const [complaintForm, setComplaintForm] = useState({ assignedTo: "", description: "" });

  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    listFaculty()
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

  const tabStyle = (t) => ({
    padding: "10px 20px", border: "none", background: "transparent",
    fontWeight: 600, fontSize: "0.92rem", cursor: "pointer",
    color: tab === t ? "#0f5f56" : "#6b7280",
    borderBottom: tab === t ? "2px solid #0f5f56" : "2px solid transparent",
    marginBottom: "-2px",
  });

  const inputStyle = {
    padding: "10px 14px", border: "1px solid #dbe7e4", borderRadius: "10px",
    fontSize: "0.9rem", outline: "none", width: "100%", boxSizing: "border-box", fontFamily: "inherit",
  };

  const labelStyle = {
    display: "flex", flexDirection: "column", gap: "6px",
    fontSize: "0.85rem", fontWeight: 600, color: "#17324d",
  };

  return (
    <div className="sd-page">
      <Navbar />
      <main className="sd-container">
        <header className="sd-topbar">
          <div>
            <h1>Feedback & Complaints</h1>
            <p>Share feedback with faculty or raise a complaint.</p>
          </div>
        </header>

        <div style={{ display: "flex", gap: "4px", borderBottom: "2px solid #dbe7e4", marginBottom: "24px" }}>
          <button style={tabStyle("feedback")} onClick={() => { setTab("feedback"); setSuccess(""); setError(""); }}>Feedback</button>
          <button style={tabStyle("complaint")} onClick={() => { setTab("complaint"); setSuccess(""); setError(""); }}>Complaint</button>
        </div>

        {success && <p style={{ color: "#166534", background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: "10px", padding: "10px 16px", marginBottom: "16px" }}>{success}</p>}
        {error && <p style={{ color: "#b91c1c", background: "#fff5f5", border: "1px solid #fecaca", borderRadius: "10px", padding: "10px 16px", marginBottom: "16px" }}>{error}</p>}

        {tab === "feedback" && (
          <div className="sd-card" style={{ maxWidth: "580px" }}>
            <h3 style={{ margin: "0 0 20px", color: "#17324d" }}>Submit Feedback</h3>
            <form onSubmit={handleFeedback} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              <label style={labelStyle}>Faculty
                <select required value={feedbackForm.targetId} onChange={e => setFeedbackForm(p => ({ ...p, targetId: e.target.value }))} style={inputStyle}>
                  <option value="">-- Select Faculty --</option>
                  {faculty.map(f => <option key={f._id} value={f._id}>{f.name} ({f.department_name})</option>)}
                </select>
              </label>
              <label style={labelStyle}>Message
                <textarea required rows={4} value={feedbackForm.message} onChange={e => setFeedbackForm(p => ({ ...p, message: e.target.value }))} style={{ ...inputStyle, resize: "vertical" }} placeholder="Share your feedback..." />
              </label>
              <label style={labelStyle}>
                Rating: <strong style={{ color: "#0f5f56" }}>{feedbackForm.rating}/10</strong>
                <input type="range" min={0} max={10} value={feedbackForm.rating} onChange={e => setFeedbackForm(p => ({ ...p, rating: e.target.value }))} style={{ accentColor: "#0f5f56" }} />
              </label>
              <button type="submit" disabled={submitting} style={{ padding: "11px 24px", background: "linear-gradient(135deg,#0f5f56,#1f8a70)", color: "#fff", border: "none", borderRadius: "999px", fontWeight: 700, cursor: "pointer", alignSelf: "flex-end" }}>
                {submitting ? "Submitting..." : "Submit Feedback"}
              </button>
            </form>
          </div>
        )}

        {tab === "complaint" && (
          <div className="sd-card" style={{ maxWidth: "580px" }}>
            <h3 style={{ margin: "0 0 20px", color: "#17324d" }}>Raise a Complaint</h3>
            <form onSubmit={handleComplaint} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              <label style={labelStyle}>Assign To (email of faculty or admin)
                <input required type="email" value={complaintForm.assignedTo} onChange={e => setComplaintForm(p => ({ ...p, assignedTo: e.target.value }))} style={inputStyle} placeholder="e.g. faculty@iiitg.ac.in" />
              </label>
              <label style={labelStyle}>Description
                <textarea required rows={5} value={complaintForm.description} onChange={e => setComplaintForm(p => ({ ...p, description: e.target.value }))} style={{ ...inputStyle, resize: "vertical" }} placeholder="Describe your complaint..." />
              </label>
              <button type="submit" disabled={submitting} style={{ padding: "11px 24px", background: "linear-gradient(135deg,#0f5f56,#1f8a70)", color: "#fff", border: "none", borderRadius: "999px", fontWeight: 700, cursor: "pointer", alignSelf: "flex-end" }}>
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
