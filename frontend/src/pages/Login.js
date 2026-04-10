import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FaUser, FaLock, FaSignInAlt, FaGraduationCap } from 'react-icons/fa';
import { authAPI } from '../services/api';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('token');
    const storedRole = localStorage.getItem('role');
    const sessionType = localStorage.getItem('sessionType');

    if (token && storedRole === 'student') {
      navigate('/student-dashboard');
    }

    if (token && storedRole === 'admin' && sessionType === 'admin') {
      navigate('/admin/portal');
    }

    if (token && storedRole === 'admin' && sessionType !== 'admin') {
      localStorage.removeItem('token');
      localStorage.removeItem('role');
      localStorage.removeItem('user');
      localStorage.removeItem('sessionType');
    }
  }, [navigate]);

  const validateForm = () => {
    const newErrors = {};
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email) {
      newErrors.email = 'Email is required';
    } else if (!emailRegex.test(email)) {
      newErrors.email = 'Please enter a valid email address';
    }
    if (!password) {
      newErrors.password = 'Password is required';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsLoading(true);
    try {
      const response = await authAPI.login({ email, password });

      if (response.role !== 'student') {
        throw new Error('Admin login is available only on the secure admin route.');
      }

      // Store token and user info
      localStorage.setItem('token', response.token);
      localStorage.setItem('role', response.role);
      localStorage.setItem('sessionType', 'student');
      localStorage.setItem('user', JSON.stringify({
        _id: response._id,
        name: response.name,
        email: response.email,
        role: response.role
      }));

      navigate('/student-dashboard');
    } catch (error) {
      setErrors({ general: error.message });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="page-wrapper">
      <div className="glass login-container" style={{ padding: '40px', width: '100%', maxWidth: '450px' }}>
        <div className="login-header">
          <div className="logo-section">
            <FaGraduationCap className="logo-icon" />
            <h1>College Event Registration & Management System</h1>
          </div>
          <h2>Sign In to Your Account</h2>
        </div>

        <form onSubmit={handleLogin} className="login-form">
          {errors.general && <p className="error-message" style={{ textAlign: 'center', marginBottom: '20px' }}>{errors.general}</p>}

          <div className="form-group">
            <label className="form-label">Email Address</label>
            <div className="input-group">
              <FaUser className="input-icon" />
              <input
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="form-input"
                disabled={isLoading}
              />
            </div>
            {errors.email && <p className="error-message">{errors.email}</p>}
          </div>

          <div className="form-group">
            <label className="form-label">Password</label>
            <div className="input-group">
              <FaLock className="input-icon" />
              <input
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="form-input"
                disabled={isLoading}
              />
            </div>
            {errors.password && <p className="error-message">{errors.password}</p>}
          </div>

          <button type="submit" className="login-button" disabled={isLoading}>
            <FaSignInAlt className="button-icon" />
            {isLoading ? 'Signing In...' : 'Sign In'}
          </button>
        </form>

        <div className="login-footer">
          <p>Don't have an account? <Link to="/register" className="register-link">Register here</Link></p>
        </div>
      </div>
    </div>
  );
};

export default Login;
