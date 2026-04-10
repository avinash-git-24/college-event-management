import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { FaArrowLeft, FaCalendarAlt, FaClock, FaMapMarkerAlt, FaUsers, FaSpinner, FaExclamationTriangle } from 'react-icons/fa';
import { eventsAPI } from '../services/api';
import FormFiller from '../components/FormFiller';
import './StudentDashboard.css';

const StudentEventDetail = () => {
  const { id } = useParams();
  const [eventItem, setEventItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionMessage, setActionMessage] = useState('');
  const [showFormFiller, setShowFormFiller] = useState(false);
  const [currentFormId, setCurrentFormId] = useState(null);
  const activeFormId = eventItem?.formId
    ? (typeof eventItem.formId === 'object'
        ? (eventItem.formId.isActive === false ? null : eventItem.formId._id)
        : eventItem.formId)
    : null;

  useEffect(() => {
    const loadEvent = async () => {
      try {
        setLoading(true);
        const data = await eventsAPI.getEvent(id);
        setEventItem(data);
      } catch (err) {
        setError('Unable to load event details.');
        console.error('StudentEventDetail load error:', err);
      } finally {
        setLoading(false);
      }
    };

    loadEvent();
  }, [id]);

  const requiresEventFormCompletion = (err) => {
    const message = (err?.message || '').toLowerCase();
    return message.includes('complete the event form before registering');
  };

  const handleRegister = async () => {
    try {
      setError('');
      setActionMessage('');
      const updated = await eventsAPI.registerForEvent(id);
      setEventItem(updated);
      setActionMessage('Registration successful.');
    } catch (err) {
      if (activeFormId && requiresEventFormCompletion(err)) {
        setCurrentFormId(activeFormId);
        setShowFormFiller(true);
        return;
      }

      setError(err.message || 'Failed to register for this event.');
      console.error('StudentEventDetail register error:', err);
    }
  };

  const handleFormSubmit = async () => {
    try {
      const updated = await eventsAPI.registerForEvent(id);
      setEventItem(updated);
      setActionMessage('Registration successful.');
    } catch (err) {
      setError(err.message || 'Failed to complete registration after form submission.');
      console.error('StudentEventDetail register error:', err);
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
            <p className="info-panel"><FaSpinner className="spin-icon" /> Loading event details...</p>
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
            <FaCalendarAlt style={{ marginRight: '10px' }} /> Event Detail
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
          {eventItem ? (
            <article className="detail-panel">
              <div className="section-heading">
                <h2>{eventItem.title}</h2>
                <span>{eventItem.category}</span>
              </div>

              <p className="detail-description">{eventItem.description || 'No description available.'}</p>

              <div className="detail-meta">
                <div><FaCalendarAlt /> <strong>Date:</strong> {new Date(eventItem.date).toLocaleDateString()}</div>
                <div><FaClock /> <strong>Time:</strong> {eventItem.time}</div>
                <div><FaMapMarkerAlt /> <strong>Location:</strong> {eventItem.location}</div>
                <div><FaUsers /> <strong>Seats:</strong> {eventItem.registeredAttendees?.length || 0}/{eventItem.maxAttendees}</div>
                <div><strong>Organizer:</strong> {eventItem.organizer}</div>
                <div><strong>Status:</strong> {eventItem.status || 'Upcoming'}</div>
              </div>
              {activeFormId ? (
                <p className="muted-text">Event join karne se pehle registration form fill karna hoga.</p>
              ) : null}

              <button
                type="button"
                className="login-button action-button"
                onClick={handleRegister}
              >
                Join Event
              </button>
            </article>
          ) : (
            <p className="muted-text">Event information was not found.</p>
          )}
        </main>

        {showFormFiller && currentFormId && (
          <FormFiller
            formId={currentFormId}
            title={`Registration Form for ${eventItem?.title}`}
            onSubmit={handleFormSubmit}
            onClose={handleFormClose}
          />
        )}
      </div>
    </div>
  );
};

export default StudentEventDetail;
