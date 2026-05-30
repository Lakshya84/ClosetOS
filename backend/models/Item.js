const mongoose = require('mongoose');

// Define loan log entry sub-schema
const LoanLogSchema = new mongoose.Schema({
  toStatus: {
    type: String,
    enum: ['IN_CLOSET', 'ON_LOAN', 'SENT_TO_STYLIST', 'AT_PR', 'MISSING'],
    required: true
  },
  recipientName: {
    type: String,
    default: ''
  },
  recipientContact: {
    type: String,
    default: ''
  },
  transferredAt: {
    type: Date,
    default: Date.now
  },
  expectedReturn: {
    type: Date
  },
  actualReturn: {
    type: Date
  }
}, { _id: true });

// Main Accessory Schema
const ItemSchema = new mongoose.Schema({
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  name: {
    type: String,
    required: [true, 'Accessory name is required'],
    trim: true
  },
  brand: {
    type: String,
    required: [true, 'Brand is required'],
    trim: true
  },
  category: {
    type: String,
    enum: ['Bag', 'Shoes', 'Jewellery', 'Sunglasses', 'Belt', 'Watch', 'Other'],
    required: [true, 'Category is required']
  },
  tags: {
    type: [String],
    default: []
  },
  coverImageUrl: {
    type: String,
    default: ''
  },
  status: {
    type: String,
    enum: ['IN_CLOSET', 'ON_LOAN', 'SENT_TO_STYLIST', 'AT_PR', 'MISSING'],
    default: 'IN_CLOSET',
    required: true
  },
  custodianName: {
    type: String,
    default: ''
  },
  custodianContact: {
    type: String,
    default: ''
  },
  returnDate: {
    type: Date
  },
  notes: {
    type: String,
    default: ''
  },
  purchasePrice: {
    type: Number
  },
  acquiredOn: {
    type: Date,
    default: Date.now
  },
  loanLog: {
    type: [LoanLogSchema],
    default: []
  }
}, {
  timestamps: true
});

// Enforce Compound Index on status and category for highly optimized lookups on the Dashboard
ItemSchema.index({ status: 1, category: 1 });

// Strictly enforced status state machine transitions
const ALLOWED_TRANSITIONS = {
  IN_CLOSET: ['ON_LOAN', 'SENT_TO_STYLIST', 'AT_PR', 'MISSING'],
  ON_LOAN: ['IN_CLOSET', 'MISSING'],
  SENT_TO_STYLIST: ['IN_CLOSET', 'MISSING'],
  AT_PR: ['IN_CLOSET', 'MISSING'],
  MISSING: [] // Lock state
};

// Static helper to check transition legitimacy
ItemSchema.statics.canTransition = function(fromStatus, toStatus) {
  // If the statuses are the same, it's not a change (though we typically want to block re-triggering transfers unnecessarily)
  if (fromStatus === toStatus) return true;
  
  const allowed = ALLOWED_TRANSITIONS[fromStatus];
  if (!allowed) return false;
  
  return allowed.includes(toStatus);
};

module.exports = mongoose.model('Item', ItemSchema);
