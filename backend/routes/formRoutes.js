const express = require('express');
const router = express.Router();
const {
  getForm,
  getFormById,
  createOrUpdateForm,
  deleteForm,
  submitFormResponse,
  getFormResponses,
  getMyFormResponse,
} = require('../controllers/formController');
const { protect, admin } = require('../middleware/authMiddleware');

// Get form by form id
router.get('/id/:formId', protect, getFormById);

// Submit form response
router.post('/:formId/submit', protect, submitFormResponse);

// Get all responses for a form (admin only)
router.get('/:formId/responses', protect, admin, getFormResponses);

// Get user's own response
router.get('/:formId/my-response', protect, getMyFormResponse);

// Get form for course/event by type and item
router.get('/:type/:itemId', protect, getForm);

// Create or update form (admin only)
router.post('/:type/:itemId', protect, admin, createOrUpdateForm);

// Archive form (admin only)
router.delete('/:type/:itemId', protect, admin, deleteForm);

module.exports = router;
