import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './ObjectionHandling.css';

function ObjectionHandling() {
  const [project, setProject] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    setProject({ id: 'objection-handling', name: 'Objection Handling', description: 'Objection Handling project description' });
  }, []);

  if (!project) return <div className="objection-loading">Loading...</div>;

  return (
    <div className="objection-container">
      <button className="back-btn" onClick={() => navigate('/')}>Back to Projects</button>
      <h2 className="objection-title">{project.name}</h2>
      <p className="objection-description">{project.description}</p>
      <div className="objection-placeholder">Objection Handling project features coming soon...</div>
    </div>
  );
}

export default ObjectionHandling; 