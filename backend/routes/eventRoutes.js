const express = require('express');
const router = express.Router();
const {
  getEvents,
  getEvent,
  createEvent,
  updateEvent,
  deleteEvent,
  registerForEvent,
} = require('../controllers/eventController');

const { protect, admin, authorize } = require('../middleware/authMiddleware');

// All routes require authentication
router.use(protect);

// GET /api/events - Get all events
router.get('/', getEvents);

// GET /api/events/:id - Get single event
router.get('/:id', getEvent);

// POST /api/events - Create event (admin only)
router.post('/', admin, createEvent);

// PUT /api/events/:id - Update event (admin only)
router.put('/:id', admin, updateEvent);

// DELETE /api/events/:id - Delete event (admin only)
router.delete('/:id', admin, deleteEvent);

// POST /api/events/:id/register - Register for event
router.post('/:id/register', authorize('student', 'admin'), registerForEvent);

module.exports = router;
