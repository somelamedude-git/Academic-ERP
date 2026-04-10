import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import "../Styles/Login.css";
import { getDashboardPathForRole, getStoredRole, saveAuth } from "../auth/auth.js";

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const [role, setRole] = useState("student");
  const [form, setForm] = useState({
    email: "",
    password: ""
  });

  useEffect(() => {
    const storedRole = getStoredRole();

    if (storedRole) {
      navigate(getDashboardPathForRole(storedRole), { replace: true });
    }
  }, [navigate]);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    // Backend-ready payload (JWT-based)
    const payload = {
      role,
      email: form.email,
      password: form.password
    };

    saveAuth({
      role,
      email: form.email
    });

    console.log("Login Payload:", payload);

    const redirectPath = location.state?.from;
    const roleDashboardPath = getDashboardPathForRole(role);
    const nextPath = redirectPath?.startsWith(`/${role}`) ? redirectPath : roleDashboardPath;
    navigate(nextPath, { replace: true });
  };

  return (
    <div className="login-wrapper">
      <section className="login-panel login-panel--brand">
        <span className="login-eyebrow">Secure Institutional Access</span>
        <h1>Academic ERP</h1>
        <p>
          Access student services, faculty workflows, and administrative tools from one
          professional campus platform.
        </p>

        <div className="login-brand-metrics">
          <article>
            <strong>24/7</strong>
            <span>Role-based access availability</span>
          </article>
          <article>
            <strong>3</strong>
            <span>Dedicated portals in one system</span>
          </article>
          <article>
            <strong>100%</strong>
            <span>Centralized academic visibility</span>
          </article>
        </div>

        <div className="login-brand-note">
          <p>Recommended for IIIT Gwalior operations, class workflows, attendance, and reporting.</p>
        </div>
      </section>

      <section className="login-panel login-panel--form">
        <div className="login-header">
          <h2>Welcome back</h2>
          <p>Use your institutional credentials to continue.</p>
        </div>

        <div className="role-switch">
          {["student", "faculty", "admin"].map((r) => (
            <button
              key={r}
              type="button"
              className={role === r ? "active" : ""}
              onClick={() => setRole(r)}
            >
              {r.toUpperCase()}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="login-form">
          <label>Email</label>
          <input
            type="email"
            name="email"
            placeholder="Enter institutional email"
            required
            onChange={handleChange}
          />

          <label>Password</label>
          <input
            type="password"
            name="password"
            placeholder="Enter password"
            required
            onChange={handleChange}
          />

          <button type="submit" className="login-btn">
            Continue to Dashboard
          </button>
        </form>

        <div className="login-footer">
          <span>© Academic ERP System</span>
          <span>Protected access for authorized campus users</span>
        </div>
      </section>
    </div>
  );
}
