import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { GoogleLogin } from '@react-oauth/google';
import { jwtDecode } from 'jwt-decode';
import './AuthForm.css';
import indusLogo from '../assets/indusai-logo.png';

function Signup() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSignup = async (e) => {
    e.preventDefault();
    setError('');
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    const res = await fetch('http://localhost:8000/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json();
    if (data.success) {
      localStorage.setItem('user', JSON.stringify({ email }));
      navigate('/projects');
    } else {
      setError(data.error || 'Registration failed');
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
    setError('Google signup failed');
  };

  return (
    <div className="auth-bg">
      <form className="auth-card" onSubmit={handleSignup}>
        <img src={indusLogo} alt="Indus AI Logo" className="indus-logo-auth" />
        <div className="auth-title">Sign up for Indus AI</div>
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
        <input
          type="password"
          placeholder="Confirm Password"
          value={confirmPassword}
          onChange={e => setConfirmPassword(e.target.value)}
          required
        />
        <button type="submit">Sign Up</button>
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
        <div className="auth-link">Already have an account? <Link to="/login">Sign in</Link></div>
      </form>
    </div>
  );
}

export default Signup; 