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
      <section className="login-brand">
        <span className="eyebrow">Secure Institutional Access</span>
        <h1>Academic ERP</h1>
        <p>
          Access student services, faculty workflows, and administrative tools
          from one unified campus platform.
        </p>

        <div className="login-brand-stats">
          <article>
            <strong>24/7</strong>
            <span>Always-on access</span>
          </article>
          <article>
            <strong>3</strong>
            <span>Dedicated portals</span>
          </article>
          <article>
            <strong>100%</strong>
            <span>Centralized data</span>
          </article>
        </div>

        <div className="login-brand-note">
          <p>Designed for IIIT Gwalior — classes, attendance, and reporting.</p>
        </div>
      </section>

      <section className="login-form-panel">
        <div className="login-form-box">
          <div className="login-heading">
            <h2>Welcome back</h2>
            <p>Sign in with your institutional credentials.</p>
          </div>

          <div className="login-role-switch">
            {["student", "faculty", "admin"].map((r) => (
              <button
                key={r}
                type="button"
                className={role === r ? "active" : ""}
                onClick={() => setRole(r)}
              >
                {r}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="login-form">
            <div className="login-field">
              <label>Email</label>
              <input
                type="email"
                name="email"
                placeholder="Enter institutional email"
                required
                onChange={handleChange}
              />
            </div>

            <div className="login-field">
              <label>Password</label>
              <input
                type="password"
                name="password"
                placeholder="Enter password"
                required
                onChange={handleChange}
              />
            </div>

            <button type="submit" className="login-submit">
              Continue to Dashboard
            </button>
          </form>

          <div className="login-bottom">
            <span>© Academic ERP System</span>
            <span>Authorized users only</span>
          </div>
        </div>
      </section>
    </div>
  );
}
