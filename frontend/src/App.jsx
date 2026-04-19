import { Navigate, Route, Routes } from "react-router-dom";
import Home from "./Pages/Home.jsx";
import Login from "./Pages/Login.jsx";
import StudentDashBoard from "./student/StudentDashBoard.jsx";
import Timetable from "./student/Timetable.jsx";
import Assignment from "./student/Assignment.jsx";
import FacultyDashboard from "./Faculty/FacultyDashboard.jsx";
import UploadAssignment from "./Faculty/UploadAssignment.jsx";
import AdminDashboard from "./Admin/AdminDashboard.jsx";
import ProtectedRoute from "./components/ProtectedRoute.jsx";

function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/login" element={<Login />} />
      <Route element={<ProtectedRoute allowedRole="student" />}>
        <Route path="/student/dashboard" element={<StudentDashBoard />} />
        <Route path="/student/assignments" element={<Assignment />} />
        <Route path="/student/timetable" element={<Timetable />} />
      </Route>
      <Route element={<ProtectedRoute allowedRole="faculty" />}>
        <Route path="/faculty/dashboard" element={<FacultyDashboard />} />
        <Route path="/faculty/upload-assignment" element={<UploadAssignment />} />
      </Route>
      <Route element={<ProtectedRoute allowedRole="admin" />}>
        <Route path="/admin/dashboard" element={<AdminDashboard />} />
        <Route path="/admin/manage-users" element={<h1>Manage Users</h1>} />
      </Route>

      <Route path="/test" element={<h1>Test Page</h1>} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;
