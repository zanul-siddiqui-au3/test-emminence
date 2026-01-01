const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['credit', 'debit', 'commission', 'recharge'],
    required: true
  },
  amount: {
    type: Number,
    required: [true, 'Transaction amount is required'],
    min: [0.01, 'Amount must be greater than 0']
  },
  senderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  receiverId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  balanceAfter: {
    type: Number,
    required: true
  },
  commission: {
    type: Number,
    default: 0
  },
  description: {
    type: String,
    trim: true,
    maxlength: 500
  },
  status: {
    type: String,
    enum: ['completed', 'failed'],
    default: 'completed'
  }
}, {
  timestamps: true
});


module.exports = mongoose.model('Transaction', transactionSchema);