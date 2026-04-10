import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Login from './pages/Login';
import Register from './pages/Register';
import StudentDashboard from './pages/StudentDashboard';
import AdminDashboard from './pages/AdminDashboard';
import AdminCourseDetail from './pages/AdminCourseDetail';
import AdminEventDetail from './pages/AdminEventDetail';
import StudentCourseDetail from './pages/StudentCourseDetail';
import StudentEventDetail from './pages/StudentEventDetail';
import AdminLogin from './pages/AdminLogin';
import ProtectedRoute from './components/ProtectedRoute';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/admin" element={<AdminLogin />} />

        <Route
          path="/student-dashboard"
          element={
            <ProtectedRoute allowedRoles={['student']}>
              <StudentDashboard />
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin/portal"
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <AdminDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/student-dashboard/course/:id"
          element={
            <ProtectedRoute allowedRoles={['student']}>
              <StudentCourseDetail />
            </ProtectedRoute>
          }
        />
        <Route
          path="/student-dashboard/event/:id"
          element={
            <ProtectedRoute allowedRoles={['student']}>
              <StudentEventDetail />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/course/:id"
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <AdminCourseDetail />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/event/:id"
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <AdminEventDetail />
            </ProtectedRoute>
          }
        />
      </Routes>
    </Router>
  );
}

export default App;
