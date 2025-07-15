import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import './AuthForm.css';
import indusLogo from '../assets/indusai-logo.png';
import { GoogleLogin } from '@react-oauth/google';
import { jwtDecode } from 'jwt-decode';
import { login, googleLogin, grantAllProjectsToAdmins } from "../api";

function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    try {
      const data = await login({ username, password });
      // Check if admin
      const userEmail = username;
      if (["sachin2000k@gmail.com", "tummapudianurag@gmail.com"].includes(userEmail)) {
        try {
          await grantAllProjectsToAdmins();
        } catch (err) {
          setError("Admin grant failed: " + err.message);
          return;
        }
      }
      navigate("/projects");
    } catch (err) {
      setError("Login failed: " + err.message);
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
      // Check if admin
      if (["sachin2000k@gmail.com", "tummapudianurag@gmail.com"].includes(decoded.email)) {
        try {
          await grantAllProjectsToAdmins();
        } catch (err) {
          setError('Admin grant failed: ' + (err.message || 'Unknown error'));
          return;
        }
      }
      navigate('/projects');
    } catch (e) {
      setError('Google login failed: ' + (e.message || 'Unknown error'));
    }
  };

  const handleGoogleError = () => {
    setError('Google login failed');
  };

  return (
    <div className="auth-bg">
      <form className="auth-card" onSubmit={handleSubmit}>
        <img src={indusLogo} alt="Indus AI Logo" className="indus-logo-auth" />
        <div className="auth-title">Sign in to Indus AI</div>
        <input value={username} onChange={e => setUsername(e.target.value)} placeholder="Username" />
        <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Password" />
        <button type="submit">Login</button>
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
        <div className="auth-link">Don't have an account? <Link to="/signup">Sign up</Link></div>
      </form>
    </div>
  );
}

export default Login; 