import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { FaArrowLeft, FaCalendarAlt, FaBook, FaSpinner, FaExclamationTriangle } from 'react-icons/fa';
import { coursesAPI } from '../services/api';
import FormFiller from '../components/FormFiller';
import './StudentDashboard.css';

const StudentCourseDetail = () => {
  const { id } = useParams();
  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionMessage, setActionMessage] = useState('');
  const [showFormFiller, setShowFormFiller] = useState(false);
  const [currentFormId, setCurrentFormId] = useState(null);
  const activeFormId = course?.formId
    ? (typeof course.formId === 'object'
        ? (course.formId.isActive === false ? null : course.formId._id)
        : course.formId)
    : null;

  useEffect(() => {
    const loadCourse = async () => {
      try {
        setLoading(true);
        const data = await coursesAPI.getCourse(id);
        setCourse(data);
      } catch (err) {
        setError('Unable to load course details.');
        console.error('StudentCourseDetail load error:', err);
      } finally {
        setLoading(false);
      }
    };

    loadCourse();
  }, [id]);

  const requiresCourseFormCompletion = (err) => {
    const message = (err?.message || '').toLowerCase();
    return message.includes('complete the course form before enrolling');
  };

  const handleEnroll = async () => {
    try {
      setActionMessage('');
      setError('');
      const updated = await coursesAPI.enrollCourse(id);
      setCourse(updated);
      setActionMessage('Enrollment successful.');
    } catch (err) {
      if (activeFormId && requiresCourseFormCompletion(err)) {
        setCurrentFormId(activeFormId);
        setShowFormFiller(true);
        return;
      }

      setError(err.message || 'Failed to enroll in this course.');
      console.error('StudentCourseDetail enroll error:', err);
    }
  };

  const handleFormSubmit = async () => {
    try {
      const updated = await coursesAPI.enrollCourse(id);
      setCourse(updated);
      setActionMessage('Enrollment successful.');
    } catch (err) {
      setError(err.message || 'Failed to complete enrollment after form submission.');
      console.error('StudentCourseDetail enroll error:', err);
    } finally {
      setShowFormFiller(false);
      setCurrentFormId(null);
    }
  };

  const handleFormClose = () => {
    setShowFormFiller(false);
    setCurrentFormId(null);
  };

  if (loading) {
    return (
      <div className="dashboard">
        <div className="main">
          <div className="content">
            <p className="info-panel"><FaSpinner className="spin-icon" /> Loading course details...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard">
      <div className="main">
        <header className="topbar">
          <div className="welcome">
            <FaBook style={{ marginRight: '10px' }} /> Course Detail
          </div>
          <Link className="logout" to="/student-dashboard">
            <FaArrowLeft style={{ marginRight: '6px' }} /> Back to Dashboard
          </Link>
        </header>

        <main className="content">
          {error && (
            <div className="error-message">
              <FaExclamationTriangle style={{ marginRight: '8px' }} /> {error}
            </div>
          )}
          {actionMessage && <div className="success-message">{actionMessage}</div>}
          {course ? (
            <article className="detail-panel">
              <div className="section-heading">
                <h2>{course.title}</h2>
                <span>{course.code}</span>
              </div>

              <p className="detail-description">{course.description || 'No description available.'}</p>

              <div className="detail-meta">
                <div><FaBook /> <strong>Instructor:</strong> {course.instructor}</div>
                <div><FaCalendarAlt /> <strong>Semester:</strong> {course.semester} {course.year}</div>
                <div><strong>Credits:</strong> {course.credits}</div>
                <div><strong>Capacity:</strong> {course.enrolledStudents?.length || 0}/{course.maxStudents}</div>
              </div>
              {activeFormId ? (
                <p className="muted-text">Enrollment se pehle custom form fill karna hoga.</p>
              ) : null}

              <button
                type="button"
                className="login-button action-button"
                onClick={handleEnroll}
              >
                Enroll in Course
              </button>
            </article>
          ) : (
            <p className="muted-text">Course information was not found.</p>
          )}
        </main>

        {showFormFiller && currentFormId && (
          <FormFiller
            formId={currentFormId}
            title={`Registration Form for ${course?.title}`}
            onSubmit={handleFormSubmit}
            onClose={handleFormClose}
          />
        )}
      </div>
    </div>
  );
};

export default StudentCourseDetail;
