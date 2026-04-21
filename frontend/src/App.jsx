import { Navigate, Route, Routes } from "react-router-dom";
import Home from "./Pages/Home.jsx";
import Login from "./Pages/Login.jsx";
import Profile from "./Pages/Profile.jsx";
import StudentDashBoard from "./student/StudentDashBoard.jsx";
import Timetable from "./student/Timetable.jsx";
import Assignment from "./student/Assignment.jsx";
import Grades from "./student/Grades.jsx";
import Quizzes from "./student/Quizzes.jsx";
import CourseMaterials from "./student/CourseMaterials.jsx";
import FeedbackComplaint from "./student/FeedbackComplaint.jsx";
import FacultyDashboard from "./Faculty/FacultyDashboard.jsx";
import UploadAssignment from "./Faculty/UploadAssignment.jsx";
import FacultyAssignments from "./Faculty/FacultyAssignments.jsx";
import FacultyMaterials from "./Faculty/FacultyMaterials.jsx";
import FacultyAttendance from "./Faculty/FacultyAttendance.jsx";
import FacultyGrades from "./Faculty/FacultyGrades.jsx";
import FacultyQuizzes from "./Faculty/FacultyQuizzes.jsx";
import FacultyFeedback from "./Faculty/FacultyFeedback.jsx";
import AdminDashboard from "./Admin/AdminDashboard.jsx";
import ManageUsers from "./Admin/ManageUsers.jsx";
import ManageCourses from "./Admin/ManageCourses.jsx";
import ManageTimetable from "./Admin/ManageTimetable.jsx";
import ProtectedRoute from "./components/ProtectedRoute.jsx";
import { isAuthenticated } from "./auth/auth.js";

const AuthGuard = () => isAuthenticated() ? null : <Navigate to="/login" replace />;

function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/login" element={<Login />} />

     
      <Route path="/profile" element={<><AuthGuard /><Profile /></>} />

      <Route element={<ProtectedRoute allowedRole="student" />}>
        <Route path="/student/dashboard" element={<StudentDashBoard />} />
        <Route path="/student/assignments" element={<Assignment />} />
        <Route path="/student/timetable" element={<Timetable />} />
        <Route path="/student/grades" element={<Grades />} />
        <Route path="/student/quizzes" element={<Quizzes />} />
        <Route path="/student/materials" element={<CourseMaterials />} />
        <Route path="/student/feedback" element={<FeedbackComplaint />} />
      </Route>

      <Route element={<ProtectedRoute allowedRole="faculty" />}>
        <Route path="/faculty/dashboard" element={<FacultyDashboard />} />
        <Route path="/faculty/upload-assignment" element={<UploadAssignment />} />
        <Route path="/faculty/assignments" element={<FacultyAssignments />} />
        <Route path="/faculty/materials" element={<FacultyMaterials />} />
        <Route path="/faculty/attendance" element={<FacultyAttendance />} />
        <Route path="/faculty/grades" element={<FacultyGrades />} />
        <Route path="/faculty/quizzes" element={<FacultyQuizzes />} />
        <Route path="/faculty/feedback" element={<FacultyFeedback />} />
      </Route>

      <Route element={<ProtectedRoute allowedRole="admin" />}>
        <Route path="/admin/dashboard" element={<AdminDashboard />} />
        <Route path="/admin/manage-users" element={<ManageUsers />} />
        <Route path="/admin/manage-courses" element={<ManageCourses />} />
        <Route path="/admin/timetable" element={<ManageTimetable />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;
