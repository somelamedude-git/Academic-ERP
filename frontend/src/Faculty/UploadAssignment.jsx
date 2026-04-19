import { useState } from "react";
import Navbar from "../components/Navbar.jsx";
import Footer from "../components/Footer.jsx";
import "../Styles/UploadAssignment.css";

const courses = ["Database Management Systems", "Operating Systems", "Compiler Design", "ADA"];

const UploadAssignment = () => {
  const [course, setCourse] = useState(courses[0]);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [gradingFunction, setGradingFunction] = useState("Percentage-based");
  const [customGrading, setCustomGrading] = useState("");
  const [file, setFile] = useState(null);
  const [status, setStatus] = useState("idle");

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setStatus("uploading");
    
    // Mock upload delay
    setTimeout(() => {
      setStatus("success");
      setCourse(courses[0]);
      setTitle("");
      setDescription("");
      setDueDate("");
      setGradingFunction("Percentage-based");
      setCustomGrading("");
      setFile(null);
      
      setTimeout(() => setStatus("idle"), 3000);
    }, 1500);
  };

  return (
    <div className="ua-page">
      <Navbar />
      <main className="ua-container">
        <header className="ua-header">
          <h1>Upload Assignment</h1>
          <p>Distribute materials and set deadlines for your students across active courses.</p>
        </header>

        <section className="ua-content">
          <form className="ua-form" onSubmit={handleSubmit}>
            <div className="ua-form-grid">
              <div className="ua-field">
                <label htmlFor="course">Select Course</label>
                <select 
                  id="course" 
                  value={course} 
                  onChange={(e) => setCourse(e.target.value)}
                  required
                >
                  {courses.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>

              <div className="ua-field">
                <label htmlFor="title">Assignment Title</label>
                <input 
                  id="title" 
                  type="text" 
                  placeholder="e.g., Week 1: ER Diagrams" 
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                />
              </div>

              <div className="ua-field ua-field--full">
                <label htmlFor="description">Instructions (Optional)</label>
                <textarea 
                  id="description" 
                  placeholder="Provide guidelines, helpful resources..."
                  rows="4"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                ></textarea>
              </div>

              <div className="ua-field">
                <label htmlFor="dueDate">Due Date</label>
                <input 
                  id="dueDate" 
                  type="datetime-local" 
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  required
                />
              </div>

              <div className="ua-field">
                <label htmlFor="gradingFunction">Marking Function</label>
                <select 
                  id="gradingFunction" 
                  value={gradingFunction} 
                  onChange={(e) => setGradingFunction(e.target.value)}
                  required
                >
                  <option value="Percentage-based">Percentage-based</option>
                  <option value="Absolute Grading (A-F)">Absolute Grading (A-F)</option>
                  <option value="Rank-based Grading">Rank-based Grading</option>
                  <option value="Pass/Fail">Pass/Fail</option>
                  <option value="Custom">Custom...</option>
                </select>
              </div>

              {gradingFunction === "Custom" && (
                <div className="ua-field ua-field--full">
                  <label htmlFor="customGrading">Custom Marking Function</label>
                  <input 
                    id="customGrading" 
                    type="text" 
                    placeholder="e.g., Peer Review (50%) + Instructor Evaluation (50%)" 
                    value={customGrading}
                    onChange={(e) => setCustomGrading(e.target.value)}
                    required
                  />
                </div>
              )}
            </div>

            <div className="ua-field ua-field--full">
              <label>Attachment</label>
              <div className="ua-dropzone">
                <input 
                  type="file" 
                  id="fileUpload" 
                  className="ua-file-input" 
                  onChange={handleFileChange}
                />
                <label htmlFor="fileUpload" className="ua-file-label">
                  <div className="ua-drop-icon">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                      <polyline points="17 8 12 3 7 8"></polyline>
                      <line x1="12" y1="3" x2="12" y2="15"></line>
                    </svg>
                  </div>
                  {file ? (
                    <span className="ua-file-name">{file.name}</span>
                  ) : (
                    <>
                      <span>Click to upload or drag and drop</span>
                      <small>PDF, DOCX, ZIP up to 10MB</small>
                    </>
                  )}
                </label>
              </div>
            </div>

            <div className="ua-actions">
              {status === "success" ? (
                <div className="ua-success-msg">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                  Assignment published successfully!
                </div>
              ) : (
                <button type="submit" className="ua-submit-btn" disabled={status === "uploading"}>
                  {status === "uploading" ? "Publishing..." : "Publish Assignment"}
                </button>
              )}
            </div>
          </form>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default UploadAssignment;
