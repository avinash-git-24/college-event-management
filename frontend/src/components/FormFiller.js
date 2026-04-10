import React, { useEffect, useMemo, useState } from 'react';
import { FaCheck, FaTimes } from 'react-icons/fa';
import { formsAPI } from '../services/api';
import { OPTION_FIELD_TYPES, validateResponses } from '../utils/formUtils';

const FormFiller = ({ formId, onSubmit, onClose, title }) => {
  const [form, setForm] = useState(null);
  const [responses, setResponses] = useState({});
  const [fieldErrors, setFieldErrors] = useState({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadForm = async () => {
      try {
        setLoading(true);
        setError('');

        const formData = await formsAPI.getFormById(formId);
        setForm(formData);

        const initialResponses = {};
        (formData.fields || []).forEach((field) => {
          initialResponses[field.name] = field.type === 'checkbox' ? false : '';
        });
        setResponses(initialResponses);
        setFieldErrors({});
      } catch (err) {
        setError(err.message || 'Failed to load form.');
        console.error('Error loading form:', err);
      } finally {
        setLoading(false);
      }
    };

    loadForm();
  }, [formId]);

  const activeFieldCount = useMemo(() => form?.fields?.length || 0, [form]);

  const handleInputChange = (fieldName, value) => {
    setResponses((current) => ({
      ...current,
      [fieldName]: value,
    }));

    setFieldErrors((current) => {
      if (!current[fieldName]) {
        return current;
      }

      const nextErrors = { ...current };
      delete nextErrors[fieldName];
      return nextErrors;
    });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!form) {
      return;
    }

    const validation = validateResponses(form.fields || [], responses);
    if (!validation.isValid) {
      setFieldErrors(validation.errors);
      setError('Please fix the highlighted fields before submitting.');
      return;
    }

    try {
      setSubmitting(true);
      setError('');
      await formsAPI.submitFormResponse(formId, validation.normalizedResponses);
      onSubmit?.();
    } catch (err) {
      setError(err.message || 'Failed to submit form.');
      console.error('Error submitting form:', err);
    } finally {
      setSubmitting(false);
    }
  };

  const renderField = (field) => {
    const value = responses[field.name];

    if (field.type === 'textarea') {
      return (
        <textarea
          value={value || ''}
          onChange={(event) => handleInputChange(field.name, event.target.value)}
          placeholder={field.placeholder}
          className={`form-textarea ${fieldErrors[field.name] ? 'has-error' : ''}`}
          rows={4}
        />
      );
    }

    if (field.type === 'checkbox') {
      return (
        <label className="checkbox-option">
          <input
            type="checkbox"
            checked={Boolean(value)}
            onChange={(event) => handleInputChange(field.name, event.target.checked)}
          />
          {field.placeholder || `I confirm ${field.label.toLowerCase()}`}
        </label>
      );
    }

    if (OPTION_FIELD_TYPES.includes(field.type)) {
      if (field.type === 'select') {
        return (
          <select
            value={value || ''}
            onChange={(event) => handleInputChange(field.name, event.target.value)}
            className={`form-select ${fieldErrors[field.name] ? 'has-error' : ''}`}
          >
            <option value="">Select an option</option>
            {(field.options || []).map((option) => (
              <option key={`${field.name}-${option}`} value={option}>
                {option}
              </option>
            ))}
          </select>
        );
      }

      return (
        <div className="radio-group">
          {(field.options || []).map((option) => (
            <label key={`${field.name}-${option}`} className="radio-option">
              <input
                type="radio"
                name={field.name}
                value={option}
                checked={value === option}
                onChange={(event) => handleInputChange(field.name, event.target.value)}
              />
              {option}
            </label>
          ))}
        </div>
      );
    }

    return (
      <input
        type={field.type || 'text'}
        value={value ?? ''}
        onChange={(event) => handleInputChange(field.name, event.target.value)}
        placeholder={field.placeholder}
        className={`form-input ${fieldErrors[field.name] ? 'has-error' : ''}`}
      />
    );
  };

  if (loading) {
    return (
      <div className="form-filler-overlay">
        <div className="form-filler-modal">
          <div className="form-loading">Loading form...</div>
        </div>
      </div>
    );
  }

  if (!form) {
    return (
      <div className="form-filler-overlay">
        <div className="form-filler-modal">
          <div className="form-error">{error || 'Form not found.'}</div>
          <button type="button" onClick={onClose} className="form-close-btn">
            <FaTimes />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="form-filler-overlay">
      <div className="form-filler-modal">
        <div className="form-header">
          <div>
            <h2>{title || form.title}</h2>
            <p className="form-meta-text">{activeFieldCount} field{activeFieldCount === 1 ? '' : 's'} to complete</p>
          </div>
          <button type="button" onClick={onClose} className="form-close-btn">
            <FaTimes />
          </button>
        </div>

        {form.description ? <p className="form-description">{form.description}</p> : null}

        <form onSubmit={handleSubmit} className="form-content">
          {(form.fields || []).map((field) => (
            <div key={field.name} className="form-field">
              <label className="field-label">
                {field.label}
                {field.required ? <span className="required">*</span> : null}
              </label>
              {renderField(field)}
              {fieldErrors[field.name] ? <div className="field-error">{fieldErrors[field.name]}</div> : null}
            </div>
          ))}

          {error ? <div className="form-error">{error}</div> : null}

          <div className="form-actions">
            <button type="button" onClick={onClose} className="cancel-btn">
              Cancel
            </button>
            <button type="submit" disabled={submitting} className="submit-btn">
              {submitting ? 'Submitting...' : 'Submit'}
              {!submitting ? <FaCheck /> : null}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default FormFiller;
