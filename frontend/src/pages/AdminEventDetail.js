import React, { useCallback, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { FaArrowLeft, FaCheckCircle, FaExclamationTriangle, FaSpinner } from 'react-icons/fa';
import FormBuilder from '../components/FormBuilder';
import FormResponsesViewer from '../components/FormResponsesViewer';
import { eventsAPI, formsAPI } from '../services/api';
import { createEmptyFormConfig, validateFormBuilderConfig } from '../utils/formUtils';
import './AdminDashboard.css';

const createDefaultEventDraft = () => ({
  title: '',
  description: '',
  date: '',
  time: '10:00 AM',
  location: '',
  organizer: 'Admin Office',
  category: 'Academic',
  maxAttendees: 100,
  status: 'Upcoming',
});

const AdminEventDetail = () => {
  const { id } = useParams();
  const [eventItem, setEventItem] = useState(null);
  const [draft, setDraft] = useState(createDefaultEventDraft());
  const [formConfig, setFormConfig] = useState(createEmptyFormConfig());
  const [formEntity, setFormEntity] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [saved, setSaved] = useState('');
  const [formResponses, setFormResponses] = useState([]);
  const [formResponsesLoading, setFormResponsesLoading] = useState(false);

  const loadEventDetail = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const data = await eventsAPI.getEvent(id);
      setEventItem(data);
      setDraft({
        _id: data._id,
        title: data.title || '',
        description: data.description || '',
        date: data.date ? new Date(data.date).toISOString().split('T')[0] : '',
        time: data.time || '10:00 AM',
        location: data.location || '',
        organizer: data.organizer || 'Admin Office',
        category: data.category || 'Academic',
        maxAttendees: Number(data.maxAttendees) || 100,
        status: data.status || 'Upcoming',
      });

      const formRef = data.formId?._id || data.formId;
      if (formRef) {
        try {
          const form = await formsAPI.getFormById(formRef);
          setFormEntity(form);
          setFormConfig({
            enabled: form.isActive !== false,
            title: form.title || '',
            description: form.description || '',
            fields: form.fields || [],
          });

          setFormResponsesLoading(true);
          const responses = await formsAPI.getFormResponses(formRef);
          setFormResponses(responses);
        } catch (formError) {
          console.error('AdminEventDetail form load error:', formError);
          setFormEntity(null);
          setFormConfig(createEmptyFormConfig());
          setFormResponses([]);
        } finally {
          setFormResponsesLoading(false);
        }
      } else {
        setFormResponsesLoading(false);
        setFormEntity(null);
        setFormConfig(createEmptyFormConfig());
        setFormResponses([]);
      }
    } catch (err) {
      setFormResponsesLoading(false);
      setError('Unable to load event details.');
      console.error('AdminEventDetail load error:', err);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadEventDetail();
  }, [loadEventDetail]);

  const handleSave = async (event) => {
    event.preventDefault();

    const formValidation = validateFormBuilderConfig(
      formConfig,
      `${draft.title || 'Event'} Registration Form`
    );

    if (!formValidation.isValid) {
      setError(formValidation.message || 'Event form configuration is invalid.');
      setSaved('');
      return;
    }

    try {
      await eventsAPI.updateEvent(id, draft);

      if (formValidation.normalizedConfig.enabled) {
        await formsAPI.createOrUpdateForm('event', id, {
          title: formValidation.normalizedConfig.title,
          description: formValidation.normalizedConfig.description,
          fields: formValidation.normalizedConfig.fields,
        });
      } else if (eventItem?.formId) {
        await formsAPI.deleteForm('event', id);
      }

      await loadEventDetail();
      setSaved('Event saved successfully.');
      setError('');
    } catch (err) {
      setError(err.message || 'Unable to save event.');
      setSaved('');
      console.error('AdminEventDetail save error:', err);
    }
  };

  if (loading) {
    return (
      <div className="admin-shell">
        <div className="info-panel">
          <FaSpinner className="spin-icon" /> Loading event details...
        </div>
      </div>
    );
  }

  return (
    <div className="admin-dashboard">
      <div className="page-topbar admin-topbar">
        <Link to="/admin/portal" className="ghost-btn">
          <FaArrowLeft /> Back to Admin Portal
        </Link>
        <h1>Event Detail</h1>
      </div>

      <main className="content admin-shell">
        <div className="details-layout admin-detail-grid">
          <section className="info-panel">
            <div className="section-heading">
              <h2>{eventItem?.title || 'Event Detail'}</h2>
              <span>Detailed event page for admin review, forms, and responses</span>
            </div>
            {error ? (
              <div className="error-message admin-message">
                <FaExclamationTriangle /> {error}
              </div>
            ) : null}
            {saved ? (
              <div className="success-message admin-message">
                <FaCheckCircle /> {saved}
              </div>
            ) : null}

            <div className="detail-summary">
              <div className="detail-summary-row">
                <strong>{eventItem.title}</strong>
                <span>{eventItem.category}</span>
              </div>
              <p>{eventItem.description}</p>
              <div className="detail-summary-grid">
                <div><strong>Date</strong><span>{new Date(eventItem.date).toDateString()}</span></div>
                <div><strong>Time</strong><span>{eventItem.time}</span></div>
                <div><strong>Location</strong><span>{eventItem.location}</span></div>
                <div><strong>Status</strong><span>{eventItem.status}</span></div>
                <div><strong>Organizer</strong><span>{eventItem.organizer}</span></div>
                <div><strong>Registrations</strong><span>{eventItem.registeredAttendees?.length || 0}/{eventItem.maxAttendees}</span></div>
                <div><strong>Form Status</strong><span>{formEntity ? (formEntity.isActive === false ? 'Archived' : 'Active') : 'Not configured'}</span></div>
                <div><strong>Responses</strong><span>{formResponses.length}</span></div>
              </div>
            </div>

            <div className="section-heading">
              <h2>Registered Attendees</h2>
              <span>{eventItem.registeredAttendees?.length || 0} attendees</span>
            </div>
            <div className="admin-feed">
              {(eventItem.registeredAttendees || []).map((attendee) => (
                <div key={attendee._id || attendee.email} className="admin-feed-item">
                  <div>
                    <strong>{attendee.name || attendee.email}</strong>
                    <span>{attendee.email || 'No email available'}</span>
                  </div>
                </div>
              ))}
              {!eventItem.registeredAttendees?.length ? <p className="muted-text">No attendees registered yet.</p> : null}
            </div>

            <div className="section-heading">
              <h2>Registration Form Responses</h2>
              <span>{formResponses.length} responses</span>
            </div>
            <FormResponsesViewer
              form={formEntity}
              responses={formResponses}
              loading={formResponsesLoading}
              emptyMessage="No event form submissions yet."
            />
          </section>

          <aside className="detail-panel admin-form-panel">
            <div className="section-heading">
              <h2>Edit Event</h2>
              <span>Update event details and attendee form requirements here</span>
            </div>
            <form className="admin-form" onSubmit={handleSave}>
              <label>Title<input value={draft.title} onChange={(event) => setDraft((current) => ({ ...current, title: event.target.value }))} /></label>
              <label>Description<textarea value={draft.description} onChange={(event) => setDraft((current) => ({ ...current, description: event.target.value }))} /></label>
              <div className="admin-form-split">
                <label>Date<input type="date" value={draft.date} onChange={(event) => setDraft((current) => ({ ...current, date: event.target.value }))} /></label>
                <label>Time<input value={draft.time} onChange={(event) => setDraft((current) => ({ ...current, time: event.target.value }))} /></label>
              </div>
              <label>Location<input value={draft.location} onChange={(event) => setDraft((current) => ({ ...current, location: event.target.value }))} /></label>
              <label>Organizer<input value={draft.organizer} onChange={(event) => setDraft((current) => ({ ...current, organizer: event.target.value }))} /></label>
              <div className="admin-form-split">
                <label>Category<select value={draft.category} onChange={(event) => setDraft((current) => ({ ...current, category: event.target.value }))}>
                  <option value="Academic">Academic</option>
                  <option value="Sports">Sports</option>
                  <option value="Cultural">Cultural</option>
                  <option value="Technical">Technical</option>
                  <option value="Other">Other</option>
                </select></label>
                <label>Status<select value={draft.status} onChange={(event) => setDraft((current) => ({ ...current, status: event.target.value }))}>
                  <option value="Upcoming">Upcoming</option>
                  <option value="Ongoing">Ongoing</option>
                  <option value="Completed">Completed</option>
                  <option value="Cancelled">Cancelled</option>
                </select></label>
              </div>
              <label>Capacity<input type="number" min="1" value={draft.maxAttendees} onChange={(event) => setDraft((current) => ({ ...current, maxAttendees: Number(event.target.value) }))} /></label>

              <FormBuilder
                config={formConfig}
                onChange={setFormConfig}
                itemLabel="event registration"
              />

              <button className="edit-btn" type="submit"><FaCheckCircle /> Save Event</button>
            </form>
          </aside>
        </div>
      </main>
    </div>
  );
};

export default AdminEventDetail;
