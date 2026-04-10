import React from 'react';
import { formatResponseValue } from '../utils/formUtils';

const FormResponsesViewer = ({ form, responses, loading, emptyMessage = 'No form responses yet.' }) => {
  if (!form) {
    return <p className="muted-text">No form configured yet.</p>;
  }

  if (loading) {
    return <p className="muted-text">Loading responses...</p>;
  }

  if (!responses?.length) {
    return <p className="muted-text">{emptyMessage}</p>;
  }

  return (
    <div className="admin-feed response-feed">
      {responses.map((response) => (
        <div key={response._id} className="admin-feed-item response-card">
          <div className="response-card-header">
            <div>
              <strong>{response.userId?.name || response.userId?.email || 'Unknown user'}</strong>
              <span>{response.userId?.email || 'Email unavailable'}</span>
            </div>
            <span>{new Date(response.submittedAt).toLocaleString()}</span>
          </div>

          <div className="response-answer-grid">
            {form.fields.map((field) => (
              <div key={`${response._id}-${field.name}`} className="response-answer-item">
                <strong>{field.label}</strong>
                <span>{formatResponseValue(response.responses?.[field.name])}</span>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};

export default FormResponsesViewer;
