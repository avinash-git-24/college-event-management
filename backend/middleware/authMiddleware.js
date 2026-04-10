const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const User = require('../models/userModel');
const ADMIN_EMAIL = 'avinash@dev.com';
const ADMIN_NAME = 'Avinash';

const isDatabaseConnected = () => mongoose.connection.readyState === 1;

const protect = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    try {
      // Get token from header
      token = req.headers.authorization.split(' ')[1];

      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      if (decoded.isSystemAdmin && decoded.email === ADMIN_EMAIL) {
        req.user = {
          _id: decoded.id,
          name: decoded.name || ADMIN_NAME,
          email: decoded.email,
          role: 'admin',
        };
        return next();
      }

      if (isDatabaseConnected()) {
        req.user = await User.findById(decoded.id).select('-password');

        if (!req.user) {
          return res.status(401).json({ message: 'Not authorized, user not found' });
        }
      } else {
        req.user = {
          _id: decoded.id,
          name: decoded.name,
          email: decoded.email,
          role: decoded.role || process.env.DEFAULT_USER_ROLE || 'student',
        };
      }

      next();
    } catch (error) {
      return res.status(401).json({ message: 'Not authorized, token failed' });
    }
  }

  if (!token) {
    return res.status(401).json({ message: 'Not authorized, no token' });
  }
};

const authorize = (...roles) => (req, res, next) => {
  if (req.user && roles.includes(req.user.role)) {
    next();
  } else {
    res.status(403).json({ message: 'Not authorized for this resource' });
  }
};

const admin = authorize('admin');
const student = authorize('student');

module.exports = { protect, admin, student, authorize };
