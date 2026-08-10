const mongoose = require('mongoose');
const { CATEGORIES, PAYMENT_METHODS } = require('../constants');

const expenseSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    title: { type: String, required: true, trim: true },
    amount: { type: Number, required: true, min: 0 },
    category: { type: String, required: true, enum: CATEGORIES },
    paymentMethod: { type: String, required: true, enum: PAYMENT_METHODS },
    date: { type: Date, required: true, default: Date.now },
    notes: { type: String, trim: true, maxlength: 500 },
    type: { type: String, enum: ['expense', 'income'], default: 'expense' },
    isRecurring: { type: Boolean, default: false },
    recurringFrequency: { type: String, enum: ['weekly', 'monthly', 'yearly', null], default: null },
  },
  { timestamps: true }
);

// Compound indexes for common query patterns (big perf boost on stats & history)
expenseSchema.index({ user: 1, date: -1, type: 1 });
expenseSchema.index({ user: 1, category: 1, date: -1 });

module.exports = mongoose.model('Expense', expenseSchema);
module.exports.CATEGORIES = CATEGORIES;
module.exports.PAYMENT_METHODS = PAYMENT_METHODS;
