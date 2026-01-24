import { Link, useLocation } from "react-router-dom";
import "./Navbar.css";
function Navbar() {
  const location = useLocation();


  const path = location.pathname;

  const isStudent = path.startsWith("/student");
  const isFaculty = path.startsWith("/faculty");
  const isAdmin = path.startsWith("/admin");

  return (
    <nav className="navbar">
      <h2 className="logo">Classroom System</h2>

      <ul className="nav-links">
        <li>
          <Link to="/">Home</Link>
        </li>

        {isStudent && (
          <>
            <li><Link to="/student/dashboard">Dashboard</Link></li>
            <li><Link to="/student/assignments">Assignments</Link></li>
            <li><Link to="/student/timetable">Timetable</Link></li>
          </>
        )}

        {isFaculty && (
          <>
            <li><Link to="/faculty/dashboard">Dashboard</Link></li>
            <li><Link to="/faculty/upload">Upload Assignment</Link></li>
          </>
        )}

        {isAdmin && (
          <>
            <li><Link to="/admin/dashboard">Dashboard</Link></li>
            <li><Link to="/admin/manage-users">Manage Users</Link></li>
          </>
        )}

        <li>
          <Link to="/login" className="logout">Logout</Link>
        </li>
      </ul>
    </nav>
  );
}

export default Navbar;
