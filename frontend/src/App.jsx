import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import Register from './pages/Register';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import ProjectBoard from './pages/ProjectBoard';

function App() {
  return (
    <Router>
      <div className="min-h-screen w-full bg-[#05070f] text-slate-100 flex flex-col m-0 p-0">
        
        <Navbar />

        <main className="flex-1 w-full m-0 p-0">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/register" element={<Register />} />
            <Route path="/login" element={<Login/>} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/project/:projectId" element={<ProjectBoard />} />
          </Routes>
        </main>

      </div>
    </Router>
  );
}

export default App;