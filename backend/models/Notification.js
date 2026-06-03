const mongoose = require('mongoose');

const NotificationSchema = new mongoose.Schema({
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  type: {
    type: String,
    enum: ['UPDATE', 'DELETE', 'TRANSFER', 'OVERDUE'],
    required: true
  },
  title: {
    type: String,
    required: true,
    trim: true
  },
  message: {
    type: String,
    required: true,
    trim: true
  },
  read: {
    type: Boolean,
    default: false,
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Compound index for ultra-fast queries filtering unread alerts per user
NotificationSchema.index({ owner: 1, read: 1, createdAt: -1 });

module.exports = mongoose.model('Notification', NotificationSchema);
