import React from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import { GoogleOAuthProvider } from '@react-oauth/google';
import CallDashboard from './CallDashboard';
import Projects from './components/Projects';
import Dabur from './Dabur';
import Login from './components/Login';
import Signup from './components/Signup';
import ObjectionHandling from './ObjectionHandling';
import Gauri from './Gauri';
import Medibot from './Medibot';

function RequireAuth({ children }) {
  const token = localStorage.getItem('user');
  if (!token) {
    window.location.href = '/login';
    return null;
  }
  return children;
}

function App() {
  return (
    <GoogleOAuthProvider clientId="885918739545-nnklck3p68pg7s6vr9e3o79shvpr3nb9.apps.googleusercontent.com">
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/projects" element={<RequireAuth><Projects /></RequireAuth>} />
          <Route path="/dabur" element={<RequireAuth><Dabur /></RequireAuth>} />
          <Route path="/objection-handling" element={<RequireAuth><ObjectionHandling /></RequireAuth>} />
          <Route path="/gauri" element={<RequireAuth><Gauri /></RequireAuth>} />
          <Route path="/medibot" element={<RequireAuth><Medibot /></RequireAuth>} />
          <Route path="/" element={<Navigate to="/projects" replace />} />
          <Route path="/*" element={<RequireAuth><CallDashboard /></RequireAuth>} />
        </Routes>
      </Router>
    </GoogleOAuthProvider>
  );
}

export default App;
