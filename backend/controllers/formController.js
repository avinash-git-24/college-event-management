const Form = require('../models/formModel');
const FormResponse = require('../models/formResponseModel');
const Course = require('../models/courseModel');
const Event = require('../models/eventModel');
const {
  normalizeFormFields,
  validateAndNormalizeResponses,
} = require('../utils/formValidation');

const getItemModel = (type) => {
  if (type === 'course') {
    return Course;
  }

  if (type === 'event') {
    return Event;
  }

  return null;
};

// @desc    Get form for a course/event
// @route   GET /api/forms/:type/:itemId
// @access  Private
const getForm = async (req, res) => {
  try {
    const { type, itemId } = req.params;

    if (!['course', 'event'].includes(type)) {
      return res.status(400).json({ message: 'Invalid type' });
    }

    const form = await Form.findOne({ type, itemId, isActive: true });

    if (!form) {
      return res.status(404).json({ message: 'Form not found' });
    }

    res.json(form);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get form by form id
// @route   GET /api/forms/id/:formId
// @access  Private
const getFormById = async (req, res) => {
  try {
    const { formId } = req.params;

    const form = await Form.findById(formId);
    if (!form) {
      return res.status(404).json({ message: 'Form not found' });
    }

    if (!form.isActive && req.user.role !== 'admin') {
      return res.status(404).json({ message: 'Form not found' });
    }

    res.json(form);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Create or update form for a course/event
// @route   POST /api/forms/:type/:itemId
// @access  Private (Admin only)
const createOrUpdateForm = async (req, res) => {
  try {
    const { type, itemId } = req.params;
    const { title, description, fields } = req.body;

    if (!['course', 'event'].includes(type)) {
      return res.status(400).json({ message: 'Invalid type' });
    }

    const ItemModel = getItemModel(type);
    const item = await ItemModel.findById(itemId);

    if (!item) {
      return res.status(404).json({ message: `${type} not found` });
    }

    const normalizedFields = normalizeFormFields(fields || []);
    let form = await Form.findOne({ type, itemId });

    if (form) {
      form.title = title || form.title;
      form.description = description || '';
      form.fields = normalizedFields;
      form.isActive = true;
      await form.save();
    } else {
      form = await Form.create({
        type,
        itemId,
        title,
        description,
        fields: normalizedFields,
        isActive: true,
      });
    }

    item.formId = form._id;
    await item.save();

    res.status(201).json(form);
  } catch (error) {
    if (error.message) {
      return res.status(400).json({ message: error.message });
    }

    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Archive form for a course/event
// @route   DELETE /api/forms/:type/:itemId
// @access  Private (Admin only)
const deleteForm = async (req, res) => {
  try {
    const { type, itemId } = req.params;

    if (!['course', 'event'].includes(type)) {
      return res.status(400).json({ message: 'Invalid type' });
    }

    const form = await Form.findOne({ type, itemId });
    if (!form) {
      return res.status(404).json({ message: 'Form not found' });
    }

    form.isActive = false;
    await form.save();

    res.json({ message: 'Form archived successfully', form });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Submit form response
// @route   POST /api/forms/:formId/submit
// @access  Private
const submitFormResponse = async (req, res) => {
  try {
    const { formId } = req.params;
    const { responses } = req.body;
    const userId = req.user._id;

    const form = await Form.findById(formId);
    if (!form) {
      return res.status(404).json({ message: 'Form not found' });
    }

    if (!form.isActive) {
      return res.status(400).json({ message: 'This form is no longer active' });
    }

    const existingResponse = await FormResponse.findOne({ formId, userId });
    if (existingResponse) {
      return res.status(400).json({ message: 'Form already submitted' });
    }

    const { responses: normalizedResponses, error } = validateAndNormalizeResponses(
      form.fields,
      responses || {}
    );

    if (error) {
      return res.status(400).json({ message: error });
    }

    const formResponse = await FormResponse.create({
      formId,
      userId,
      responses: normalizedResponses,
    });

    res.status(201).json(formResponse);
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ message: 'Form already submitted' });
    }

    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get form responses for admin
// @route   GET /api/forms/:formId/responses
// @access  Private (Admin only)
const getFormResponses = async (req, res) => {
  try {
    const { formId } = req.params;

    const responses = await FormResponse.find({ formId })
      .populate('userId', 'name email')
      .sort({ submittedAt: -1 });

    res.json(responses);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get user's form response
// @route   GET /api/forms/:formId/my-response
// @access  Private
const getMyFormResponse = async (req, res) => {
  try {
    const { formId } = req.params;
    const userId = req.user._id;

    const response = await FormResponse.findOne({ formId, userId });

    if (!response) {
      return res.status(404).json({ message: 'Response not found' });
    }

    res.json(response);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  getForm,
  getFormById,
  createOrUpdateForm,
  deleteForm,
  submitFormResponse,
  getFormResponses,
  getMyFormResponse,
};
