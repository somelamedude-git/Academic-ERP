import { NavLink, useLocation, useNavigate } from "react-router-dom";
import "./Navbar.css";
import { clearAuth, getStoredRole } from "../auth/auth.js";

const roleConfig = {
  student: {
    label: "Student Portal",
    note: "Assignments, timetable, attendance",
    links: [
      { label: "Dashboard", to: "/student/dashboard" },
      { label: "Assignments", to: "/student/assignments" },
      { label: "Timetable", to: "/student/timetable" },
      { label: "Grades", to: "/student/grades" },
      { label: "Quizzes", to: "/student/quizzes" },
      { label: "Materials", to: "/student/materials" },
      { label: "Feedback", to: "/student/feedback" },
    ],
  },
  faculty: {
    label: "Faculty Workspace",
    note: "Classes, reviews, publishing",
    links: [
      { label: "Dashboard", to: "/faculty/dashboard" },
      { label: "Assignments", to: "/faculty/assignments" },
      { label: "Materials", to: "/faculty/materials" },
      { label: "Attendance", to: "/faculty/attendance" },
      { label: "Grades", to: "/faculty/grades" },
      { label: "Quizzes", to: "/faculty/quizzes" },
      { label: "Feedback", to: "/faculty/feedback" },
    ],
  },
  admin: {
    label: "Admin Console",
    note: "Governance and user operations",
    links: [
      { label: "Dashboard", to: "/admin/dashboard" },
      { label: "Manage Users", to: "/admin/manage-users" },
      { label: "Courses", to: "/admin/manage-courses" },
      { label: "Timetable", to: "/admin/timetable" },
    ],
  },
  home: {
    label: "Academic ERP",
    note: "Unified campus operations platform",
    links: [
      { label: "Student Portal", to: "/student/dashboard" },
      { label: "Faculty Workspace", to: "/faculty/dashboard" },
      { label: "Login", to: "/login" },
    ],
  },
};

function Navbar() {
  const location = useLocation();
  const navigate = useNavigate();
  const path = location.pathname;
  const storedRole = getStoredRole();
  const isStudent = path.startsWith("/student") || storedRole === "student";
  const isFaculty = path.startsWith("/faculty") || storedRole === "faculty";
  const isAdmin = path.startsWith("/admin") || storedRole === "admin";
  const isLoggedIn = Boolean(storedRole);
  const context = isStudent
    ? roleConfig.student
    : isFaculty
      ? roleConfig.faculty
      : isAdmin
        ? roleConfig.admin
        : roleConfig.home;

  const handleLogout = () => {
    clearAuth();
    navigate("/login", { replace: true });
  };

  return (
    <header className="navbar-shell">
      <nav className="navbar">
        <NavLink to="/" className="navbar-brand" aria-label="Academic ERP Home">
          <span className="navbar-brand__mark">AE</span>
          <span>
            <strong>Academic ERP</strong>
            <small>Institution Operations Suite</small>
          </span>
        </NavLink>

        <div className="navbar-context">
          <span className="navbar-context__label">{context.label}</span>
          <p>{context.note}</p>
        </div>

        <div className="navbar-links">
          <NavLink
            to="/"
            className={({ isActive }) => `navbar-link ${isActive ? "navbar-link--active" : ""}`}
            end
          >
            Home
          </NavLink>
          {context.links
            .filter((item) => item.to !== "/")
            .map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) => `navbar-link ${isActive ? "navbar-link--active" : ""}`}
              >
                {item.label}
              </NavLink>
            ))}
          {isLoggedIn ? (
            <>
              <NavLink
                to="/profile"
                className={({ isActive }) => `navbar-link ${isActive ? "navbar-link--active" : ""}`}
              >
                Profile
              </NavLink>
              <button type="button" onClick={handleLogout} className="navbar-cta navbar-cta--logout">
                Logout
              </button>
            </>
          ) : (
            <NavLink to="/login" className="navbar-cta">
              Secure Login
            </NavLink>
          )}
        </div>
      </nav>
    </header>
  );
}

export default Navbar;
