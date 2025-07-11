import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import './Projects.css';
import indusLogo from '../assets/indusai-logo.png';
import { FaUserCircle, FaUserEdit, FaSignOutAlt } from 'react-icons/fa';
import { GoogleLogin } from '@react-oauth/google';
import { jwtDecode } from 'jwt-decode';

function Projects() {
  const [projects, setProjects] = useState([]);
  const [user, setUser] = useState(() => JSON.parse(localStorage.getItem('user')) || null);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    setProjects([
      { id: 'gauri', name: 'Gauri', description: 'AI-powered assistant for business insights.' },
      { id: 'dabur', name: 'Dabur', description: 'Customer engagement and analytics platform.' },
      { id: 'objection-handling', name: 'Objection Handling', description: 'Smart objection handling for sales teams.' }
    ]);
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleManage = (projectId) => {
    if (projectId === 'dabur') {
      navigate('/dabur');
    } else if (projectId === 'objection-handling') {
      navigate('/objection-handling');
    } else if (projectId === 'gauri') {
      navigate('/gauri');
    } else {
      navigate(`/${projectId}`);
    }
  };

  const handleUser = () => {
    alert(`User: ${user?.name || user?.email || 'Unknown'}`);
  };

  const handleProfile = () => {
    alert(`Profile:\nEmail: ${user?.email || 'Unknown'}\nName: ${user?.name || 'Unknown'}`);
  };

  const handleLogout = () => {
    localStorage.removeItem('user');
    setUser(null);
    setDropdownOpen(false);
    navigate('/login');
  };

  const handleGoogleSuccess = (credentialResponse) => {
    try {
      const decoded = jwtDecode(credentialResponse.credential);
      const userObj = {
        email: decoded.email,
        name: decoded.name || decoded.given_name || decoded.email,
        picture: decoded.picture
      };
      localStorage.setItem('user', JSON.stringify(userObj));
      setUser(userObj);
      navigate('/projects');
    } catch (e) {
      alert('Failed to decode Google token.');
    }
  };

  const handleGoogleError = () => {
    alert('Google login failed');
  };

  return (
    <div className="projects-business-bg">
      <header className="projects-business-header">
        <div className="projects-header-left">
          <img src={indusLogo} alt="Indus AI Logo" className="projects-logo" />
          <span className="projects-title">IndusAI Projects</span>
        </div>
        <div className="projects-user-menu">
          {user ? (
            <div className="user-menu-wrapper">
              <span className="welcome-message">Welcome, <b>{user.name}</b></span>
              <div className="user-avatar-dropdown" ref={dropdownRef}>
                <button
                  className="user-avatar-btn"
                  onClick={() => setDropdownOpen((open) => !open)}
                  aria-label="User menu"
                >
                  {user.picture ? (
                    <img src={user.picture} alt="avatar" className="user-avatar-img" />
                  ) : (
                    <FaUserCircle size={32} />
                  )}
                </button>
                {dropdownOpen && (
                  <div className="user-dropdown-content">
                    <button className="user-dropdown-btn" onClick={handleUser}><FaUserCircle /> User Info</button>
                    <button className="user-dropdown-btn" onClick={handleProfile}><FaUserEdit /> Profile</button>
                    <button className="user-dropdown-btn" onClick={handleLogout}><FaSignOutAlt /> Logout</button>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <GoogleLogin
              onSuccess={handleGoogleSuccess}
              onError={handleGoogleError}
              useOneTap
              width="240"
              text="continue_with"
              shape="pill"
              logo_alignment="center"
            />
          )}
        </div>
      </header>
      <main className="projects-content">
        <div className="projects-list-grid">
          {projects.length === 0 ? (
            <div className="no-projects-message">No projects found or you are not authorized.</div>
          ) : (
            projects.map((project) => (
              <div className="project-card" key={project.id}>
                <div className="project-card-title">{project.name}</div>
                <div className="project-card-desc">{project.description}</div>
                <div className="project-card-actions">
                  <button className="manage-btn" onClick={() => handleManage(project.id)}>
                    Manage
                  </button>
                  <button className="learn-more-btn">Learn more</button>
                </div>
              </div>
            ))
          )}
        </div>
      </main>
    </div>
  );
}

export default Projects; 