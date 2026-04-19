import { useEffect, useState } from "react";
import Navbar from "../components/Navbar.jsx";
import Footer from "../components/Footer.jsx";
import { listStudents, addStudent, removeStudent, listFaculty, addFaculty, removeFaculty } from "../Services/api.js";
import "../Styles/ManageUsers.css";

const BRANCH_CODES = ["BMS", "BEE", "IMT", "IMG", "BCS"];
const SEMESTERS = [1, 2, 3, 4, 5, 6, 7, 8];

const emptyStudent = { name: "", email: "", password: "", enrollmentNo: "", batchYear: "", degree: "B.Tech", branchCode: "BCS", currentSemester: 1 };
const emptyFaculty = { name: "", email: "", password: "", employee_id: "", designation: "", department_name: "", subjects: "" };

export default function ManageUsers() {
  const [tab, setTab] = useState("students");

  const [students, setStudents] = useState([]);
  const [faculty, setFaculty] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [showAddStudent, setShowAddStudent] = useState(false);
  const [showAddFaculty, setShowAddFaculty] = useState(false);
  const [studentForm, setStudentForm] = useState(emptyStudent);
  const [facultyForm, setFacultyForm] = useState(emptyFaculty);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");
  const [formSuccess, setFormSuccess] = useState("");

  const [search, setSearch] = useState("");

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    setError("");
    try {
      const [sRes, fRes] = await Promise.all([listStudents(), listFaculty()]);
      setStudents(sRes.students ?? []);
      setFaculty(fRes.faculty ?? []);
    } catch (err) {
      setError(err.message || "Failed to load users.");
    } finally {
      setLoading(false);
    }
  };

  const handleAddStudent = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setFormError("");
    setFormSuccess("");
    try {
      await addStudent({ ...studentForm, currentSemester: Number(studentForm.currentSemester) });
      setFormSuccess("Student added successfully.");
      setStudentForm(emptyStudent);
      setShowAddStudent(false);
      loadData();
    } catch (err) {
      setFormError(err.message || "Failed to add student.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleAddFaculty = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setFormError("");
    setFormSuccess("");
    try {
      const payload = { ...facultyForm, subjects: facultyForm.subjects.split(",").map(s => s.trim()).filter(Boolean) };
      await addFaculty(payload);
      setFormSuccess("Faculty added successfully.");
      setFacultyForm(emptyFaculty);
      setShowAddFaculty(false);
      loadData();
    } catch (err) {
      setFormError(err.message || "Failed to add faculty.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleRemoveStudent = async (id, name) => {
    if (!confirm(`Remove student "${name}"? This cannot be undone.`)) return;
    try {
      await removeStudent(id);
      setStudents(prev => prev.filter(s => s._id !== id));
    } catch (err) {
      alert(err.message || "Failed to remove student.");
    }
  };

  const handleRemoveFaculty = async (id, name) => {
    if (!confirm(`Remove faculty "${name}"? This cannot be undone.`)) return;
    try {
      await removeFaculty(id);
      setFaculty(prev => prev.filter(f => f._id !== id));
    } catch (err) {
      alert(err.message || "Failed to remove faculty.");
    }
  };

  const filteredStudents = students.filter(s =>
    `${s.name} ${s.email} ${s.enrollmentNo} ${s.branchCode}`.toLowerCase().includes(search.toLowerCase())
  );
  const filteredFaculty = faculty.filter(f =>
    `${f.name} ${f.email} ${f.employee_id} ${f.department_name}`.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="mu-page">
      <Navbar />
      <main className="mu-container">
        <header className="mu-header">
          <div>
            <h1>Manage Users</h1>
            <p>Add, view, and remove students and faculty members.</p>
          </div>
          <div className="mu-header-actions">
            <input
              className="mu-search"
              type="text"
              placeholder="Search by name, email, ID..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
            {tab === "students" && (
              <button className="mu-btn mu-btn--primary" onClick={() => { setShowAddStudent(true); setFormError(""); setFormSuccess(""); }}>
                + Add Student
              </button>
            )}
            {tab === "faculty" && (
              <button className="mu-btn mu-btn--primary" onClick={() => { setShowAddFaculty(true); setFormError(""); setFormSuccess(""); }}>
                + Add Faculty
              </button>
            )}
          </div>
        </header>

        {formSuccess && <p className="mu-success">{formSuccess}</p>}

        <div className="mu-tabs">
          <button className={`mu-tab ${tab === "students" ? "mu-tab--active" : ""}`} onClick={() => setTab("students")}>
            Students ({students.length})
          </button>
          <button className={`mu-tab ${tab === "faculty" ? "mu-tab--active" : ""}`} onClick={() => setTab("faculty")}>
            Faculty ({faculty.length})
          </button>
        </div>

        {loading && <p className="mu-muted">Loading users...</p>}
        {!loading && error && <p className="mu-error">{error}</p>}

        {!loading && !error && tab === "students" && (
          <div className="mu-table-shell">
            {filteredStudents.length === 0 ? (
              <p className="mu-empty">No students found.</p>
            ) : (
              <table className="mu-table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Enrollment No</th>
                    <th>Branch</th>
                    <th>Semester</th>
                    <th>Batch</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {filteredStudents.map(s => (
                    <tr key={s._id}>
                      <td><strong>{s.name}</strong></td>
                      <td>{s.email}</td>
                      <td>{s.enrollmentNo}</td>
                      <td><span className="mu-badge">{s.branchCode}</span></td>
                      <td>Sem {s.currentSemester}</td>
                      <td>{s.batchYear}</td>
                      <td>
                        <button className="mu-remove-btn" onClick={() => handleRemoveStudent(s._id, s.name)}>
                          Remove
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        {!loading && !error && tab === "faculty" && (
          <div className="mu-table-shell">
            {filteredFaculty.length === 0 ? (
              <p className="mu-empty">No faculty found.</p>
            ) : (
              <table className="mu-table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Employee ID</th>
                    <th>Designation</th>
                    <th>Department</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {filteredFaculty.map(f => (
                    <tr key={f._id}>
                      <td><strong>{f.name}</strong></td>
                      <td>{f.email}</td>
                      <td>{f.employee_id}</td>
                      <td>{f.designation}</td>
                      <td>{f.department_name}</td>
                      <td>
                        <button className="mu-remove-btn" onClick={() => handleRemoveFaculty(f._id, f.name)}>
                          Remove
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        {/* Add Student Modal */}
        {showAddStudent && (
          <div className="mu-modal-overlay" onClick={() => setShowAddStudent(false)}>
            <div className="mu-modal" onClick={e => e.stopPropagation()}>
              <h2>Add Student</h2>
              {formError && <p className="mu-error">{formError}</p>}
              <form onSubmit={handleAddStudent} className="mu-form">
                <div className="mu-form-row">
                  <label>Full Name<input required value={studentForm.name} onChange={e => setStudentForm(p => ({ ...p, name: e.target.value }))} /></label>
                  <label>Email<input type="email" required value={studentForm.email} onChange={e => setStudentForm(p => ({ ...p, email: e.target.value }))} /></label>
                </div>
                <div className="mu-form-row">
                  <label>Password<input type="password" required minLength={6} value={studentForm.password} onChange={e => setStudentForm(p => ({ ...p, password: e.target.value }))} /></label>
                  <label>Enrollment No<input required value={studentForm.enrollmentNo} onChange={e => setStudentForm(p => ({ ...p, enrollmentNo: e.target.value }))} /></label>
                </div>
                <div className="mu-form-row">
                  <label>Batch Year<input required value={studentForm.batchYear} onChange={e => setStudentForm(p => ({ ...p, batchYear: e.target.value }))} /></label>
                  <label>Degree<input required value={studentForm.degree} onChange={e => setStudentForm(p => ({ ...p, degree: e.target.value }))} /></label>
                </div>
                <div className="mu-form-row">
                  <label>Branch
                    <select value={studentForm.branchCode} onChange={e => setStudentForm(p => ({ ...p, branchCode: e.target.value }))}>
                      {BRANCH_CODES.map(b => <option key={b} value={b}>{b}</option>)}
                    </select>
                  </label>
                  <label>Semester
                    <select value={studentForm.currentSemester} onChange={e => setStudentForm(p => ({ ...p, currentSemester: e.target.value }))}>
                      {SEMESTERS.map(s => <option key={s} value={s}>Semester {s}</option>)}
                    </select>
                  </label>
                </div>
                <div className="mu-form-actions">
                  <button type="button" className="mu-btn mu-btn--ghost" onClick={() => setShowAddStudent(false)}>Cancel</button>
                  <button type="submit" className="mu-btn mu-btn--primary" disabled={submitting}>{submitting ? "Adding..." : "Add Student"}</button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Add Faculty Modal */}
        {showAddFaculty && (
          <div className="mu-modal-overlay" onClick={() => setShowAddFaculty(false)}>
            <div className="mu-modal" onClick={e => e.stopPropagation()}>
              <h2>Add Faculty</h2>
              {formError && <p className="mu-error">{formError}</p>}
              <form onSubmit={handleAddFaculty} className="mu-form">
                <div className="mu-form-row">
                  <label>Full Name<input required value={facultyForm.name} onChange={e => setFacultyForm(p => ({ ...p, name: e.target.value }))} /></label>
                  <label>Email<input type="email" required value={facultyForm.email} onChange={e => setFacultyForm(p => ({ ...p, email: e.target.value }))} /></label>
                </div>
                <div className="mu-form-row">
                  <label>Password<input type="password" required minLength={6} value={facultyForm.password} onChange={e => setFacultyForm(p => ({ ...p, password: e.target.value }))} /></label>
                  <label>Employee ID<input required value={facultyForm.employee_id} onChange={e => setFacultyForm(p => ({ ...p, employee_id: e.target.value }))} /></label>
                </div>
                <div className="mu-form-row">
                  <label>Designation<input required value={facultyForm.designation} onChange={e => setFacultyForm(p => ({ ...p, designation: e.target.value }))} /></label>
                  <label>Department<input required value={facultyForm.department_name} onChange={e => setFacultyForm(p => ({ ...p, department_name: e.target.value }))} /></label>
                </div>
                <label>Subjects (comma-separated)<input value={facultyForm.subjects} onChange={e => setFacultyForm(p => ({ ...p, subjects: e.target.value }))} placeholder="e.g. DBMS, OS, Algorithms" /></label>
                <div className="mu-form-actions">
                  <button type="button" className="mu-btn mu-btn--ghost" onClick={() => setShowAddFaculty(false)}>Cancel</button>
                  <button type="submit" className="mu-btn mu-btn--primary" disabled={submitting}>{submitting ? "Adding..." : "Add Faculty"}</button>
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
