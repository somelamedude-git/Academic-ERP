import { Link, useLocation } from "react-router-dom";
import "./Footer.css";
import { getStoredRole } from "../auth/auth.js";

const Footer = () => {
  const { pathname } = useLocation();
  const year = new Date().getFullYear();
  const storedRole = getStoredRole();

  const isStudent = pathname.startsWith("/student") || storedRole === "student";
  const isFaculty = pathname.startsWith("/faculty") || storedRole === "faculty";
  const isAdmin = pathname.startsWith("/admin") || storedRole === "admin";
  const roleLinks = isStudent
    ? [
        { label: "Dashboard", to: "/student/dashboard" },
        { label: "Assignments", to: "/student/assignments" },
        { label: "Timetable", to: "/student/timetable" },
      ]
    : isFaculty
      ? [{ label: "Dashboard", to: "/faculty/dashboard" }]
      : isAdmin
        ? [
            { label: "Dashboard", to: "/admin/dashboard" },
            { label: "Manage Users", to: "/admin/manage-users" },
          ]
        : [{ label: "Home", to: "/" }];

  return (
    <footer className="footer">
      <div className="footer__inner">
        <section className="footer__grid">
          <div className="footer__block">
            <h3>Academic ERP</h3>
            
            <h6 className="footer__address">
              Indian Institute of Information Technology, Gwalior
            </h6>
          </div>

          <div className="footer__block">
            <h4>Navigate</h4>
            <ul>
              {roleLinks.map((item) => (
                <li key={item.to}>
                  <Link to={item.to}>{item.label}</Link>
                </li>
              ))}
            </ul>
          </div>

          <div className="footer__block">
            <h4>Support</h4>
            <ul>
              <li><a href="mailto:support@classroom.local">Email Support</a></li>
              <li><a href="tel:+911234567890">Contact Desk</a></li>
              <li><a href="#faq">FAQs</a></li>
              <li><a href="#guides">User Guides</a></li>
            </ul>
          </div>

          <div className="footer__block">
            <h4>Legal</h4>
            <ul>
              <li><a href="#privacy">Privacy</a></li>
              <li><a href="#terms">Terms</a></li>
              <li><a href="#security">Security</a></li>
            </ul>
          </div>
        </section>

        <div className="footer__bottom">
          <p className="footer__copy">
            © {year} Academic ERP · Institutional use only
          </p>
          <p className="footer__hours">
            Support: Mon–Fri, 9 AM – 6 PM IST
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
