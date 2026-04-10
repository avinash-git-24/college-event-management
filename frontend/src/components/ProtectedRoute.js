import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';

/**
 * Protects a route based on the expected role(s).
 * If the user is not logged in or has the wrong role, it redirects to /login.
 */
const ProtectedRoute = ({ children, allowedRoles }) => {
  const location = useLocation();
  const token = localStorage.getItem('token');
  const role = localStorage.getItem('role');
  const sessionType = localStorage.getItem('sessionType');

  if (!token) {
    // Not logged in
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (allowedRoles.includes('admin') && sessionType !== 'admin') {
    return <Navigate to="/admin" replace />;
  }

  if (!role || !allowedRoles.includes(role)) {
    // Wrong role
    return <Navigate to="/login" replace />;
  }

  return children;
};

export default ProtectedRoute;
