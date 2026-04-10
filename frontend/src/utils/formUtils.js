export const FORM_FIELD_TYPES = [
  { value: 'text', label: 'Text' },
  { value: 'email', label: 'Email' },
  { value: 'number', label: 'Number' },
  { value: 'date', label: 'Date' },
  { value: 'select', label: 'Select' },
  { value: 'textarea', label: 'Textarea' },
  { value: 'checkbox', label: 'Checkbox' },
  { value: 'radio', label: 'Radio' },
];

export const OPTION_FIELD_TYPES = ['select', 'radio'];
export const LENGTH_VALIDATION_TYPES = ['text', 'email', 'textarea'];

export const createEmptyFormConfig = () => ({
  enabled: false,
  title: '',
  description: '',
  fields: [],
});

export const buildFieldName = (label, fallback = 'field') => {
  const normalized = String(label || fallback)
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');

  return normalized || `${fallback}_${Date.now()}`;
};

export const createEmptyFormField = () => ({
  id: `field_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
  name: '',
  label: '',
  type: 'text',
  required: false,
  options: [],
  placeholder: '',
  validation: {
    min: '',
    max: '',
    minLength: '',
    maxLength: '',
    pattern: '',
  },
});

const parseNumericRule = (value) => {
  if (value === '' || value === undefined || value === null) {
    return undefined;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
};

const normalizeValidation = (validation = {}) => {
  const normalized = {
    min: parseNumericRule(validation.min),
    max: parseNumericRule(validation.max),
    minLength: parseNumericRule(validation.minLength),
    maxLength: parseNumericRule(validation.maxLength),
    pattern: String(validation.pattern || '').trim() || undefined,
  };

  if (
    normalized.min !== undefined &&
    normalized.max !== undefined &&
    normalized.min > normalized.max
  ) {
    throw new Error('Minimum value cannot be greater than maximum value.');
  }

  if (
    normalized.minLength !== undefined &&
    normalized.maxLength !== undefined &&
    normalized.minLength > normalized.maxLength
  ) {
    throw new Error('Minimum length cannot be greater than maximum length.');
  }

  return normalized;
};

export const normalizeFormField = (field = {}, index = 0) => {
  const label = String(field.label || '').trim();

  if (!label) {
    throw new Error(`Field ${index + 1} needs a label.`);
  }

  const type = String(field.type || 'text').trim();
  if (!FORM_FIELD_TYPES.some((item) => item.value === type)) {
    throw new Error(`"${label}" has an unsupported field type.`);
  }

  const options = OPTION_FIELD_TYPES.includes(type)
    ? [...new Set((field.options || []).map((option) => String(option || '').trim()).filter(Boolean))]
    : [];

  if (OPTION_FIELD_TYPES.includes(type) && options.length === 0) {
    throw new Error(`"${label}" needs at least one option.`);
  }

  return {
    name: buildFieldName(field.name || label, `field_${index + 1}`),
    label,
    type,
    required: Boolean(field.required),
    options,
    placeholder: String(field.placeholder || '').trim(),
    validation: normalizeValidation(field.validation || {}),
  };
};

export const normalizeFormFields = (fields = []) => {
  if (!Array.isArray(fields)) {
    throw new Error('Form fields must be an array.');
  }

  const normalizedFields = fields.map(normalizeFormField);
  const names = normalizedFields.map((field) => field.name);

  if (new Set(names).size !== names.length) {
    throw new Error('Each form field must have a unique label.');
  }

  return normalizedFields;
};

export const validateFormBuilderConfig = (config = {}, fallbackTitle = 'Registration Form') => {
  const enabled = Boolean(config.enabled);

  if (!enabled) {
    return {
      isValid: true,
      normalizedConfig: {
        enabled: false,
        title: String(config.title || fallbackTitle).trim() || fallbackTitle,
        description: String(config.description || '').trim(),
        fields: [],
      },
    };
  }

  if (!Array.isArray(config.fields) || config.fields.length === 0) {
    return {
      isValid: false,
      message: 'At least one field add karo, ya form ko disable kar do.',
    };
  }

  try {
    const normalizedFields = normalizeFormFields(config.fields);
    const normalizedTitle = String(config.title || fallbackTitle).trim() || fallbackTitle;

    return {
      isValid: true,
      normalizedConfig: {
        enabled: true,
        title: normalizedTitle,
        description: String(config.description || '').trim(),
        fields: normalizedFields,
      },
    };
  } catch (error) {
    return {
      isValid: false,
      message: error.message,
    };
  }
};

const normalizeCheckboxValue = (value) => value === true || value === 'true';

export const validateResponses = (fields = [], responses = {}) => {
  const errors = {};
  const normalizedResponses = {};

  fields.forEach((field) => {
    const rawValue = responses?.[field.name];

    if (field.type === 'checkbox') {
      const checked = normalizeCheckboxValue(rawValue);
      if (field.required && !checked) {
        errors[field.name] = `${field.label} is required.`;
      }
      normalizedResponses[field.name] = checked;
      return;
    }

    const value = typeof rawValue === 'string' ? rawValue.trim() : rawValue;

    if (field.required && (value === '' || value === undefined || value === null)) {
      errors[field.name] = `${field.label} is required.`;
      return;
    }

    if (value === '' || value === undefined || value === null) {
      normalizedResponses[field.name] = '';
      return;
    }

    if (field.type === 'number') {
      const parsed = Number(value);
      if (!Number.isFinite(parsed)) {
        errors[field.name] = `${field.label} must be a valid number.`;
        return;
      }
      if (field.validation?.min !== undefined && parsed < field.validation.min) {
        errors[field.name] = `${field.label} must be at least ${field.validation.min}.`;
        return;
      }
      if (field.validation?.max !== undefined && parsed > field.validation.max) {
        errors[field.name] = `${field.label} must be at most ${field.validation.max}.`;
        return;
      }
      normalizedResponses[field.name] = parsed;
      return;
    }

    const stringValue = String(value);

    if (field.type === 'email') {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(stringValue)) {
        errors[field.name] = `${field.label} must be a valid email address.`;
        return;
      }
    }

    if (field.type === 'date') {
      const parsedDate = new Date(stringValue);
      if (Number.isNaN(parsedDate.getTime())) {
        errors[field.name] = `${field.label} must be a valid date.`;
        return;
      }
    }

    if (OPTION_FIELD_TYPES.includes(field.type) && !field.options.includes(stringValue)) {
      errors[field.name] = `Choose a valid option for ${field.label}.`;
      return;
    }

    if (
      field.validation?.minLength !== undefined &&
      stringValue.length < field.validation.minLength
    ) {
      errors[field.name] = `${field.label} must be at least ${field.validation.minLength} characters.`;
      return;
    }

    if (
      field.validation?.maxLength !== undefined &&
      stringValue.length > field.validation.maxLength
    ) {
      errors[field.name] = `${field.label} must be at most ${field.validation.maxLength} characters.`;
      return;
    }

    if (field.validation?.pattern) {
      try {
        const regex = new RegExp(field.validation.pattern);
        if (!regex.test(stringValue)) {
          errors[field.name] = `${field.label} format is invalid.`;
          return;
        }
      } catch (error) {
        errors[field.name] = `${field.label} has an invalid validation rule.`;
        return;
      }
    }

    normalizedResponses[field.name] = stringValue;
  });

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
    normalizedResponses,
  };
};

export const formatResponseValue = (value) => {
  if (value === true) return 'Yes';
  if (value === false) return 'No';
  if (Array.isArray(value)) return value.join(', ');
  if (value === '' || value === undefined || value === null) return 'Not provided';
  return String(value);
};
