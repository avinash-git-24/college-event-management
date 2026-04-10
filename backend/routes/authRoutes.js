const express = require('express');
const router = express.Router();

const {
  register,
  login,
  adminLogin,
  getMe,
  updateProfile,
  updateActivity,
  logoutUser,
  getUsers,
  getUser,
  updateUser,
  deleteUser,
} = require('../controllers/authController');
const { protect, admin } = require('../middleware/authMiddleware');

// Public routes
router.post('/register', register);
router.post('/login', login);
router.post('/admin/login', adminLogin);

// Protected routes (require authentication)
router.use(protect);

router.get('/me', getMe);
router.put('/me', updateProfile);
router.post('/activity', updateActivity);
router.post('/logout', logoutUser);

// Admin only routes for user management
router.get('/users', admin, getUsers);
router.get('/users/:id', admin, getUser);
router.put('/users/:id', admin, updateUser);
router.delete('/users/:id', admin, deleteUser);

module.exports = router;
