// Shared constants — single source of truth for categories and payment methods
const CATEGORIES = [
  'Food & Dining',
  'Transport',
  'Shopping',
  'Bills & Utilities',
  'Entertainment',
  'Health & Medical',
  'Education',
  'Travel',
  'Housing & Rent',
  'Personal Care',
  'Investments',
  'Gifts & Donations',
  'Sports & Fitness',
  'Electronics',
  'Other',
];

const PAYMENT_METHODS = [
  'Cash',
  'Credit Card',
  'Debit Card',
  'UPI',
  'Net Banking',
  'Wallet',
];

const CAT_EMOJI = {
  'Food & Dining': '🍔',
  Transport: '🚗',
  Shopping: '🛍️',
  'Bills & Utilities': '⚡',
  Entertainment: '🎮',
  'Health & Medical': '🏥',
  Education: '📚',
  Travel: '✈️',
  'Housing & Rent': '🏠',
  'Personal Care': '💅',
  Investments: '📈',
  'Gifts & Donations': '🎁',
  'Sports & Fitness': '💪',
  Electronics: '💻',
  Other: '📦',
};

module.exports = { CATEGORIES, PAYMENT_METHODS, CAT_EMOJI };
