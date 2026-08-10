const express = require('express');
const mongoose = require('mongoose');
const Expense = require('../models/Expense');
const User = require('../models/User');
const auth = require('../middleware/auth');

const router = express.Router();

const toObjectId = (id) => mongoose.Types.ObjectId.createFromHexString(id);

// GET /api/expenses - list with filters, sort, search
router.get('/', auth, async (req, res) => {
  try {
    const {
      page = 1, limit = 20, category, type, sortBy = 'date', order = 'desc',
      search, startDate, endDate, month, year,
    } = req.query;

    const query = { user: req.user.id };
    if (category) query.category = category;
    if (type) query.type = type;
    if (search) query.title = { $regex: search, $options: 'i' };
    if (startDate || endDate) {
      query.date = {};
      if (startDate) query.date.$gte = new Date(startDate);
      if (endDate) query.date.$lte = new Date(endDate);
    }
    if (month && year) {
      const start = new Date(year, month - 1, 1);
      const end = new Date(year, month, 0, 23, 59, 59);
      query.date = { $gte: start, $lte: end };
    }

    const sortOrder = order === 'asc' ? 1 : -1;
    const sortField = sortBy === 'amount' ? 'amount' : 'date';

    const total = await Expense.countDocuments(query);
    const expenses = await Expense.find(query)
      .sort({ [sortField]: sortOrder })
      .limit(Number(limit))
      .skip((Number(page) - 1) * Number(limit));

    res.json({ expenses, total, page: Number(page), pages: Math.ceil(total / limit) });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/expenses/stats - dashboard statistics (cached 5 min)
router.get('/stats', auth, async (req, res) => {
  try {
    const cache = req.app.get('cache');
    const cacheKey = `stats_${req.user.id}`;
    const cached = cache && cache.get(cacheKey);
    if (cached) return res.json(cached);

    const userId = toObjectId(req.user.id);
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
    const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1);

    const [totals, monthExpenses, categoryBreakdown, monthlyTrend, recentTransactions, user] =
      await Promise.all([
        // All-time totals grouped by type
        Expense.aggregate([
          { $match: { user: userId } },
          { $group: { _id: '$type', total: { $sum: '$amount' } } },
        ]),
        // This month expenses
        Expense.aggregate([
          { $match: { user: userId, type: 'expense', date: { $gte: monthStart, $lte: monthEnd } } },
          { $group: { _id: null, total: { $sum: '$amount' } } },
        ]),
        // Category breakdown this month
        Expense.aggregate([
          { $match: { user: userId, type: 'expense', date: { $gte: monthStart, $lte: monthEnd } } },
          { $group: { _id: '$category', total: { $sum: '$amount' }, count: { $sum: 1 } } },
          { $sort: { total: -1 } },
        ]),
        // Last 6 months trend
        Expense.aggregate([
          { $match: { user: userId, date: { $gte: sixMonthsAgo } } },
          {
            $group: {
              _id: { month: { $month: '$date' }, year: { $year: '$date' }, type: '$type' },
              total: { $sum: '$amount' },
            },
          },
          { $sort: { '_id.year': 1, '_id.month': 1 } },
        ]),
        Expense.find({ user: req.user.id }).sort({ date: -1 }).limit(5),
        User.findById(req.user.id).select('bestSavingStreak currentStreak'),
      ]);

    const totalIncome = totals.find((t) => t._id === 'income')?.total || 0;
    const totalExpenses = totals.find((t) => t._id === 'expense')?.total || 0;

    const result = {
      totalExpenses,
      totalIncome,
      totalSavings: totalIncome - totalExpenses,
      monthExpenses: monthExpenses[0]?.total || 0,
      categoryBreakdown,
      monthlyTrend,
      recentTransactions,
      bestSavingStreak: user?.bestSavingStreak || 0,
      currentStreak: user?.currentStreak || 0,
    };

    if (cache) cache.set(cacheKey, result);
    res.json(result);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/expenses/export - download as CSV
router.get('/export', auth, async (req, res) => {
  try {
    const expenses = await Expense.find({ user: req.user.id }).sort({ date: -1 }).limit(5000);

    const headers = ['Date', 'Title', 'Type', 'Category', 'Payment Method', 'Amount', 'Notes'];
    const rows = expenses.map((e) => [
      new Date(e.date).toLocaleDateString('en-IN'),
      `"${e.title.replace(/"/g, '""')}"`,
      e.type,
      e.category,
      e.paymentMethod,
      e.amount,
      `"${(e.notes || '').replace(/"/g, '""')}"`,
    ]);

    const csv = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="uymwiz-transactions.csv"');
    res.send(csv);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/expenses - create
router.post('/', auth, async (req, res) => {
  try {
    const { title, amount, category, paymentMethod, date, notes, type, isRecurring, recurringFrequency } = req.body;
    if (!title || !amount || !category || !paymentMethod)
      return res.status(400).json({ message: 'Title, amount, category, and payment method are required' });

    const expense = await Expense.create({
      user: req.user.id, title, amount, category, paymentMethod,
      date: date || new Date(), notes, type: type || 'expense',
      isRecurring: isRecurring || false,
      recurringFrequency: isRecurring ? recurringFrequency : null,
    });

    // Invalidate stats cache
    const cache = req.app.get('cache');
    if (cache) cache.del(`stats_${req.user.id}`);

    await updateStreak(req.user.id);
    res.status(201).json(expense);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PUT /api/expenses/:id - update
router.put('/:id', auth, async (req, res) => {
  try {
    const expense = await Expense.findOne({ _id: req.params.id, user: req.user.id });
    if (!expense) return res.status(404).json({ message: 'Expense not found' });

    const updated = await Expense.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });

    const cache = req.app.get('cache');
    if (cache) cache.del(`stats_${req.user.id}`);

    res.json(updated);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// DELETE /api/expenses/:id - delete
router.delete('/:id', auth, async (req, res) => {
  try {
    const expense = await Expense.findOne({ _id: req.params.id, user: req.user.id });
    if (!expense) return res.status(404).json({ message: 'Expense not found' });
    await expense.deleteOne();

    const cache = req.app.get('cache');
    if (cache) cache.del(`stats_${req.user.id}`);

    res.json({ message: 'Expense deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

async function updateStreak(userId) {
  try {
    const user = await User.findById(userId);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    const todayExpense = await Expense.findOne({ user: userId, date: { $gte: today } });
    if (!todayExpense) return;

    if (!user.lastStreakDate) {
      user.currentStreak = 1;
    } else {
      const lastDate = new Date(user.lastStreakDate);
      lastDate.setHours(0, 0, 0, 0);
      if (lastDate.getTime() === yesterday.getTime()) {
        user.currentStreak += 1;
      } else if (lastDate.getTime() < yesterday.getTime()) {
        user.currentStreak = 1;
      }
    }
    user.lastStreakDate = today;
    if (user.currentStreak > user.bestSavingStreak) {
      user.bestSavingStreak = user.currentStreak;
    }
    await user.save();
  } catch (err) {
    console.error('Streak update error:', err);
  }
}

module.exports = router;
