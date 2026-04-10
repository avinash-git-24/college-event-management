const express = require('express');
const router = express.Router();
const {
  getCourses,
  getCourse,
  createCourse,
  updateCourse,
  deleteCourse,
  enrollCourse,
} = require('../controllers/courseController');

const { protect, admin, student } = require('../middleware/authMiddleware');

// All routes require authentication
router.use(protect);

// GET /api/courses - Get all courses (filtered by role)
router.get('/', getCourses);

// GET /api/courses/:id - Get single course
router.get('/:id', getCourse);

// POST /api/courses - Create course (admin only)
router.post('/', admin, createCourse);

// PUT /api/courses/:id - Update course (admin only)
router.put('/:id', admin, updateCourse);

// DELETE /api/courses/:id - Delete course (admin only)
router.delete('/:id', admin, deleteCourse);

// POST /api/courses/:id/enroll - Enroll in course (students only)
router.post('/:id/enroll', student, enrollCourse);

module.exports = router;
