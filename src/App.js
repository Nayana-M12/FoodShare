import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';
import DonorDashboard from './pages/dashboards/DonorDashboard';
import NGODashboard from './pages/dashboards/NGODashboard';
import VolunteerDashboard from './pages/dashboards/VolunteerDashboard';
import AdminDashboard from './pages/dashboards/AdminDashboard';

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userRole, setUserRole] = useState(null);

  const handleLogin = (role) => {
    setIsLoggedIn(true);
    setUserRole(role);
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setUserRole(null);
  };

  return (
    <Router>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage onLogin={handleLogin} />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/donor-dashboard" element={<DonorDashboard onLogout={handleLogout} />} />
        <Route path="/ngo-dashboard" element={<NGODashboard onLogout={handleLogout} />} />
        <Route path="/volunteer-dashboard" element={<VolunteerDashboard onLogout={handleLogout} />} />
        <Route path="/admin-dashboard" element={<AdminDashboard onLogout={handleLogout} />} />
      </Routes>
    </Router>
  );
}

export default App;
