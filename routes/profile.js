/**
 * Profile Routes
 * CRUD for all profile sections: personal info, education, career, etc.
 */

const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const Profile = require('../models/Profile');
const User = require('../models/User');

// Helper: Get or create profile
async function getOrCreateProfile(userId) {
  let profile = await Profile.findOne({ userId });
  if (!profile) profile = await Profile.create({ userId });
  return profile;
}

// ========================
// GET /api/profile
// Get full profile
// ========================
router.get('/', protect, async (req, res) => {
  try {
    const profile = await getOrCreateProfile(req.user._id);
    res.json({ profile });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch profile.' });
  }
});

// ========================
// PUT /api/profile/personal-info
// Update personal info
// ========================
router.put('/personal-info', protect, async (req, res) => {
  try {
    const profile = await getOrCreateProfile(req.user._id);
    profile.personalInfo = { ...profile.personalInfo, ...req.body };
    await profile.save();
    res.json({ message: 'Personal info updated!', personalInfo: profile.personalInfo });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update personal info.' });
  }
});

// ========================
// Generic section CRUD factory
// ========================
function sectionRoutes(section) {
  // GET all items in a section
  router.get(`/${section}`, protect, async (req, res) => {
    try {
      const profile = await getOrCreateProfile(req.user._id);
      res.json({ [section]: profile[section] || [] });
    } catch (err) {
      res.status(500).json({ error: `Failed to fetch ${section}.` });
    }
  });

  // POST add item to section
  router.post(`/${section}`, protect, async (req, res) => {
    try {
      const profile = await getOrCreateProfile(req.user._id);
      profile[section].push(req.body);
      await profile.save();
      const newItem = profile[section][profile[section].length - 1];
      res.status(201).json({ message: 'Item added!', item: newItem });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: `Failed to add to ${section}.` });
    }
  });

  // PUT update specific item in section
  router.put(`/${section}/:itemId`, protect, async (req, res) => {
    try {
      const profile = await getOrCreateProfile(req.user._id);
      const item = profile[section].id(req.params.itemId);
      if (!item) return res.status(404).json({ error: 'Item not found.' });
      Object.assign(item, req.body);
      await profile.save();
      res.json({ message: 'Item updated!', item });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: `Failed to update item in ${section}.` });
    }
  });

  // DELETE specific item from section
  router.delete(`/${section}/:itemId`, protect, async (req, res) => {
    try {
      const profile = await getOrCreateProfile(req.user._id);
      profile[section].pull({ _id: req.params.itemId });
      await profile.save();
      res.json({ message: 'Item deleted!' });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: `Failed to delete from ${section}.` });
    }
  });
}

// Register all section routes
['education', 'career', 'achievements', 'timeline', 'goals', 'memories', 'documents'].forEach(sectionRoutes);

// ========================
// PUT /api/profile/user-info
// Update user account info (fullName, username)
// ========================
router.put('/user-info', protect, async (req, res) => {
  try {
    const { fullName, username } = req.body;
    const user = await User.findById(req.user._id);

    if (fullName) user.fullName = fullName;
    if (username) {
      const existing = await User.findOne({ username: username.toLowerCase(), _id: { $ne: user._id } });
      if (existing) return res.status(409).json({ error: 'Username already taken.' });
      user.username = username.toLowerCase();
    }

    await user.save();
    res.json({ message: 'User info updated!', user });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update user info.' });
  }
});

module.exports = router;
