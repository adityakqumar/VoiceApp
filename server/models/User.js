const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

const generateCallId = () => {
  // Generate a short, human-friendly call ID like "CALL-A3F8K2"
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // no I, O, 0, 1 to avoid confusion
  let id = '';
  for (let i = 0; i < 6; i++) {
    id += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `CALL-${id}`;
};

const userSchema = new mongoose.Schema({
  internalId: {
    type: String,
    default: uuidv4,
    unique: true,
    index: true,
  },
  displayName: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    minlength: 2,
    maxlength: 30,
  },
  callId: {
    type: String,
    default: generateCallId,
    unique: true,
    index: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// IMPORTANT: Never return private info in JSON responses
userSchema.methods.toSafeJSON = function () {
  return {
    internalId: this.internalId,
    displayName: this.displayName,
    callId: this.callId,
  };
};

// Ensure callId uniqueness on save
userSchema.pre('save', async function (next) {
  if (this.isNew && !this.callId) {
    let unique = false;
    while (!unique) {
      this.callId = generateCallId();
      const existing = await mongoose.model('User').findOne({ callId: this.callId });
      if (!existing) unique = true;
    }
  }
  next();
});

module.exports = mongoose.model('User', userSchema);
