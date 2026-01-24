import { Routes, Route } from 'react-router-dom';
import Home from './Pages/Home.jsx';

function App() {
  return (
    <>
      <Routes>
        {/* Correct Syntax: Use the 'element' prop */}
        <Route path="/" element={<Home />} />
        
        {/* You can add a test route if you want */}
        <Route path="/test" element={<h1>Test Page</h1>} />
      </Routes>
    </>
  );
}

export default App;