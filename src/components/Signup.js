import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import './AuthForm.css';
import indusLogo from '../assets/indusai-logo.png';
import { GoogleLogin } from '@react-oauth/google';
import { jwtDecode } from 'jwt-decode';
import { register, googleLogin } from "../api";

function Signup() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess(false);
    try {
      await register({ username, password });
      setSuccess(true);
      setTimeout(() => navigate("/login"), 1500);
    } catch (err) {
      setError("Registration failed: " + err.message);
    }
  };

  const handleGoogleSuccess = async (credentialResponse) => {
    try {
      const decoded = jwtDecode(credentialResponse.credential);
      const data = await googleLogin(credentialResponse.credential);
      localStorage.setItem('access_token', data.access_token);
      localStorage.setItem('user', JSON.stringify({
        email: decoded.email,
        name: decoded.name || decoded.given_name || decoded.email,
        picture: decoded.picture
      }));
      navigate('/projects');
    } catch (e) {
      setError('Google signup failed: ' + (e.message || 'Unknown error'));
    }
  };

  const handleGoogleError = () => {
    setError('Google signup failed');
  };

  return (
    <div className="auth-bg">
      <form className="auth-card" onSubmit={handleSubmit}>
        <img src={indusLogo} alt="Indus AI Logo" className="indus-logo-auth" />
        <div className="auth-title">Sign up for Indus AI</div>
        <input value={username} onChange={e => setUsername(e.target.value)} placeholder="Username" />
        <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Password" />
        <button type="submit">Register</button>
        <div className="auth-or">or</div>
        <GoogleLogin
          onSuccess={handleGoogleSuccess}
          onError={handleGoogleError}
          useOneTap
          width="240"
          text="continue_with"
          shape="pill"
          logo_alignment="center"
        />
        {error && <div className="auth-error">{error}</div>}
        {success && <div className="auth-success">Registration successful! Please login.</div>}
        <div className="auth-link">Already have an account? <Link to="/login">Sign in</Link></div>
      </form>
    </div>
  );
}

export default Signup; 