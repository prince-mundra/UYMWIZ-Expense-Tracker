const express = require('express');
const Budget = require('../models/Budget');
const Expense = require('../models/Expense');
const auth = require('../middleware/auth');

const router = express.Router();

// GET /api/budgets?month=&year= - get budget for month
router.get('/', auth, async (req, res) => {
  try {
    const now = new Date();
    const month = Number(req.query.month) || now.getMonth() + 1;
    const year = Number(req.query.year) || now.getFullYear();

    let budget = await Budget.findOne({ user: req.user.id, month, year });

    // Get actual spending for this month
    const monthStart = new Date(year, month - 1, 1);
    const monthEnd = new Date(year, month, 0, 23, 59, 59);

    const spending = await Expense.aggregate([
      {
        $match: {
          user: require('mongoose').Types.ObjectId.createFromHexString(req.user.id),
          type: 'expense',
          date: { $gte: monthStart, $lte: monthEnd },
        },
      },
      { $group: { _id: '$category', spent: { $sum: '$amount' } } },
    ]);

    const totalSpent = spending.reduce((sum, s) => sum + s.spent, 0);

    res.json({ budget, spending, totalSpent, month, year });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/budgets - create or update
router.post('/', auth, async (req, res) => {
  try {
    const { month, year, totalBudget, savingsGoal, categoryLimits } = req.body;
    if (!month || !year || !totalBudget)
      return res.status(400).json({ message: 'Month, year, and totalBudget are required' });

    const budget = await Budget.findOneAndUpdate(
      { user: req.user.id, month, year },
      { totalBudget, savingsGoal, categoryLimits, user: req.user.id, month, year },
      { new: true, upsert: true, runValidators: true }
    );
    res.json(budget);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// DELETE /api/budgets/:id
router.delete('/:id', auth, async (req, res) => {
  try {
    const budget = await Budget.findOne({ _id: req.params.id, user: req.user.id });
    if (!budget) return res.status(404).json({ message: 'Budget not found' });
    await budget.deleteOne();
    res.json({ message: 'Budget deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
