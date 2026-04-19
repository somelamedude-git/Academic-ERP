import { useState, useRef, useEffect } from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import "./Navbar.css";
import { clearAuth, getStoredAuth, getStoredRole } from "../auth/auth.js";

const roleConfig = {
  student: {
    label: "Student Portal",
    links: [
      { label: "Dashboard", to: "/student/dashboard" },
      { label: "Assignments", to: "/student/assignments" },
      { label: "Timetable", to: "/student/timetable" },
    ],
  },
  faculty: {
    label: "Faculty Workspace",
    links: [
      { label: "Dashboard", to: "/faculty/dashboard" },
      { label: "Upload Assignment", to: "/faculty/upload-assignment" },
    ],
  },
  admin: {
    label: "Admin Console",
    links: [
      { label: "Dashboard", to: "/admin/dashboard" },
      { label: "Manage Users", to: "/admin/manage-users" },
    ],
  },
  home: {
    label: "Academic ERP",
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
  const [menuOpen, setMenuOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const profileRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (profileRef.current && !profileRef.current.contains(e.target)) {
        setProfileOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const path = location.pathname;
  const storedAuth = getStoredAuth();
  const storedRole = getStoredRole();
  const isSignedIn = Boolean(storedRole);
  const isStudent = path.startsWith("/student") || storedRole === "student";
  const isFaculty = path.startsWith("/faculty") || storedRole === "faculty";
  const isAdmin = path.startsWith("/admin") || storedRole === "admin";
  const context = isStudent
    ? roleConfig.student
    : isFaculty
      ? roleConfig.faculty
      : isAdmin
        ? roleConfig.admin
        : roleConfig.home;

  const handleChangeAccount = () => {
    clearAuth();
    navigate("/login", { replace: true });
  };

  return (
    <header className="nav-shell">
      <nav className="nav-inner">
        <div className="nav-left-wrapper" ref={profileRef}>
          {isSignedIn ? (
            <>
              <button 
                className="nav-brand nav-brand--button" 
                onClick={() => setProfileOpen(!profileOpen)}
                aria-label="Toggle user options"
              >
                <div className="nav-brand__icon">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                    <circle cx="12" cy="7" r="4"></circle>
                  </svg>
                </div>
                <span className="nav-brand__text">
                  <strong style={{textTransform: 'capitalize'}}>{storedAuth?.email ? storedAuth.email.split('@')[0] : "My Profile"}</strong>
                  <small style={{display: 'flex', alignItems: 'center', gap: '4px'}}>
                    Settings Menu
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{transform: profileOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s'}}>
                      <polyline points="6 9 12 15 18 9"></polyline>
                    </svg>
                  </small>
                </span>
              </button>

              {profileOpen && (
                <div className="nav-profile-dropdown">
                  <button className="nav-dropdown-item" onClick={() => setProfileOpen(false)}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M12 20h9"></path>
                      <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path>
                    </svg>
                    <span>Bio Edit</span>
                  </button>
                  <button className="nav-dropdown-item" onClick={() => setProfileOpen(false)}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                    </svg>
                    <span>Feedback</span>
                  </button>
                  <button className="nav-dropdown-item" onClick={() => setProfileOpen(false)}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
                      <line x1="12" y1="9" x2="12" y2="13"></line>
                      <line x1="12" y1="17" x2="12.01" y2="17"></line>
                    </svg>
                    <span>Complain</span>
                  </button>
                  <button className="nav-dropdown-item" onClick={() => setProfileOpen(false)}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="10"></circle>
                      <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path>
                      <line x1="12" y1="17" x2="12.01" y2="17"></line>
                    </svg>
                    <span>Help</span>
                  </button>
                </div>
              )}
            </>
          ) : (
            <NavLink to="/" className="nav-brand" aria-label="Academic ERP Home">
              <span className="nav-brand__icon">AE</span>
              <span className="nav-brand__text">
                <strong>Academic ERP</strong>
                <small>Campus Suite</small>
              </span>
            </NavLink>
          )}
        </div>

        <span className="nav-context">{context.label}</span>

        <button
          className="nav-mobile-toggle"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Toggle menu"
        >
          {menuOpen ? "✕" : "☰"}
        </button>

        <div className={`nav-links ${menuOpen ? "nav-links--open" : ""}`}>
          <NavLink
            to="/"
            className={({ isActive }) =>
              `nav-link ${isActive ? "nav-link--active" : ""}`
            }
            end
            onClick={() => setMenuOpen(false)}
          >
            Home
          </NavLink>
          {context.links
            .filter((item) => item.to !== "/")
            .map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `nav-link ${isActive ? "nav-link--active" : ""}`
                }
                onClick={() => setMenuOpen(false)}
              >
                {item.label}
              </NavLink>
            ))}
          {isSignedIn ? (
            <button type="button" className="nav-cta" onClick={handleChangeAccount}>
              Sign Out
            </button>
          ) : (
            <NavLink to="/login" className="nav-cta" onClick={() => setMenuOpen(false)}>
              Sign In
            </NavLink>
          )}
        </div>
      </nav>
    </header>
  );
}

export default Navbar;
