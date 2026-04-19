import { useEffect, useState } from "react";
import Navbar from "../components/Navbar.jsx";
import Footer from "../components/Footer.jsx";
import { getTimetables, deleteTimetable } from "../Services/api.js";
import "../Styles/ManageUsers.css";

export default function ManageTimetable() {
  const [timetables, setTimetables] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const [uploadSuccess, setUploadSuccess] = useState("");

  useEffect(() => { loadTimetables(); }, []);

  const loadTimetables = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await getTimetables();
      setTimetables(res.timetables ?? []);
    } catch (err) {
      setError(err.message || "Failed to load timetables.");
    } finally {
      setLoading(false);
    }
  };

  const handleUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.type !== "application/pdf") {
      setUploadError("Only PDF files are allowed.");
      return;
    }

    setUploading(true);
    setUploadError("");
    setUploadSuccess("");

    try {
      const formData = new FormData();
      formData.append("file", file);

      const auth = JSON.parse(localStorage.getItem("academic-erp-auth") || "null");
      const res = await fetch("/api/admin/timetable", {
        method: "POST",
        headers: { Authorization: `Bearer ${auth?.accessToken}` },
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Upload failed.");
      setUploadSuccess("Timetable uploaded successfully.");
      loadTimetables();
    } catch (err) {
      setUploadError(err.message || "Upload failed.");
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  const handleDelete = async (id, name) => {
    if (!confirm(`Delete timetable "${name}"?`)) return;
    try {
      await deleteTimetable(id);
      setTimetables(prev => prev.filter(t => t._id !== id));
    } catch (err) {
      alert(err.message || "Failed to delete.");
    }
  };

  return (
    <div className="mu-page">
      <Navbar />
      <main className="mu-container">
        <header className="mu-header">
          <div>
            <h1>Timetable PDFs</h1>
            <p>Upload and manage timetable PDF files for students.</p>
          </div>
          <div className="mu-header-actions">
            <label className="mu-btn mu-btn--primary" style={{ cursor: "pointer" }}>
              {uploading ? "Uploading..." : "Upload PDF"}
              <input type="file" accept="application/pdf" style={{ display: "none" }} onChange={handleUpload} disabled={uploading} />
            </label>
          </div>
        </header>

        {uploadSuccess && <p className="mu-success">{uploadSuccess}</p>}
        {uploadError && <p className="mu-error">{uploadError}</p>}
        {loading && <p className="mu-muted">Loading timetables...</p>}
        {!loading && error && <p className="mu-error">{error}</p>}

        {!loading && !error && (
          <div className="mu-table-shell">
            {timetables.length === 0 ? (
              <p className="mu-empty">No timetables uploaded yet.</p>
            ) : (
              <table className="mu-table">
                <thead>
                  <tr>
                    <th>File Name</th>
                    <th>Uploaded At</th>
                    <th>View</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {timetables.map(t => (
                    <tr key={t._id}>
                      <td><strong>{t.originalName}</strong></td>
                      <td>{new Date(t.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</td>
                      <td>
                        <a href={t.cloudinaryUrl} target="_blank" rel="noreferrer" className="mu-btn mu-btn--ghost" style={{ padding: "6px 14px", fontSize: "0.82rem" }}>
                          Open PDF
                        </a>
                      </td>
                      <td>
                        <button className="mu-remove-btn" onClick={() => handleDelete(t._id, t.originalName)}>Delete</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}
