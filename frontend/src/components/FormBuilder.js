import React from 'react';
import { FaPlus, FaTrash } from 'react-icons/fa';
import {
  FORM_FIELD_TYPES,
  OPTION_FIELD_TYPES,
  LENGTH_VALIDATION_TYPES,
  buildFieldName,
  createEmptyFormField,
} from '../utils/formUtils';

const FormBuilder = ({ config, onChange, itemLabel = 'registration' }) => {
  const safeConfig = config || { enabled: false, title: '', description: '', fields: [] };

  const updateConfig = (updates) => {
    onChange({
      ...safeConfig,
      ...updates,
    });
  };

  const updateField = (index, updates) => {
    updateConfig({
      fields: safeConfig.fields.map((field, fieldIndex) =>
        fieldIndex === index
          ? {
              ...field,
              ...updates,
            }
          : field
      ),
    });
  };

  const addField = () => {
    updateConfig({
      enabled: true,
      fields: [...safeConfig.fields, createEmptyFormField()],
    });
  };

  const removeField = (index) => {
    updateConfig({
      fields: safeConfig.fields.filter((_, fieldIndex) => fieldIndex !== index),
    });
  };

  const addOption = (index) => {
    updateField(index, {
      options: [...(safeConfig.fields[index].options || []), ''],
    });
  };

  const updateOption = (index, optionIndex, value) => {
    updateField(index, {
      options: (safeConfig.fields[index].options || []).map((option, currentIndex) =>
        currentIndex === optionIndex ? value : option
      ),
    });
  };

  const removeOption = (index, optionIndex) => {
    updateField(index, {
      options: (safeConfig.fields[index].options || []).filter((_, currentIndex) => currentIndex !== optionIndex),
    });
  };

  return (
    <div className="form-builder-section">
      <div className="form-builder-topbar">
        <div>
          <h3>Registration Form Setup</h3>
          <p className="form-builder-description">
            Admin decide kar sakta hai student se {itemLabel} ke liye kaun si details mangni hain.
          </p>
        </div>
        <label className="builder-toggle">
          <input
            type="checkbox"
            checked={Boolean(safeConfig.enabled)}
            onChange={(event) => updateConfig({ enabled: event.target.checked })}
          />
          Enable Form
        </label>
      </div>

      {safeConfig.enabled ? (
        <>
          <div className="builder-meta-grid">
            <label>
              Form Title
              <input
                type="text"
                value={safeConfig.title || ''}
                onChange={(event) => updateConfig({ title: event.target.value })}
                placeholder="Registration Form"
              />
            </label>
            <label>
              Form Description
              <input
                type="text"
                value={safeConfig.description || ''}
                onChange={(event) => updateConfig({ description: event.target.value })}
                placeholder="Tell students what to fill here"
              />
            </label>
          </div>

          {safeConfig.fields.map((field, index) => (
            <div key={field.id || `${field.name}-${index}`} className="form-field-item">
              <div className="field-header field-header-wide">
                <input
                  type="text"
                  placeholder="Field label"
                  value={field.label || ''}
                  onChange={(event) =>
                    updateField(index, {
                      label: event.target.value,
                      name: buildFieldName(event.target.value, `field_${index + 1}`),
                    })
                  }
                />
                <select
                  value={field.type || 'text'}
                  onChange={(event) => updateField(index, { type: event.target.value, options: OPTION_FIELD_TYPES.includes(event.target.value) ? field.options || [''] : [] })}
                >
                  {FORM_FIELD_TYPES.map((typeOption) => (
                    <option key={typeOption.value} value={typeOption.value}>
                      {typeOption.label}
                    </option>
                  ))}
                </select>
                <label className="field-checkbox">
                  <input
                    type="checkbox"
                    checked={Boolean(field.required)}
                    onChange={(event) => updateField(index, { required: event.target.checked })}
                  />
                  Required
                </label>
                <button type="button" className="delete-btn inline-delete-btn" onClick={() => removeField(index)}>
                  <FaTrash />
                </button>
              </div>

              <div className="field-name-chip">Field key: {field.name || buildFieldName(field.label, `field_${index + 1}`)}</div>

              <div className="builder-meta-grid">
                <label>
                  Placeholder
                  <input
                    type="text"
                    value={field.placeholder || ''}
                    onChange={(event) => updateField(index, { placeholder: event.target.value })}
                    placeholder="Optional helper text"
                  />
                </label>

                {field.type === 'number' ? (
                  <div className="builder-inline-grid">
                    <label>
                      Min
                      <input
                        type="number"
                        value={field.validation?.min ?? ''}
                        onChange={(event) =>
                          updateField(index, {
                            validation: {
                              ...field.validation,
                              min: event.target.value,
                            },
                          })
                        }
                      />
                    </label>
                    <label>
                      Max
                      <input
                        type="number"
                        value={field.validation?.max ?? ''}
                        onChange={(event) =>
                          updateField(index, {
                            validation: {
                              ...field.validation,
                              max: event.target.value,
                            },
                          })
                        }
                      />
                    </label>
                  </div>
                ) : null}

                {LENGTH_VALIDATION_TYPES.includes(field.type) ? (
                  <div className="builder-inline-grid">
                    <label>
                      Min Length
                      <input
                        type="number"
                        min="0"
                        value={field.validation?.minLength ?? ''}
                        onChange={(event) =>
                          updateField(index, {
                            validation: {
                              ...field.validation,
                              minLength: event.target.value,
                            },
                          })
                        }
                      />
                    </label>
                    <label>
                      Max Length
                      <input
                        type="number"
                        min="0"
                        value={field.validation?.maxLength ?? ''}
                        onChange={(event) =>
                          updateField(index, {
                            validation: {
                              ...field.validation,
                              maxLength: event.target.value,
                            },
                          })
                        }
                      />
                    </label>
                  </div>
                ) : null}
              </div>

              {LENGTH_VALIDATION_TYPES.includes(field.type) ? (
                <label className="builder-pattern-field">
                  Validation Pattern
                  <input
                    type="text"
                    value={field.validation?.pattern || ''}
                    onChange={(event) =>
                      updateField(index, {
                        validation: {
                          ...field.validation,
                          pattern: event.target.value,
                        },
                      })
                    }
                    placeholder="Optional regex, e.g. ^[0-9]{10}$"
                  />
                </label>
              ) : null}

              {OPTION_FIELD_TYPES.includes(field.type) ? (
                <div className="field-options">
                  <label>Options</label>
                  {(field.options || []).map((option, optionIndex) => (
                    <div key={`${field.name || index}-option-${optionIndex}`} className="option-item">
                      <input
                        type="text"
                        value={option}
                        placeholder="Option value"
                        onChange={(event) => updateOption(index, optionIndex, event.target.value)}
                      />
                      <button type="button" className="ghost-btn compact-btn" onClick={() => removeOption(index, optionIndex)}>
                        <FaTrash />
                      </button>
                    </div>
                  ))}
                  <button type="button" className="ghost-btn" onClick={() => addOption(index)}>
                    Add Option
                  </button>
                </div>
              ) : null}
            </div>
          ))}

          <div className="admin-form-actions">
            <button type="button" className="ghost-btn" onClick={addField}>
              <FaPlus /> Add Form Field
            </button>
          </div>
        </>
      ) : (
        <p className="muted-text">Form disabled hai. Students bina extra form fill kiye register/enroll kar payenge.</p>
      )}
    </div>
  );
};

export default FormBuilder;
