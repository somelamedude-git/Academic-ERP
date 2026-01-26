import { useState } from "react";
import "./../styles/Login.css";

export default function Login() {
  const [role, setRole] = useState("student");
  const [form, setForm] = useState({
    email: "",
    password: ""
  });

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

    console.log("Login Payload:", payload);
    // axios.post("/api/auth/login", payload)
  };

  return (
    <div className="login-wrapper">
      <div className="login-card">
        <h1 className="login-title">Academic ERP System</h1>
        

        {/* Role Selection */}
        <div className="role-switch">
          {["student", "faculty", "admin"].map((r) => (
            <button
              key={r}
              className={role === r ? "active" : ""}
              onClick={() => setRole(r)}
            >
              {r.toUpperCase()}
            </button>
          ))}
        </div>

        {/* Login Form */}
        <form onSubmit={handleSubmit}>
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
            Login
          </button>
        </form>

        <div className="login-footer">
          <span>© Academic ERP System</span>
        </div>
      </div>
    </div>
  );
}