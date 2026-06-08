/**
 * MetaPersona - Main Server Entry Point
 * Premium Digital Life Management Platform
 */

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// =====================
// Rate Limiting
// =====================
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200,
  message: { error: 'Too many requests, please try again later.' }
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { error: 'Too many authentication attempts, please try again later.' }
});

// =====================
// Middleware
// =====================
app.use(cors({ origin: '*', credentials: true }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(limiter);

// Serve static files from /public
app.use(express.static(path.join(__dirname, 'public')));

// Serve uploaded files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// =====================
// Routes
// =====================
const authRoutes = require('./routes/auth');
const profileRoutes = require('./routes/profile');
const folderRoutes = require('./routes/folders');
const adminRoutes = require('./routes/admin');

app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/folders', folderRoutes);
app.use('/api/admin', adminRoutes);

// =====================
// Serve Frontend Pages
// =====================
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/dashboard', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'dashboard.html'));
});

app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'admin.html'));
});

// Catch-all: send index.html for unknown routes (SPA behavior)
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// =====================
// Global Error Handler
// =====================
app.use((err, req, res, next) => {
  console.error('Server Error:', err.stack);
  res.status(err.status || 500).json({
    error: err.message || 'Internal Server Error'
  });
});

// =====================
// MongoDB Connection & Start
// =====================
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log('✅ MongoDB connected successfully');
    app.listen(PORT, () => {
      console.log(`🚀 MetaPersona server running at http://localhost:${PORT}`);
      console.log(`📊 Admin panel: http://localhost:${PORT}/admin`);
    });
  })
  .catch((err) => {
    console.error('❌ MongoDB connection failed:', err.message);
    process.exit(1);
  });

module.exports = app;
