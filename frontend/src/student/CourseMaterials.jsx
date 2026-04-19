import { useEffect, useState } from "react";
import Navbar from "../components/Navbar.jsx";
import Footer from "../components/Footer.jsx";
import { getStudentCourses, getMaterials } from "../Services/api.js";
import "../Styles/StudentDashboard.css";

const typeLabel = { PDF: "PDF", PPT: "PPT", DRIVE_LINK: "Link" };
const typeBg = { PDF: "#fee2e2", PPT: "#fff1d6", DRIVE_LINK: "#dbeafe" };
const typeColor = { PDF: "#b91c1c", PPT: "#b45309", DRIVE_LINK: "#1d4ed8" };

export default function CourseMaterials() {
  const [courses, setCourses] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState("");
  const [materials, setMaterials] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

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
    getMaterials(selectedCourse)
      .then(res => setMaterials(res.materials ?? []))
      .catch(err => setError(err.message || "Failed to load materials."))
      .finally(() => setLoading(false));
  }, [selectedCourse]);

  return (
    <div className="sd-page">
      <Navbar />
      <main className="sd-container">
        <header className="sd-topbar">
          <div>
            <h1>Course Materials</h1>
            <p>PDFs, slides, and links shared by your faculty.</p>
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

        {loading && <p className="sd-muted" style={{ padding: "2rem" }}>Loading materials...</p>}
        {!loading && error && <p className="sd-error" style={{ padding: "2rem" }}>{error}</p>}
        {!loading && !error && materials.length === 0 && (
          <p className="sd-muted" style={{ padding: "2rem" }}>No materials uploaded for this course yet.</p>
        )}

        {!loading && !error && materials.length > 0 && (
          <div className="sd-card" style={{ marginTop: "8px" }}>
            <ul className="sd-list">
              {materials.map(m => (
                <li key={m._id} className="sd-list-item">
                  <div>
                    <strong>{m.title}</strong>
                    <p style={{ margin: "4px 0 0", fontSize: "0.85rem", color: "#6b7280" }}>
                      {new Date(m.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                    </p>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    <span style={{ padding: "4px 10px", borderRadius: "999px", fontSize: "0.76rem", fontWeight: 700, background: typeBg[m.type], color: typeColor[m.type] }}>
                      {typeLabel[m.type] ?? m.type}
                    </span>
                    <a
                      href={m.cloudinaryUrl || m.externalUrl}
                      target="_blank"
                      rel="noreferrer"
                      style={{ padding: "7px 14px", borderRadius: "999px", border: "1px solid #dbe7e4", background: "#fff", color: "#17324d", fontWeight: 700, fontSize: "0.82rem", textDecoration: "none" }}
                    >
                      Open
                    </a>
                  </div>
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
