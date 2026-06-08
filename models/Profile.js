/**
 * Profile Model
 * Stores all user life data: personal info, education, career, etc.
 */

const mongoose = require('mongoose');

// ========================
// Sub-schemas
// ========================

const educationSchema = new mongoose.Schema({
  institution: { type: String, required: true },
  degree: { type: String, default: '' },
  field: { type: String, default: '' },
  startYear: { type: String, default: '' },
  endYear: { type: String, default: '' },
  grade: { type: String, default: '' },
  description: { type: String, default: '' }
}, { _id: true, timestamps: true });

const careerSchema = new mongoose.Schema({
  company: { type: String, required: true },
  position: { type: String, default: '' },
  startDate: { type: String, default: '' },
  endDate: { type: String, default: '' },
  current: { type: Boolean, default: false },
  location: { type: String, default: '' },
  description: { type: String, default: '' },
  salary: { type: String, default: '' }
}, { _id: true, timestamps: true });

const achievementSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, default: '' },
  date: { type: String, default: '' },
  category: { type: String, default: 'General' },
  issuer: { type: String, default: '' }
}, { _id: true, timestamps: true });

const timelineSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, default: '' },
  date: { type: String, default: '' },
  category: { type: String, default: 'Life Event' },
  icon: { type: String, default: '⭐' }
}, { _id: true, timestamps: true });

const goalSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, default: '' },
  targetDate: { type: String, default: '' },
  category: { type: String, default: 'Personal' },
  priority: { type: String, enum: ['Low', 'Medium', 'High'], default: 'Medium' },
  status: { type: String, enum: ['Not Started', 'In Progress', 'Completed', 'On Hold'], default: 'Not Started' },
  progress: { type: Number, min: 0, max: 100, default: 0 }
}, { _id: true, timestamps: true });

const memorySchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, default: '' },
  date: { type: String, default: '' },
  location: { type: String, default: '' },
  mood: { type: String, default: '😊' },
  tags: [{ type: String }],
  images: [{ type: String }]
}, { _id: true, timestamps: true });

const documentSchema = new mongoose.Schema({
  name: { type: String, required: true },
  type: { type: String, default: 'Document' },
  description: { type: String, default: '' },
  fileUrl: { type: String, default: '' },
  fileSize: { type: String, default: '' },
  uploadedAt: { type: Date, default: Date.now }
}, { _id: true });

// ========================
// Main Profile Schema
// ========================
const profileSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true
    },
    personalInfo: {
      phone: { type: String, default: '' },
      dateOfBirth: { type: String, default: '' },
      gender: { type: String, default: '' },
      nationality: { type: String, default: '' },
      address: { type: String, default: '' },
      city: { type: String, default: '' },
      country: { type: String, default: '' },
      bio: { type: String, default: '' },
      website: { type: String, default: '' },
      linkedin: { type: String, default: '' },
      github: { type: String, default: '' },
      twitter: { type: String, default: '' },
      skills: [{ type: String }],
      languages: [{ type: String }],
      interests: [{ type: String }]
    },
    education: [educationSchema],
    career: [careerSchema],
    achievements: [achievementSchema],
    timeline: [timelineSchema],
    goals: [goalSchema],
    memories: [memorySchema],
    documents: [documentSchema]
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model('Profile', profileSchema);
