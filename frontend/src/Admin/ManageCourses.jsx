import { useEffect, useState } from "react";
import Navbar from "../components/Navbar.jsx";
import Footer from "../components/Footer.jsx";
import { getCourses, createCourse, deleteCourse, addCourseToBranch, removeCourseFromBranch, listFaculty } from "../Services/api.js";
import "../Styles/ManageUsers.css";

const BRANCH_CODES = ["BMS", "BEE", "IMT", "IMG", "BCS"];
const SEMESTERS = [1, 2, 3, 4, 5, 6, 7, 8];

const emptyCourse = { name: "", code: "", facultyId: "" };
const emptyBranchAssign = { branchCode: "BCS", semesterNumber: 1, courseId: "" };

export default function ManageCourses() {
  const [courses, setCourses] = useState([]);
  const [faculty, setFaculty] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");

  const [showAddCourse, setShowAddCourse] = useState(false);
  const [showAssign, setShowAssign] = useState(false);
  const [courseForm, setCourseForm] = useState(emptyCourse);
  const [assignForm, setAssignForm] = useState(emptyBranchAssign);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");
  const [formSuccess, setFormSuccess] = useState("");

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    setLoading(true);
    setError("");
    try {
      const [cRes, fRes] = await Promise.all([getCourses(), listFaculty()]);
      setCourses(cRes.courses ?? []);
      setFaculty(fRes.faculty ?? []);
    } catch (err) {
      setError(err.message || "Failed to load courses.");
    } finally {
      setLoading(false);
    }
  };

  const handleAddCourse = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setFormError("");
    try {
      await createCourse(courseForm);
      setFormSuccess("Course created.");
      setCourseForm(emptyCourse);
      setShowAddCourse(false);
      loadData();
    } catch (err) {
      setFormError(err.message || "Failed to create course.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteCourse = async (id, name) => {
    if (!confirm(`Delete course "${name}"?`)) return;
    try {
      await deleteCourse(id);
      setCourses(prev => prev.filter(c => c._id !== id));
    } catch (err) {
      alert(err.message || "Failed to delete course.");
    }
  };

  const handleAssign = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setFormError("");
    try {
      await addCourseToBranch(assignForm.branchCode, Number(assignForm.semesterNumber), assignForm.courseId);
      setFormSuccess(`Course assigned to ${assignForm.branchCode} Sem ${assignForm.semesterNumber}.`);
      setShowAssign(false);
      setAssignForm(emptyBranchAssign);
    } catch (err) {
      setFormError(err.message || "Failed to assign course.");
    } finally {
      setSubmitting(false);
    }
  };

  const filtered = courses.filter(c =>
    `${c.name} ${c.code} ${c.facultyId?.name ?? ""}`.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="mu-page">
      <Navbar />
      <main className="mu-container">
        <header className="mu-header">
          <div>
            <h1>Manage Courses</h1>
            <p>Create courses, assign faculty, and link to branch semesters.</p>
          </div>
          <div className="mu-header-actions">
            <input className="mu-search" type="text" placeholder="Search courses..." value={search} onChange={e => setSearch(e.target.value)} />
            <button className="mu-btn mu-btn--ghost" onClick={() => { setShowAssign(true); setFormError(""); }}>Assign to Branch</button>
            <button className="mu-btn mu-btn--primary" onClick={() => { setShowAddCourse(true); setFormError(""); }}>+ New Course</button>
          </div>
        </header>

        {formSuccess && <p className="mu-success">{formSuccess}</p>}
        {loading && <p className="mu-muted">Loading courses...</p>}
        {!loading && error && <p className="mu-error">{error}</p>}

        {!loading && !error && (
          <div className="mu-table-shell">
            {filtered.length === 0 ? <p className="mu-empty">No courses found.</p> : (
              <table className="mu-table">
                <thead>
                  <tr>
                    <th>Course Name</th>
                    <th>Code</th>
                    <th>Faculty</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(c => (
                    <tr key={c._id}>
                      <td><strong>{c.name}</strong></td>
                      <td><span className="mu-badge">{c.code}</span></td>
                      <td>{c.facultyId?.name ?? <span className="mu-muted-text">Unassigned</span>}</td>
                      <td>
                        <button className="mu-remove-btn" onClick={() => handleDeleteCourse(c._id, c.name)}>Delete</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        {showAddCourse && (
          <div className="mu-modal-overlay" onClick={() => setShowAddCourse(false)}>
            <div className="mu-modal" onClick={e => e.stopPropagation()}>
              <h2>New Course</h2>
              {formError && <p className="mu-error">{formError}</p>}
              <form onSubmit={handleAddCourse} className="mu-form">
                <div className="mu-form-row">
                  <label>Course Name<input required value={courseForm.name} onChange={e => setCourseForm(p => ({ ...p, name: e.target.value }))} /></label>
                  <label>Course Code<input required value={courseForm.code} onChange={e => setCourseForm(p => ({ ...p, code: e.target.value }))} placeholder="e.g. CS301" /></label>
                </div>
                <label>Assign Faculty
                  <select required value={courseForm.facultyId} onChange={e => setCourseForm(p => ({ ...p, facultyId: e.target.value }))}>
                    <option value="">-- Select Faculty --</option>
                    {faculty.map(f => <option key={f._id} value={f._id}>{f.name} ({f.department_name})</option>)}
                  </select>
                </label>
                <div className="mu-form-actions">
                  <button type="button" className="mu-btn mu-btn--ghost" onClick={() => setShowAddCourse(false)}>Cancel</button>
                  <button type="submit" className="mu-btn mu-btn--primary" disabled={submitting}>{submitting ? "Creating..." : "Create Course"}</button>
                </div>
              </form>
            </div>
          </div>
        )}

        {showAssign && (
          <div className="mu-modal-overlay" onClick={() => setShowAssign(false)}>
            <div className="mu-modal" onClick={e => e.stopPropagation()}>
              <h2>Assign Course to Branch</h2>
              {formError && <p className="mu-error">{formError}</p>}
              <form onSubmit={handleAssign} className="mu-form">
                <label>Course
                  <select required value={assignForm.courseId} onChange={e => setAssignForm(p => ({ ...p, courseId: e.target.value }))}>
                    <option value="">-- Select Course --</option>
                    {courses.map(c => <option key={c._id} value={c._id}>{c.name} ({c.code})</option>)}
                  </select>
                </label>
                <div className="mu-form-row">
                  <label>Branch
                    <select value={assignForm.branchCode} onChange={e => setAssignForm(p => ({ ...p, branchCode: e.target.value }))}>
                      {BRANCH_CODES.map(b => <option key={b} value={b}>{b}</option>)}
                    </select>
                  </label>
                  <label>Semester
                    <select value={assignForm.semesterNumber} onChange={e => setAssignForm(p => ({ ...p, semesterNumber: e.target.value }))}>
                      {SEMESTERS.map(s => <option key={s} value={s}>Semester {s}</option>)}
                    </select>
                  </label>
                </div>
                <div className="mu-form-actions">
                  <button type="button" className="mu-btn mu-btn--ghost" onClick={() => setShowAssign(false)}>Cancel</button>
                  <button type="submit" className="mu-btn mu-btn--primary" disabled={submitting}>{submitting ? "Assigning..." : "Assign"}</button>
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
