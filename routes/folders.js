/**
 * Private Folders Routes
 * Create, open, manage password-protected folders
 */

const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const PrivateFolder = require('../models/PrivateFolder');
const bcrypt = require('bcryptjs');

// ========================
// GET /api/folders
// Get all folders (without items for performance)
// ========================
router.get('/', protect, async (req, res) => {
  try {
    const folders = await PrivateFolder.find({ userId: req.user._id })
      .select('-items')
      .sort({ createdAt: -1 });
    res.json({ folders });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch folders.' });
  }
});

// ========================
// POST /api/folders
// Create a new private folder
// ========================
router.post('/', protect, async (req, res) => {
  try {
    const { folderName, password, confirmPassword, emoji, color } = req.body;

    if (!folderName || !password) {
      return res.status(400).json({ error: 'Folder name and password are required.' });
    }
    if (password !== confirmPassword) {
      return res.status(400).json({ error: 'Passwords do not match.' });
    }
    if (password.length < 4) {
      return res.status(400).json({ error: 'Folder password must be at least 4 characters.' });
    }

    const folder = new PrivateFolder({
      userId: req.user._id,
      folderName,
      folderPasswordHash: password, // hashed by pre-save hook
      emoji: emoji || '🔒',
      color: color || '#6c63ff'
    });
    await folder.save();

    res.status(201).json({ message: 'Private folder created!', folder: { ...folder.toJSON(), itemCount: 0 } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to create folder.' });
  }
});

// ========================
// POST /api/folders/:id/unlock
// Unlock folder with password - returns folder items
// ========================
router.post('/:id/unlock', protect, async (req, res) => {
  try {
    const folder = await PrivateFolder.findOne({ _id: req.params.id, userId: req.user._id }).select('+folderPasswordHash');
    if (!folder) return res.status(404).json({ error: 'Folder not found.' });

    const { password } = req.body;
    if (!password) return res.status(400).json({ error: 'Password is required.' });

    const isMatch = await folder.comparePassword(password);
    if (!isMatch) return res.status(401).json({ error: 'Incorrect folder password.' });

    res.json({ message: 'Folder unlocked!', folder: folder.toJSON() });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to unlock folder.' });
  }
});

// ========================
// POST /api/folders/:id/items
// Add item to folder (requires password in header)
// ========================
router.post('/:id/items', protect, async (req, res) => {
  try {
    const folder = await PrivateFolder.findOne({ _id: req.params.id, userId: req.user._id }).select('+folderPasswordHash');
    if (!folder) return res.status(404).json({ error: 'Folder not found.' });

    const { password, type, title, content, fileUrl, fileName, fileSize } = req.body;
    if (!password) return res.status(400).json({ error: 'Folder password is required.' });

    const isMatch = await folder.comparePassword(password);
    if (!isMatch) return res.status(401).json({ error: 'Incorrect folder password.' });

    if (!title) return res.status(400).json({ error: 'Item title is required.' });

    folder.items.push({ type: type || 'note', title, content, fileUrl, fileName, fileSize });
    await folder.save();

    const newItem = folder.items[folder.items.length - 1];
    res.status(201).json({ message: 'Item added to folder!', item: newItem });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to add item.' });
  }
});

// ========================
// PUT /api/folders/:id/items/:itemId
// Edit item inside folder
// ========================
router.put('/:id/items/:itemId', protect, async (req, res) => {
  try {
    const folder = await PrivateFolder.findOne({ _id: req.params.id, userId: req.user._id }).select('+folderPasswordHash');
    if (!folder) return res.status(404).json({ error: 'Folder not found.' });

    const { password, ...updates } = req.body;
    if (!password) return res.status(400).json({ error: 'Folder password is required.' });

    const isMatch = await folder.comparePassword(password);
    if (!isMatch) return res.status(401).json({ error: 'Incorrect folder password.' });

    const item = folder.items.id(req.params.itemId);
    if (!item) return res.status(404).json({ error: 'Item not found.' });

    Object.assign(item, updates);
    await folder.save();
    res.json({ message: 'Item updated!', item });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update item.' });
  }
});

// ========================
// DELETE /api/folders/:id/items/:itemId
// Delete item from folder
// ========================
router.delete('/:id/items/:itemId', protect, async (req, res) => {
  try {
    const folder = await PrivateFolder.findOne({ _id: req.params.id, userId: req.user._id }).select('+folderPasswordHash');
    if (!folder) return res.status(404).json({ error: 'Folder not found.' });

    const { password } = req.body;
    const isMatch = await folder.comparePassword(password);
    if (!isMatch) return res.status(401).json({ error: 'Incorrect folder password.' });

    folder.items.pull({ _id: req.params.itemId });
    await folder.save();
    res.json({ message: 'Item deleted!' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to delete item.' });
  }
});

// ========================
// PUT /api/folders/:id
// Rename folder or change password
// ========================
router.put('/:id', protect, async (req, res) => {
  try {
    const folder = await PrivateFolder.findOne({ _id: req.params.id, userId: req.user._id }).select('+folderPasswordHash');
    if (!folder) return res.status(404).json({ error: 'Folder not found.' });

    const { currentPassword, folderName, newPassword, emoji, color } = req.body;
    if (!currentPassword) return res.status(400).json({ error: 'Current password is required.' });

    const isMatch = await folder.comparePassword(currentPassword);
    if (!isMatch) return res.status(401).json({ error: 'Incorrect folder password.' });

    if (folderName) folder.folderName = folderName;
    if (emoji) folder.emoji = emoji;
    if (color) folder.color = color;
    if (newPassword) {
      folder.folderPasswordHash = newPassword; // Will be re-hashed
    } else {
      // Skip re-hashing if only renaming
      folder.$set({ folderName: folder.folderName });
    }

    await folder.save();
    res.json({ message: 'Folder updated!', folder: folder.toJSON() });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update folder.' });
  }
});

// ========================
// DELETE /api/folders/:id
// Delete entire folder
// ========================
router.delete('/:id', protect, async (req, res) => {
  try {
    const folder = await PrivateFolder.findOne({ _id: req.params.id, userId: req.user._id }).select('+folderPasswordHash');
    if (!folder) return res.status(404).json({ error: 'Folder not found.' });

    const { password } = req.body;
    if (!password) return res.status(400).json({ error: 'Password is required to delete folder.' });

    const isMatch = await folder.comparePassword(password);
    if (!isMatch) return res.status(401).json({ error: 'Incorrect folder password.' });

    await PrivateFolder.deleteOne({ _id: folder._id });
    res.json({ message: 'Folder deleted successfully!' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to delete folder.' });
  }
});

module.exports = router;
