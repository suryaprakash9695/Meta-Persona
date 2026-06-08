/**
 * Authentication Routes
 * Handles: signup, login, get current user, logout
 */

const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const Profile = require('../models/Profile');
const { protect } = require('../middleware/auth');

// ========================
// Helper: Generate JWT
// ========================
const generateToken = (userId) => {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d'
  });
};

// ========================
// POST /api/auth/signup
// ========================
router.post(
  '/signup',
  [
    body('fullName').trim().notEmpty().withMessage('Full name is required').isLength({ min: 2 }).withMessage('Full name must be at least 2 characters'),
    body('username').trim().notEmpty().withMessage('Username is required').isLength({ min: 3, max: 30 }).withMessage('Username must be 3-30 characters').matches(/^[a-zA-Z0-9_]+$/).withMessage('Username can only contain letters, numbers, and underscores'),
    body('email').isEmail().normalizeEmail().withMessage('Please provide a valid email'),
    body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
    body('confirmPassword').custom((value, { req }) => {
      if (value !== req.body.password) throw new Error('Passwords do not match');
      return true;
    })
  ],
  async (req, res) => {
    // Validate inputs
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: errors.array()[0].msg });
    }

    try {
      const { fullName, username, email, password } = req.body;

      // Check if user already exists
      const existingEmail = await User.findOne({ email });
      if (existingEmail) return res.status(409).json({ error: 'Email already registered.' });

      const existingUsername = await User.findOne({ username: username.toLowerCase() });
      if (existingUsername) return res.status(409).json({ error: 'Username already taken.' });

      // Create user
      const user = new User({
        fullName,
        username: username.toLowerCase(),
        email,
        passwordHash: password // Will be hashed by pre-save hook
      });
      await user.save();

      // Create empty profile for user
      await Profile.create({ userId: user._id });

      // Generate token
      const token = generateToken(user._id);

      res.status(201).json({
        message: 'Account created successfully!',
        token,
        user: {
          id: user._id,
          fullName: user.fullName,
          username: user.username,
          email: user.email,
          role: user.role
        }
      });
    } catch (err) {
      console.error('Signup error:', err);
      res.status(500).json({ error: 'Server error during signup.' });
    }
  }
);

// ========================
// POST /api/auth/login
// ========================
router.post(
  '/login',
  [
    body('identifier').trim().notEmpty().withMessage('Email or username is required'),
    body('password').notEmpty().withMessage('Password is required')
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: errors.array()[0].msg });
    }

    try {
      const { identifier, password } = req.body;

      // Find user by email OR username (include passwordHash)
      const user = await User.findOne({
        $or: [
          { email: identifier.toLowerCase() },
          { username: identifier.toLowerCase() }
        ]
      }).select('+passwordHash');

      if (!user) {
        return res.status(401).json({ error: 'Invalid email/username or password.' });
      }

      if (!user.isActive) {
        return res.status(403).json({ error: 'Your account has been deactivated.' });
      }

      // Verify password
      const isMatch = await user.comparePassword(password);
      if (!isMatch) {
        return res.status(401).json({ error: 'Invalid email/username or password.' });
      }

      // Update last login
      user.lastLogin = new Date();
      await user.save({ validateBeforeSave: false });

      // Generate token
      const token = generateToken(user._id);

      res.json({
        message: 'Login successful!',
        token,
        user: {
          id: user._id,
          fullName: user.fullName,
          username: user.username,
          email: user.email,
          role: user.role
        }
      });
    } catch (err) {
      console.error('Login error:', err);
      res.status(500).json({ error: 'Server error during login.' });
    }
  }
);

// ========================
// GET /api/auth/me
// ========================
router.get('/me', protect, async (req, res) => {
  try {
    res.json({ user: req.user });
  } catch (err) {
    res.status(500).json({ error: 'Server error.' });
  }
});

// ========================
// PUT /api/auth/change-password
// ========================
router.put('/change-password', protect,
  [
    body('currentPassword').notEmpty().withMessage('Current password is required'),
    body('newPassword').isLength({ min: 8 }).withMessage('New password must be at least 8 characters')
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: errors.array()[0].msg });
    }

    try {
      const user = await User.findById(req.user._id).select('+passwordHash');
      const isMatch = await user.comparePassword(req.body.currentPassword);
      if (!isMatch) return res.status(400).json({ error: 'Current password is incorrect.' });

      user.passwordHash = req.body.newPassword;
      await user.save();

      res.json({ message: 'Password changed successfully!' });
    } catch (err) {
      res.status(500).json({ error: 'Server error.' });
    }
  }
);

module.exports = router;
