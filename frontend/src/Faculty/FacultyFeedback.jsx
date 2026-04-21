import { useState } from "react";
import Navbar from "../components/Navbar.jsx";
import Footer from "../components/Footer.jsx";
import { getMyFeedback } from "../Services/api.js";
import "../Styles/Faculty.css";

export default function FacultyFeedback() {
  const [feedbacks, setFeedbacks] = useState([]);
  const [remaining, setRemaining] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [loaded, setLoaded] = useState(false);
  const [queueEmpty, setQueueEmpty] = useState(false);

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await getMyFeedback(5);
      const newItems = res.feedbacks ?? [];
      setFeedbacks(prev => [...prev, ...newItems]);
      setRemaining(res.remaining ?? 0);
      setLoaded(true);
      if (newItems.length === 0) setQueueEmpty(true);
    } catch (err) {
      setError(err.message || "Failed to load feedback.");
    } finally {
      setLoading(false);
    }
  };

  const ratingColor = (r) => {
    if (r >= 8) return "#166534";
    if (r >= 5) return "#b45309";
    return "#b91c1c";
  };

  const ratingLabel = (r) => {
    if (r >= 8) return "Excellent";
    if (r >= 6) return "Good";
    if (r >= 4) return "Average";
    return "Poor";
  };

  return (
    <div className="fc-page">
      <Navbar />
      <main className="fc-container">
        <header className="fc-header">
          <div>
            <h1>Student Feedback</h1>
            <p>Feedback is consumed from the queue — each load pops the latest 5 entries.</p>
          </div>
          <div className="fc-header-actions">
            {remaining > 0 && (
              <span className="fc-chip fc-chip--alert">{remaining} more in queue</span>
            )}
            <button
              className="fc-btn fc-btn--primary"
              onClick={load}
              disabled={loading || (loaded && remaining === 0 && feedbacks.length > 0)}
            >
              {loading ? "Loading..." : !loaded ? "Load Feedback" : remaining > 0 ? "Load More" : "Queue Empty"}
            </button>
          </div>
        </header>

        {error && <p className="fc-error">{error}</p>}

        {loaded && feedbacks.length === 0 && (
          <p className="fc-empty">No feedback in your queue.</p>
        )}

        {feedbacks.length > 0 && (
          <div className="fc-card">
            <div className="fc-card-header">
              <h3>Feedback ({feedbacks.length} loaded)</h3>
              {remaining > 0 && (
                <span className="fc-chip fc-chip--alert">{remaining} more</span>
              )}
            </div>
            <ul className="fc-list">
              {feedbacks.map((f, i) => (
                <li key={i} className="fc-list-item" style={{ flexDirection: "column", alignItems: "flex-start", gap: "10px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", width: "100%", alignItems: "flex-start" }}>
                    <p style={{ margin: 0, color: "#17324d", lineHeight: 1.6, flex: 1, paddingRight: "16px" }}>{f.message}</p>
                    <div style={{ textAlign: "right", flexShrink: 0 }}>
                      <span style={{
                        display: "block", fontWeight: 700, fontSize: "1.3rem",
                        color: ratingColor(f.rating)
                      }}>
                        {f.rating}/10
                      </span>
                      <span style={{ fontSize: "0.75rem", color: ratingColor(f.rating), fontWeight: 600 }}>
                        {ratingLabel(f.rating)}
                      </span>
                    </div>
                  </div>
                  <p style={{ margin: 0, fontSize: "0.8rem", color: "#6b7280" }}>
                    {new Date(f.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                  </p>
                </li>
              ))}
            </ul>
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}
