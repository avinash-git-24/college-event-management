const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const User = require('../models/userModel');

const isDatabaseConnected = () => mongoose.connection.readyState === 1;

const normalizeEmail = (email) => email.trim().toLowerCase();
const ADMIN_EMAIL = 'avinash@dev.com';
const ADMIN_PASSWORD = '123456';
const ADMIN_NAME = 'Avinash';

const generateToken = (user) =>
  jwt.sign(
    {
      id: user._id,
      role: user.role,
      name: user.name,
      email: user.email,
      isSystemAdmin: Boolean(user.isSystemAdmin),
    },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '30d' }
  );

const buildAuthResponse = (user, message) => {
  const response = {
    _id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
    bio: user.bio || '',
    phone: user.phone || '',
    department: user.department || '',
    year: user.year || '',
    token: generateToken(user),
  };

  if (message) {
    response.message = message;
  }

  return response;
};

const getOfflineAdminEmails = () =>
  (process.env.OFFLINE_ADMIN_EMAILS || '')
    .split(',')
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);

const getOfflineRole = (email) =>
  getOfflineAdminEmails().includes(email) ? 'admin' : process.env.DEFAULT_USER_ROLE || 'student';

const buildOfflineUser = ({ id, name, email, role }) => ({
  _id: id || `offline-user-${Date.now()}`,
  name,
  email,
  role: role || process.env.DEFAULT_USER_ROLE || 'student',
  bio: '',
  phone: '',
  department: '',
  year: '',
});

const buildSystemAdminUser = () => ({
  _id: 'secure-admin-avinash',
  name: ADMIN_NAME,
  email: ADMIN_EMAIL,
  role: 'admin',
  bio: 'System administrator',
  phone: '',
  department: 'Platform Operations',
  year: '',
  isSystemAdmin: true,
});

const sanitizeUser = (user) => ({
  _id: user._id,
  name: user.name,
  email: user.email,
  role: user.role,
  bio: user.bio || '',
  phone: user.phone || '',
  department: user.department || '',
  year: user.year || '',
  isOnline: Boolean(user.isOnline),
  lastLoginAt: user.lastLoginAt || null,
  lastActiveAt: user.lastActiveAt || null,
  createdAt: user.createdAt,
});

const markUserOnline = async (user) => {
  user.isOnline = true;
  user.lastLoginAt = new Date();
  user.lastActiveAt = new Date();
  await user.save();
};

const register = async (req, res) => {
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ message: 'Please provide name, email, and password' });
  }

  const normalizedEmail = normalizeEmail(email);

  try {
    if (isDatabaseConnected()) {
      const userExists = await User.findOne({ email: normalizedEmail });
      if (userExists) {
        return res.status(400).json({ message: 'User already exists' });
      }

      const user = await User.create({
        name,
        email: normalizedEmail,
        password,
        role: process.env.DEFAULT_USER_ROLE || 'student',
        lastLoginAt: new Date(),
        lastActiveAt: new Date(),
      });

      return res.status(201).json(buildAuthResponse(user));
    }

    const offlineUser = buildOfflineUser({
      name,
      email: normalizedEmail,
      role: process.env.DEFAULT_USER_ROLE || 'student',
    });

    console.log('Registration simulated (offline mode):', {
      name: offlineUser.name,
      email: offlineUser.email,
      role: offlineUser.role,
    });

    return res
      .status(201)
      .json(buildAuthResponse(offlineUser, 'Registration successful (offline mode)'));
  } catch (error) {
    return res.status(500).json({ message: 'Server error' });
  }
};

