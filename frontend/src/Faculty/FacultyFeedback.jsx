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

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await getMyFeedback(5);
      setFeedbacks(prev => [...prev, ...(res.feedbacks ?? [])]);
      setRemaining(res.remaining ?? 0);
      setLoaded(true);
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

  return (
    <div className="fc-page">
      <Navbar />
      <main className="fc-container">
        <header className="fc-header">
          <div>
            <h1>Student Feedback</h1>
            <p>Read feedback submitted by your students. Each load pops the latest 5.</p>
          </div>
          <div className="fc-header-actions">
            <button className="fc-btn fc-btn--primary" onClick={load} disabled={loading}>
              {loading ? "Loading..." : loaded ? "Load More" : "Load Feedback"}
            </button>
          </div>
        </header>

        {error && <p className="fc-error">{error}</p>}

        {loaded && feedbacks.length === 0 && <p className="fc-empty">No feedback in your queue.</p>}

        {feedbacks.length > 0 && (
          <div className="fc-card">
            <div className="fc-card-header">
              <h3>Feedback</h3>
              {remaining > 0 && <span className="fc-chip fc-chip--alert">{remaining} more in queue</span>}
            </div>
            <ul className="fc-list">
              {feedbacks.map((f, i) => (
                <li key={i} className="fc-list-item" style={{ flexDirection: "column", alignItems: "flex-start", gap: "8px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", width: "100%" }}>
                    <strong style={{ color: "var(--fc-secondary)" }}>{f.message}</strong>
                    <span style={{ fontWeight: 700, fontSize: "1.1rem", color: ratingColor(f.rating) }}>{f.rating}/10</span>
                  </div>
                  <p style={{ margin: 0 }}>{new Date(f.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</p>
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
