import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  FaEnvelope,
  FaLock,
  FaShieldAlt,
  FaArrowRight,
  FaUserSecret,
  FaGraduationCap,
} from 'react-icons/fa';
import { authAPI } from '../services/api';

const AdminLogin = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('token');
    const role = localStorage.getItem('role');
    const sessionType = localStorage.getItem('sessionType');

    if (token && role === 'admin' && sessionType === 'admin') {
      navigate('/admin/portal');
    }
  }, [navigate]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const response = await authAPI.adminLogin({ email, password });

      localStorage.setItem('token', response.token);
      localStorage.setItem('role', response.role);
      localStorage.setItem('sessionType', 'admin');
      localStorage.setItem(
        'user',
        JSON.stringify({
          _id: response._id,
          name: response.name,
          email: response.email,
          role: response.role,
        })
      );

      navigate('/admin/portal');
    } catch (err) {
      setError(err.message || 'Unable to access the admin control room.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="page-wrapper">
      <div className="glass login-container" style={{ padding: '40px', width: '100%', maxWidth: '480px' }}>
        <div className="login-header">
          <div className="logo-section">
            <FaGraduationCap className="logo-icon" />
            <h1>College Event Registration & Management System</h1>
          </div>
          <h2>Secure Admin Route</h2>
          <p style={{ marginTop: '12px', color: '#475569', lineHeight: 1.6 }}>
            This route is reserved for platform administration only. Student-facing UI does not expose it.
          </p>
        </div>

        <div
          style={{
            display: 'grid',
            gap: '12px',
            padding: '16px',
            marginBottom: '24px',
            borderRadius: '14px',
            background: 'linear-gradient(135deg, rgba(102, 126, 234, 0.12) 0%, rgba(118, 75, 162, 0.12) 100%)',
            border: '1px solid rgba(102, 126, 234, 0.18)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#312e81', fontWeight: 700 }}>
            <FaShieldAlt />
            Admin access only
          </div>
          <div style={{ color: '#475569', fontSize: '0.95rem' }}>
            Use the dedicated admin credentials to enter the control room.
          </div>
        </div>

        <form onSubmit={handleSubmit} className="login-form">
          {error ? (
            <p className="error-message" style={{ textAlign: 'center', marginBottom: '20px' }}>
              {error}
            </p>
          ) : null}

          <div className="form-group">
            <label className="form-label">Admin Email</label>
            <div className="input-group">
              <FaEnvelope className="input-icon" />
              <input
                type="email"
                placeholder="Enter admin email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className="form-input"
                disabled={isLoading}
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Password</label>
            <div className="input-group">
              <FaLock className="input-icon" />
              <input
                type="password"
                placeholder="Enter admin password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="form-input"
                disabled={isLoading}
              />
            </div>
          </div>

          <button type="submit" className="login-button" disabled={isLoading}>
            <FaUserSecret className="button-icon" />
            {isLoading ? 'Authorizing...' : 'Enter Admin Panel'}
          </button>
        </form>

        <div className="login-footer">
          <p>
            Student sign in is available on <Link to="/login" className="register-link">regular login</Link>.
          </p>
          <p style={{ marginTop: '12px', color: '#64748b', fontSize: '0.9rem' }}>
            Secure route: <strong>/admin</strong> <FaArrowRight style={{ marginLeft: '6px', fontSize: '0.75rem' }} />
          </p>
        </div>
      </div>
    </div>
  );
};

export default AdminLogin;