const login = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: 'Please provide email and password' });
  }

  const normalizedEmail = normalizeEmail(email);

  if (normalizedEmail === ADMIN_EMAIL) {
    return res.status(403).json({ message: 'Admin account can only sign in from the /admin route.' });
  }

  try {
    if (isDatabaseConnected()) {
      const user = await User.findOne({ email: normalizedEmail });

      if (!user || !(await user.matchPassword(password))) {
        return res.status(401).json({ message: 'Invalid credentials' });
      }

      if (user.role === 'admin') {
        return res.status(403).json({ message: 'Admin account can only sign in from the /admin route.' });
      }

      await markUserOnline(user);
      return res.json(buildAuthResponse(user));
    }

    const offlinePassword = process.env.OFFLINE_USER_PASSWORD || 'password123';
    if (password !== offlinePassword) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const offlineUser = buildOfflineUser({
      name: normalizedEmail.split('@')[0],
      email: normalizedEmail,
      role: getOfflineRole(normalizedEmail),
    });

    console.log('Login simulated (offline mode):', {
      email: offlineUser.email,
      role: offlineUser.role,
    });

    return res.json(buildAuthResponse(offlineUser, 'Login successful (offline mode)'));
  } catch (error) {
    return res.status(500).json({ message: 'Server error' });
  }
};

const adminLogin = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: 'Please provide admin email and password' });
  }

  const normalizedEmail = normalizeEmail(email);

  if (normalizedEmail !== ADMIN_EMAIL || password !== ADMIN_PASSWORD) {
    return res.status(401).json({ message: 'Invalid admin credentials' });
  }

  return res.json(buildAuthResponse(buildSystemAdminUser()));
};

const updateActivity = async (req, res) => {
  try {
    if (req.user?.email === ADMIN_EMAIL && req.user?.role === 'admin') {
      return res.json({ success: true, isOnline: true, lastActiveAt: new Date().toISOString() });
    }

    if (isDatabaseConnected()) {
      const user = await User.findByIdAndUpdate(
        req.user._id,
        { isOnline: true, lastActiveAt: new Date() },
        { new: true }
      ).select('-password');

      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      return res.json(sanitizeUser(user));
    }

    return res.json({ success: true, isOnline: true, lastActiveAt: new Date().toISOString() });
  } catch (error) {
    return res.status(500).json({ message: 'Server error' });
  }
};

const logoutUser = async (req, res) => {
  try {
    if (req.user?.email === ADMIN_EMAIL && req.user?.role === 'admin') {
      return res.json({ message: 'Admin logged out successfully' });
    }

    if (isDatabaseConnected()) {
      await User.findByIdAndUpdate(req.user._id, { isOnline: false, lastActiveAt: new Date() });
    }

    return res.json({ message: 'Logged out successfully' });
  } catch (error) {
    return res.status(500).json({ message: 'Server error' });
  }
};

const getMe = async (req, res) => {
  try {
    if (req.user?.email === ADMIN_EMAIL && req.user?.role === 'admin') {
      return res.json(sanitizeUser(buildSystemAdminUser()));
    }

    if (isDatabaseConnected()) {
      const user = await User.findById(req.user._id).select('-password');

      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      return res.json(sanitizeUser(user));
    }

    return res.json(
      sanitizeUser({
        _id: req.user._id,
        name: req.user.name,
        email: req.user.email,
        role: req.user.role,
        bio: '',
        phone: '',
        department: '',
        year: '',
        createdAt: new Date().toISOString(),
      })
    );
  } catch (error) {
    return res.status(500).json({ message: 'Server error' });
  }
};

const updateProfile = async (req, res) => {
  try {
    const { name, bio, phone, department, year } = req.body;

    if (req.user?.email === ADMIN_EMAIL && req.user?.role === 'admin') {
      const updatedAdmin = {
        ...buildSystemAdminUser(),
        name: name !== undefined ? name : ADMIN_NAME,
        bio: bio !== undefined ? bio : 'System administrator',
        phone: phone !== undefined ? phone : '',
        department: department !== undefined ? department : 'Platform Operations',
        year: year !== undefined ? year : '',
      };

      return res.json(buildAuthResponse(updatedAdmin));
    }

    if (isDatabaseConnected()) {
      const user = await User.findById(req.user._id);

      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      if (name !== undefined) user.name = name;
      if (bio !== undefined) user.bio = bio;
      if (phone !== undefined) user.phone = phone;
      if (department !== undefined) user.department = department;
      if (year !== undefined) user.year = year;

      await user.save();

      return res.json(buildAuthResponse(user));
    }

    return res.json(
      buildAuthResponse({
        _id: req.user._id,
        name: name !== undefined ? name : req.user.name,
        email: req.user.email,
        role: req.user.role,
        bio: bio || '',
        phone: phone || '',
        department: department || '',
        year: year || '',
      })
    );
  } catch (error) {
    return res.status(500).json({ message: 'Server error' });
  }
};

