import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import './AuthForm.css';
import indusLogo from '../assets/indusai-logo.png';
import { GoogleLogin } from '@react-oauth/google';
import { jwtDecode } from 'jwt-decode';

function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    const res = await fetch('http://localhost:8000/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json();
    if (data.success) {
      localStorage.setItem('user', JSON.stringify({ email }));
      navigate('/projects');
    } else {
      setError(data.error || 'Login failed');
    }
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
      navigate('/projects');
    } catch (e) {
      setError('Failed to decode Google token.');
    }
  };

  const handleGoogleError = () => {
    setError('Google login failed');
  };

  return (
    <div className="auth-bg">
      <form className="auth-card" onSubmit={handleLogin}>
        <img src={indusLogo} alt="Indus AI Logo" className="indus-logo-auth" />
        <div className="auth-title">Sign in to Indus AI</div>
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          required
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          required
        />
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