import { Routes, Route } from "react-router-dom";
import Home from "./Pages/Home.jsx";
import Login from "./Pages/Login.jsx";

function App() {
  return (
    <Routes>
      {/* Home page */}
      <Route path="/" element={<Home />} />

      {/* Login page */}
      <Route path="/login" element={<Login />} />

      {/* Optional test route */}
      <Route path="/test" element={<h1>Test Page</h1>} />
    </Routes>
  );
}

export default App;
