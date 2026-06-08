/**
 * PrivateFolder Model
 * Password-protected folders for sensitive user data
 */

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const folderItemSchema = new mongoose.Schema({
  type: { type: String, enum: ['note', 'file', 'image'], default: 'note' },
  title: { type: String, required: true },
  content: { type: String, default: '' },
  fileUrl: { type: String, default: '' },
  fileName: { type: String, default: '' },
  fileSize: { type: String, default: '' },
  createdAt: { type: Date, default: Date.now }
}, { _id: true });

const privateFolderSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    folderName: {
      type: String,
      required: [true, 'Folder name is required'],
      trim: true,
      maxlength: [100, 'Folder name cannot exceed 100 characters']
    },
    folderPasswordHash: {
      type: String,
      required: true,
      select: false
    },
    emoji: {
      type: String,
      default: '🔒'
    },
    color: {
      type: String,
      default: '#6c63ff'
    },
    items: [folderItemSchema],
    isLocked: {
      type: Boolean,
      default: true
    }
  },
  {
    timestamps: true
  }
);

// Hash folder password before save
privateFolderSchema.pre('save', async function (next) {
  if (!this.isModified('folderPasswordHash')) return next();
  const salt = await bcrypt.genSalt(12);
  this.folderPasswordHash = await bcrypt.hash(this.folderPasswordHash, salt);
  next();
});

// Compare folder password
privateFolderSchema.methods.comparePassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.folderPasswordHash);
};

// Remove password hash from JSON output
privateFolderSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.folderPasswordHash;
  return obj;
};

module.exports = mongoose.model('PrivateFolder', privateFolderSchema);
