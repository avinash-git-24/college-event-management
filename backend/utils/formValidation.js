const SUPPORTED_FIELD_TYPES = [
  'text',
  'email',
  'number',
  'date',
  'select',
  'textarea',
  'checkbox',
  'radio',
];

const OPTION_BASED_TYPES = ['select', 'radio'];
const TEXTUAL_TYPES = ['text', 'email', 'textarea'];

const slugifyFieldName = (value, fallback = 'field') => {
  const normalized = String(value || fallback)
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');

  return normalized || `${fallback}_${Date.now()}`;
};

const parseNumericRule = (value) => {
  if (value === undefined || value === null || value === '') {
    return undefined;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
};

const normalizeFieldDefinition = (field = {}, index = 0) => {
  const label = String(field.label || '').trim();

  if (!label) {
    throw new Error(`Field ${index + 1} must have a label`);
  }

  const type = String(field.type || 'text').trim();
  if (!SUPPORTED_FIELD_TYPES.includes(type)) {
    throw new Error(`"${label}" has an unsupported field type`);
  }

  const options = OPTION_BASED_TYPES.includes(type)
    ? [...new Set((field.options || []).map((option) => String(option || '').trim()).filter(Boolean))]
    : [];

  if (OPTION_BASED_TYPES.includes(type) && options.length === 0) {
    throw new Error(`"${label}" must include at least one option`);
  }

  const validation = {
    min: parseNumericRule(field.validation?.min),
    max: parseNumericRule(field.validation?.max),
    minLength: parseNumericRule(field.validation?.minLength),
    maxLength: parseNumericRule(field.validation?.maxLength),
    pattern: String(field.validation?.pattern || '').trim() || undefined,
  };

  if (
    validation.min !== undefined &&
    validation.max !== undefined &&
    validation.min > validation.max
  ) {
    throw new Error(`"${label}" has an invalid min/max range`);
  }

  if (
    validation.minLength !== undefined &&
    validation.maxLength !== undefined &&
    validation.minLength > validation.maxLength
  ) {
    throw new Error(`"${label}" has an invalid length range`);
  }

  return {
    name: slugifyFieldName(field.name || label, `field_${index + 1}`),
    label,
    type,
    required: Boolean(field.required),
    options,
    placeholder: String(field.placeholder || '').trim(),
    validation,
  };
};

const normalizeFormFields = (fields = []) => {
  if (!Array.isArray(fields)) {
    throw new Error('Form fields must be provided as an array');
  }

  const normalizedFields = fields.map(normalizeFieldDefinition);
  const fieldNames = normalizedFields.map((field) => field.name);
  const uniqueFieldNames = new Set(fieldNames);

  if (uniqueFieldNames.size !== fieldNames.length) {
    throw new Error('Each form field must have a unique name');
  }

  return normalizedFields;
};

const isEmptyResponse = (field, value) => {
  if (field.type === 'checkbox') {
    return value !== true;
  }

  return value === undefined || value === null || value === '';
};

const validateSingleFieldResponse = (field, rawValue) => {
  let value = rawValue;

  if (field.type === 'checkbox') {
    value = value === true || value === 'true';

    if (field.required && value !== true) {
      return { error: `${field.label} is required` };
    }

    return { value };
  }

  if (typeof value === 'string') {
    value = value.trim();
  }

  if (field.required && isEmptyResponse(field, value)) {
    return { error: `${field.label} is required` };
  }

  if (isEmptyResponse(field, value)) {
    return { value: '' };
  }

  if (field.type === 'number') {
    const parsed = Number(value);
    if (!Number.isFinite(parsed)) {
      return { error: `${field.label} must be a valid number` };
    }

    if (field.validation?.min !== undefined && parsed < field.validation.min) {
      return { error: `${field.label} must be at least ${field.validation.min}` };
    }

    if (field.validation?.max !== undefined && parsed > field.validation.max) {
      return { error: `${field.label} must be at most ${field.validation.max}` };
    }

    return { value: parsed };
  }

  if (field.type === 'email') {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(String(value))) {
      return { error: `${field.label} must be a valid email address` };
    }
  }

  if (field.type === 'date') {
    const parsedDate = new Date(value);
    if (Number.isNaN(parsedDate.getTime())) {
      return { error: `${field.label} must be a valid date` };
    }
  }

  if (OPTION_BASED_TYPES.includes(field.type) && !field.options.includes(String(value))) {
    return { error: `Please choose a valid option for ${field.label}` };
  }

  if (TEXTUAL_TYPES.includes(field.type) || OPTION_BASED_TYPES.includes(field.type) || field.type === 'date') {
    const stringValue = String(value);

    if (
      field.validation?.minLength !== undefined &&
      stringValue.length < field.validation.minLength
    ) {
      return { error: `${field.label} must be at least ${field.validation.minLength} characters` };
    }

    if (
      field.validation?.maxLength !== undefined &&
      stringValue.length > field.validation.maxLength
    ) {
      return { error: `${field.label} must be at most ${field.validation.maxLength} characters` };
    }

    if (field.validation?.pattern) {
      let regex;
      try {
        regex = new RegExp(field.validation.pattern);
      } catch (error) {
        return { error: `${field.label} has an invalid validation pattern` };
      }

      if (!regex.test(stringValue)) {
        return { error: `${field.label} format is invalid` };
      }
    }
  }

  return { value };
};

const validateAndNormalizeResponses = (fields = [], responses = {}) => {
  const normalizedResponses = {};

  for (const field of fields) {
    const { value, error } = validateSingleFieldResponse(field, responses?.[field.name]);

    if (error) {
      return { error };
    }

    normalizedResponses[field.name] = value;
  }

  return { responses: normalizedResponses };
};

module.exports = {
  SUPPORTED_FIELD_TYPES,
  OPTION_BASED_TYPES,
  TEXTUAL_TYPES,
  slugifyFieldName,
  normalizeFormFields,
  validateAndNormalizeResponses,
};
