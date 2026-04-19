import { useEffect, useState } from "react";
import Navbar from "../components/Navbar.jsx";
import Footer from "../components/Footer.jsx";
import { getMyCourses, getMaterials, addExternalLink, deleteMaterial } from "../Services/api.js";
import "../Styles/Faculty.css";

export default function FacultyMaterials() {
  const [courses, setCourses] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState("");
  const [materials, setMaterials] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [showUpload, setShowUpload] = useState(false);
  const [showLink, setShowLink] = useState(false);
  const [linkForm, setLinkForm] = useState({ title: "", externalUrl: "" });
  const [uploading, setUploading] = useState(false);
  const [uploadTitle, setUploadTitle] = useState("");
  const [formError, setFormError] = useState("");
  const [formSuccess, setFormSuccess] = useState("");

  useEffect(() => {
    getMyCourses()
      .then(res => {
        const list = res.courses ?? [];
        setCourses(list);
        if (list.length > 0) setSelectedCourse(list[0]._id);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!selectedCourse) return;
    loadMaterials();
  }, [selectedCourse]);

  const loadMaterials = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await getMaterials(selectedCourse);
      setMaterials(res.materials ?? []);
    } catch (err) {
      setError(err.message || "Failed to load materials.");
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file || !uploadTitle.trim()) { setFormError("Title is required before uploading."); return; }
    setUploading(true);
    setFormError("");
    try {
      const auth = JSON.parse(localStorage.getItem("academic-erp-auth") || "null");
      const formData = new FormData();
      formData.append("file", file);
      formData.append("courseId", selectedCourse);
      formData.append("title", uploadTitle.trim());
      const res = await fetch("/api/faculty/materials/upload", {
        method: "POST",
        headers: { Authorization: `Bearer ${auth?.accessToken}` },
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Upload failed.");
      setFormSuccess("Material uploaded.");
      setUploadTitle("");
      setShowUpload(false);
      loadMaterials();
    } catch (err) {
      setFormError(err.message || "Upload failed.");
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  const handleAddLink = async (e) => {
    e.preventDefault();
    setFormError("");
    try {
      await addExternalLink(selectedCourse, linkForm.title, linkForm.externalUrl);
      setFormSuccess("Link added.");
      setLinkForm({ title: "", externalUrl: "" });
      setShowLink(false);
      loadMaterials();
    } catch (err) {
      setFormError(err.message || "Failed to add link.");
    }
  };

  const handleDelete = async (id, title) => {
    if (!confirm(`Delete "${title}"?`)) return;
    try {
      await deleteMaterial(id);
      setMaterials(prev => prev.filter(m => m._id !== id));
    } catch (err) {
      alert(err.message || "Failed to delete.");
    }
  };

  const typeClass = { PDF: "fc-badge--pdf", PPT: "fc-badge--ppt", DRIVE_LINK: "fc-badge--link" };

  return (
    <div className="fc-page">
      <Navbar />
      <main className="fc-container">
        <header className="fc-header">
          <div>
            <h1>Course Materials</h1>
            <p>Upload PDFs, PPTs, or add Drive links for your courses.</p>
          </div>
          <div className="fc-header-actions">
            <select className="fc-select" value={selectedCourse} onChange={e => setSelectedCourse(e.target.value)}>
              {courses.map(c => <option key={c._id} value={c._id}>{c.name} ({c.code})</option>)}
            </select>
            <button className="fc-btn fc-btn--ghost" onClick={() => { setShowLink(true); setFormError(""); }}>+ Add Link</button>
            <button className="fc-btn fc-btn--primary" onClick={() => { setShowUpload(true); setFormError(""); }}>Upload File</button>
          </div>
        </header>

        {formSuccess && <p className="fc-success">{formSuccess}</p>}
        {loading && <p className="fc-muted">Loading materials...</p>}
        {!loading && error && <p className="fc-error">{error}</p>}

        {!loading && !error && (
          <div className="fc-card">
            <div className="fc-card-header">
              <h3>Materials</h3>
              <span className="fc-chip">{materials.length} files</span>
            </div>
            {materials.length === 0 ? <p className="fc-empty">No materials uploaded yet.</p> : (
              <ul className="fc-list">
                {materials.map(m => (
                  <li key={m._id} className="fc-list-item">
                    <div>
                      <strong>{m.title}</strong>
                      <p>{new Date(m.createdAt).toLocaleDateString("en-IN")}</p>
                    </div>
                    <div className="fc-list-actions">
                      <span className={`fc-badge ${typeClass[m.type] ?? ""}`}>{m.type}</span>
                      <a href={m.cloudinaryUrl || m.externalUrl} target="_blank" rel="noreferrer" className="fc-btn fc-btn--ghost" style={{ padding: "6px 12px", fontSize: "0.82rem" }}>Open</a>
                      <button className="fc-btn fc-btn--danger" style={{ padding: "6px 12px", fontSize: "0.82rem" }} onClick={() => handleDelete(m._id, m.title)}>Delete</button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        {/* Upload Modal */}
        {showUpload && (
          <div className="fc-modal-overlay" onClick={() => setShowUpload(false)}>
            <div className="fc-modal" onClick={e => e.stopPropagation()}>
              <h2>Upload Material</h2>
              {formError && <p className="fc-error">{formError}</p>}
              <div className="fc-form">
                <label>Title (required before selecting file)
                  <input value={uploadTitle} onChange={e => setUploadTitle(e.target.value)} placeholder="e.g. Week 3 Lecture Notes" />
                </label>
                <label className="fc-btn fc-btn--primary" style={{ cursor: "pointer", justifyContent: "center" }}>
                  {uploading ? "Uploading..." : "Choose PDF or PPT"}
                  <input type="file" accept=".pdf,.ppt,.pptx" style={{ display: "none" }} onChange={handleFileUpload} disabled={uploading} />
                </label>
                <div className="fc-form-actions">
                  <button type="button" className="fc-btn fc-btn--ghost" onClick={() => setShowUpload(false)}>Cancel</button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Add Link Modal */}
        {showLink && (
          <div className="fc-modal-overlay" onClick={() => setShowLink(false)}>
            <div className="fc-modal" onClick={e => e.stopPropagation()}>
              <h2>Add Drive Link</h2>
              {formError && <p className="fc-error">{formError}</p>}
              <form onSubmit={handleAddLink} className="fc-form">
                <label>Title<input required value={linkForm.title} onChange={e => setLinkForm(p => ({ ...p, title: e.target.value }))} /></label>
                <label>URL<input required type="url" value={linkForm.externalUrl} onChange={e => setLinkForm(p => ({ ...p, externalUrl: e.target.value }))} placeholder="https://drive.google.com/..." /></label>
                <div className="fc-form-actions">
                  <button type="button" className="fc-btn fc-btn--ghost" onClick={() => setShowLink(false)}>Cancel</button>
                  <button type="submit" className="fc-btn fc-btn--primary">Add Link</button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}
