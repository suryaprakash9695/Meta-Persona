/**
 * Admin Routes
 * Simple admin panel APIs for user management and analytics
 */

const express = require('express');
const router = express.Router();
const { protect, adminOnly } = require('../middleware/auth');
const User = require('../models/User');
const Profile = require('../models/Profile');
const PrivateFolder = require('../models/PrivateFolder');

// ========================
// GET /api/admin/stats
// Dashboard analytics
// ========================
router.get('/stats', protect, adminOnly, async (req, res) => {
  try {
    const totalUsers = await User.countDocuments({ role: 'user' });
    const activeUsers = await User.countDocuments({ role: 'user', isActive: true });
    const totalFolders = await PrivateFolder.countDocuments();
    const recentUsers = await User.find({ role: 'user' })
      .sort({ createdAt: -1 })
      .limit(10)
      .select('fullName username email createdAt isActive lastLogin');

    // Users registered in last 7 days
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const newThisWeek = await User.countDocuments({ createdAt: { $gte: weekAgo } });

    res.json({
      stats: {
        totalUsers,
        activeUsers,
        inactiveUsers: totalUsers - activeUsers,
        totalFolders,
        newThisWeek
      },
      recentUsers
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch stats.' });
  }
});

// ========================
// GET /api/admin/users
// List all users
// ========================
router.get('/users', protect, adminOnly, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const users = await User.find({ role: 'user' })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .select('-passwordHash');

    const total = await User.countDocuments({ role: 'user' });

    res.json({ users, total, page, pages: Math.ceil(total / limit) });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch users.' });
  }
});

// ========================
// PUT /api/admin/users/:id/toggle-active
// Activate / Deactivate user
// ========================
router.put('/users/:id/toggle-active', protect, adminOnly, async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ error: 'User not found.' });
    if (user.role === 'admin') return res.status(400).json({ error: 'Cannot modify admin accounts.' });

    user.isActive = !user.isActive;
    await user.save({ validateBeforeSave: false });

    res.json({ message: `User ${user.isActive ? 'activated' : 'deactivated'} successfully.`, user });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update user status.' });
  }
});

// ========================
// DELETE /api/admin/users/:id
// Delete user and their data
// ========================
router.delete('/users/:id', protect, adminOnly, async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ error: 'User not found.' });
    if (user.role === 'admin') return res.status(400).json({ error: 'Cannot delete admin accounts.' });

    // Delete all associated data
    await Profile.deleteOne({ userId: user._id });
    await PrivateFolder.deleteMany({ userId: user._id });
    await User.deleteOne({ _id: user._id });

    res.json({ message: 'User and all associated data deleted successfully.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to delete user.' });
  }
});

// ========================
// POST /api/admin/create-admin
// Create admin account (only one-time setup)
// ========================
router.post('/create-admin', async (req, res) => {
  try {
    const existing = await User.findOne({ role: 'admin' });
    if (existing) return res.status(400).json({ error: 'Admin already exists.' });

    const { email, password, fullName } = req.body;
    const admin = new User({
      fullName: fullName || 'Super Admin',
      username: 'admin',
      email: email || process.env.ADMIN_EMAIL,
      passwordHash: password || process.env.ADMIN_PASSWORD,
      role: 'admin'
    });
    await admin.save();

    res.status(201).json({ message: 'Admin account created successfully!' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to create admin.' });
  }
});

module.exports = router;
