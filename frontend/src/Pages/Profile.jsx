import { useEffect, useState } from "react";
import Navbar from "../components/Navbar.jsx";
import Footer from "../components/Footer.jsx";
import { getProfile, updateProfile, changePassword } from "../Services/api.js";
import "../Styles/Profile.css";

export default function Profile() {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [editName, setEditName] = useState("");
  const [nameSubmitting, setNameSubmitting] = useState(false);
  const [nameSuccess, setNameSuccess] = useState("");
  const [nameError, setNameError] = useState("");

  const [pwForm, setPwForm] = useState({ currentPassword: "", newPassword: "", confirm: "" });
  const [pwSubmitting, setPwSubmitting] = useState(false);
  const [pwSuccess, setPwSuccess] = useState("");
  const [pwError, setPwError] = useState("");

  useEffect(() => {
    getProfile()
      .then(res => {
        setProfile(res.profile);
        setEditName(res.profile.name);
      })
      .catch(err => setError(err.message || "Failed to load profile."))
      .finally(() => setLoading(false));
  }, []);

  const handleNameSave = async (e) => {
    e.preventDefault();
    if (!editName.trim()) return;
    setNameSubmitting(true);
    setNameError("");
    setNameSuccess("");
    try {
      const res = await updateProfile(editName.trim());
      setProfile(res.profile);
      setNameSuccess("Name updated successfully.");
    } catch (err) {
      setNameError(err.message || "Failed to update name.");
    } finally {
      setNameSubmitting(false);
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    if (pwForm.newPassword !== pwForm.confirm) {
      setPwError("New passwords do not match.");
      return;
    }
    if (pwForm.newPassword.length < 6) {
      setPwError("New password must be at least 6 characters.");
      return;
    }
    setPwSubmitting(true);
    setPwError("");
    setPwSuccess("");
    try {
      await changePassword(pwForm.currentPassword, pwForm.newPassword);
      setPwSuccess("Password changed successfully.");
      setPwForm({ currentPassword: "", newPassword: "", confirm: "" });
    } catch (err) {
      setPwError(err.message || "Failed to change password.");
    } finally {
      setPwSubmitting(false);
    }
  };

  const initials = profile?.name
    ? profile.name.split(" ").map(w => w[0]).slice(0, 2).join("").toUpperCase()
    : "??";

  const roleLabel = { Student: "Student", Faculty: "Faculty", Admin: "Administrator" };

  const renderRoleFields = () => {
    if (!profile) return null;
    const role = profile.role;

    if (role === "Student") return (
      <div className="pf-fields">
        <div className="pf-field"><span>Enrollment No</span><strong>{profile.enrollmentNo}</strong></div>
        <div className="pf-field"><span>Degree</span><strong>{profile.degree}</strong></div>
        <div className="pf-field"><span>Branch</span><strong>{profile.branchCode}</strong></div>
        <div className="pf-field"><span>Semester</span><strong>Semester {profile.currentSemester}</strong></div>
        <div className="pf-field"><span>Batch Year</span><strong>{profile.batchYear}</strong></div>
      </div>
    );

    if (role === "Faculty") return (
      <div className="pf-fields">
        <div className="pf-field"><span>Employee ID</span><strong>{profile.employee_id}</strong></div>
        <div className="pf-field"><span>Designation</span><strong>{profile.designation}</strong></div>
        <div className="pf-field"><span>Department</span><strong>{profile.department_name}</strong></div>
        {profile.subjects?.length > 0 && (
          <div className="pf-field pf-field--full">
            <span>Subjects</span>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", marginTop: "4px" }}>
              {profile.subjects.map(s => (
                <span key={s} style={{ padding: "4px 12px", borderRadius: "999px", background: "#e5f2ef", color: "#0f5f56", fontSize: "0.82rem", fontWeight: 600 }}>{s}</span>
              ))}
            </div>
          </div>
        )}
      </div>
    );

    if (role === "Admin") return (
      <div className="pf-fields">
        <div className="pf-field"><span>Admin Level</span><strong>{profile.adminLevel ?? "Standard"}</strong></div>
        {profile.permissions?.length > 0 && (
          <div className="pf-field pf-field--full">
            <span>Permissions</span>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", marginTop: "4px" }}>
              {profile.permissions.map(p => (
                <span key={p} style={{ padding: "4px 12px", borderRadius: "999px", background: "#e0f2fe", color: "#0369a1", fontSize: "0.82rem", fontWeight: 600 }}>{p}</span>
              ))}
            </div>
          </div>
        )}
      </div>
    );

    return null;
  };

  return (
    <div className="pf-page">
      <Navbar />
      <main className="pf-container">
        {loading && <p className="pf-muted">Loading profile...</p>}
        {!loading && error && <p className="pf-error">{error}</p>}

        {!loading && !error && profile && (
          <>
            {/* Hero */}
            <section className="pf-hero">
              <div className="pf-avatar">{initials}</div>
              <div>
                <h1>{profile.name}</h1>
                <p>{profile.email}</p>
                <span className="pf-role-badge">{roleLabel[profile.role] ?? profile.role}</span>
              </div>
            </section>

            {/* Role-specific info */}
            <section className="pf-card">
              <h2>Account Details</h2>
              {renderRoleFields()}
              <div className="pf-fields" style={{ marginTop: "16px" }}>
                <div className="pf-field">
                  <span>Member Since</span>
                  <strong>{new Date(profile.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}</strong>
                </div>
              </div>
            </section>

            {/* Edit name */}
            <section className="pf-card">
              <h2>Edit Name</h2>
              {nameSuccess && <p className="pf-success">{nameSuccess}</p>}
              {nameError && <p className="pf-error">{nameError}</p>}
              <form onSubmit={handleNameSave} className="pf-form">
                <label>Display Name
                  <input value={editName} onChange={e => setEditName(e.target.value)} required />
                </label>
                <div className="pf-form-actions">
                  <button type="submit" className="pf-btn pf-btn--primary" disabled={nameSubmitting}>
                    {nameSubmitting ? "Saving..." : "Save Name"}
                  </button>
                </div>
              </form>
            </section>

            {/* Change password */}
            <section className="pf-card">
              <h2>Change Password</h2>
              {pwSuccess && <p className="pf-success">{pwSuccess}</p>}
              {pwError && <p className="pf-error">{pwError}</p>}
              <form onSubmit={handlePasswordChange} className="pf-form">
                <label>Current Password
                  <input type="password" required value={pwForm.currentPassword} onChange={e => setPwForm(p => ({ ...p, currentPassword: e.target.value }))} />
                </label>
                <label>New Password
                  <input type="password" required minLength={6} value={pwForm.newPassword} onChange={e => setPwForm(p => ({ ...p, newPassword: e.target.value }))} />
                </label>
                <label>Confirm New Password
                  <input type="password" required value={pwForm.confirm} onChange={e => setPwForm(p => ({ ...p, confirm: e.target.value }))} />
                </label>
                <div className="pf-form-actions">
                  <button type="submit" className="pf-btn pf-btn--primary" disabled={pwSubmitting}>
                    {pwSubmitting ? "Changing..." : "Change Password"}
                  </button>
                </div>
              </form>
            </section>
          </>
        )}
      </main>
      <Footer />
    </div>
  );
}
