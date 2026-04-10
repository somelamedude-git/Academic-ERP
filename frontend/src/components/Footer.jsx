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
      ? [
          { label: "Dashboard", to: "/faculty/dashboard" },
        ]
      : isAdmin
        ? [
            { label: "Dashboard", to: "/admin/dashboard" },
            { label: "Manage Users", to: "/admin/manage-users" },
          ]
        : [{ label: "Home", to: "/" }];

  return (
    <footer className="app-footer">
      <div className="app-footer__inner">
        <section className="app-footer__grid" aria-label="Footer details">
          <div className="app-footer__block">
            <span className="app-footer__eyebrow">Campus Platform</span>
            <h3>Academic ERP</h3>
            <p>
              Professional workflow support for teaching, attendance, evaluation,
              scheduling, and student communication.
            </p>
            <p className="app-footer__address">
              Indian Institute of Information Technology Gwalior, Madhya Pradesh, India
            </p>
          </div>
 
          <div className="app-footer__block">
            <h4>Quick Links</h4>
            <ul>
              {roleLinks.map((item) => (
                <li key={item.to}>
                  <Link to={item.to}>{item.label}</Link>
                </li>
              ))}
            </ul>
          </div>

          <div className="app-footer__block">
            <h4>Help</h4>
            <ul>
              <li>
                <a href="mailto:support@classroom.local">Support Email</a>
              </li>
              <li>
                <a href="tel:+911234567890">Contact Desk</a>
              </li>
              <li>
                <a href="#faq">FAQs</a>
              </li>
              <li>
                <a href="#guides">User Guides</a>
              </li>
            </ul>
          </div>

          <div className="app-footer__block">
            <h4>Legal</h4>
            <ul>
              <li>
                <a href="#privacy">Privacy Policy</a>
              </li>
              <li>
                <a href="#terms">Terms of Use</a>
              </li>
              <li>
                <a href="#security">Security</a>
              </li>
            </ul>
          </div>
        </section>

        <div className="app-footer__bottom">
          <p className="app-footer__copy">© {year} Academic ERP. Built for secure institutional use.</p>
          <p className="app-footer__hours">Support Hours: Mon-Fri, 9:00 AM to 6:00 PM IST</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