const getUsers = async (req, res) => {
  try {
    if (isDatabaseConnected()) {
      const users = await User.find({}).select('-password');
      return res.json(users.map(sanitizeUser));
    }

    return res.json([
      {
        _id: 'mock-user-1',
        name: 'John Doe',
        email: 'john@example.com',
        role: 'student',
        bio: 'Interested in AI and campus hackathons.',
        phone: '9876543210',
        department: 'Computer Science',
        year: '3rd Year',
        createdAt: new Date().toISOString(),
      },
      {
        _id: 'mock-user-2',
        name: 'Admin User',
        email: 'admin@example.com',
        role: 'admin',
        bio: 'Platform administrator',
        phone: '',
        department: 'Administration',
        year: '',
        createdAt: new Date().toISOString(),
      },
    ]);
  } catch (error) {
    return res.status(500).json({ message: 'Server error' });
  }
};

const getUser = async (req, res) => {
  try {
    if (isDatabaseConnected()) {
      const user = await User.findById(req.params.id).select('-password');

      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      return res.json(sanitizeUser(user));
    }

    return res.json(sanitizeUser({
      _id: req.params.id,
      name: 'Mock User',
      email: 'mock@example.com',
      role: 'student',
      bio: '',
      phone: '',
      department: '',
      year: '',
      createdAt: new Date().toISOString(),
    }));
  } catch (error) {
    return res.status(500).json({ message: 'Server error' });
  }
};

const updateUser = async (req, res) => {
  try {
    const { name, email, role, bio, phone, department, year } = req.body;

    if (isDatabaseConnected()) {
      const user = await User.findById(req.params.id);

      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      const normalizedEmail = email ? normalizeEmail(email) : undefined;

      if (normalizedEmail && normalizedEmail !== user.email) {
        const emailExists = await User.findOne({ email: normalizedEmail });
        if (emailExists) {
          return res.status(400).json({ message: 'Email already exists' });
        }
      }

      const updates = {};
      if (name !== undefined) updates.name = name;
      if (normalizedEmail !== undefined) updates.email = normalizedEmail;
      if (role !== undefined) updates.role = role;
      if (bio !== undefined) updates.bio = bio;
      if (phone !== undefined) updates.phone = phone;
      if (department !== undefined) updates.department = department;
      if (year !== undefined) updates.year = year;

      const updatedUser = await User.findByIdAndUpdate(req.params.id, updates, {
        new: true,
        runValidators: true,
      }).select('-password');

      return res.json(sanitizeUser(updatedUser));
    }

    return res.json({
      _id: req.params.id,
      name: name || 'Mock User',
      email: email ? normalizeEmail(email) : 'mock@example.com',
      role: role || process.env.DEFAULT_USER_ROLE || 'student',
      bio: bio || '',
      phone: phone || '',
      department: department || '',
      year: year || '',
      createdAt: new Date().toISOString(),
    });
  } catch (error) {
    return res.status(500).json({ message: 'Server error' });
  }
};

const deleteUser = async (req, res) => {
  try {
    if (isDatabaseConnected()) {
      const user = await User.findById(req.params.id);

      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      await User.findByIdAndDelete(req.params.id);
      return res.json({ message: 'User deleted' });
    }

    return res.json({ message: 'User deleted (offline mode)' });
  } catch (error) {
    return res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
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
};
