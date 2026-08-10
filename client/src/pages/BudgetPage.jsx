import { useState, useEffect, useCallback } from 'react';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { CATEGORIES, CAT_EMOJI } from '../utils/constants';

const MONTH_NAMES = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

const BUDGET_CATEGORIES = CATEGORIES.slice(0, 10);

export default function BudgetPage() {
  const { user } = useAuth();
  const { addToast } = useToast();
  const currency = user?.currency === 'USD' ? '$' : '₹';
  const fmt = (n) => `${currency}${Number(n || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;

  const now = new Date();
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(now.getFullYear());
  const [budgetData, setBudgetData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ totalBudget: '', savingsGoal: '', categoryLimits: {} });

  const fetchBudget = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get(`/budgets?month=${selectedMonth}&year=${selectedYear}`);
      setBudgetData(res.data);
      if (res.data.budget) {
        const catMap = {};
        res.data.budget.categoryLimits?.forEach((cl) => { catMap[cl.category] = String(cl.limit); });
        setForm({
          totalBudget: String(res.data.budget.totalBudget),
          savingsGoal: String(res.data.budget.savingsGoal || ''),
          categoryLimits: catMap,
        });
      } else {
        setForm({ totalBudget: '', savingsGoal: '', categoryLimits: {} });
      }
    } catch (err) {
      addToast('Failed to load budget', 'error');
    } finally {
      setLoading(false);
    }
  }, [selectedMonth, selectedYear]);

  useEffect(() => { fetchBudget(); }, [fetchBudget]);

  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.totalBudget || Number(form.totalBudget) <= 0)
      return addToast('Please enter a valid total budget', 'warning');

    setSaving(true);
    try {
      const categoryLimits = Object.entries(form.categoryLimits)
        .filter(([, v]) => v && Number(v) > 0)
        .map(([category, limit]) => ({ category, limit: Number(limit) }));

      await api.post('/budgets', {
        month: selectedMonth, year: selectedYear,
        totalBudget: Number(form.totalBudget),
        savingsGoal: Number(form.savingsGoal) || 0,
        categoryLimits,
      });
      addToast('Budget saved! 🎯', 'success');
      setEditing(false);
      fetchBudget();
    } catch (err) {
      addToast(err.response?.data?.message || 'Failed to save budget', 'error');
    } finally {
      setSaving(false);
    }
  };

  const totalSpent = budgetData?.totalSpent || 0;
  const totalBudget = budgetData?.budget?.totalBudget || 0;
  const spentPct = totalBudget ? Math.min((totalSpent / totalBudget) * 100, 100) : 0;
  const overBudget = totalBudget > 0 && totalSpent > totalBudget;

  return (
    <div className="space-y-6 page-enter">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display font-bold text-2xl text-white">Budget</h2>
          <p className="text-slate-500 text-sm mt-0.5 font-body">Set and track your monthly limits</p>
        </div>
        {budgetData?.budget && !editing && (
          <button onClick={() => setEditing(true)} className="btn-ghost text-sm">Edit Budget</button>
        )}
      </div>

      {/* Month selector */}
      <div className="card p-4 flex items-center gap-3 flex-wrap">
        <select
          value={selectedMonth}
          onChange={(e) => setSelectedMonth(Number(e.target.value))}
          className="input-field py-2 text-sm w-36"
          aria-label="Select month"
        >
          {MONTH_NAMES.map((m, i) => (
            <option key={m} value={i + 1}>{m}</option>
          ))}
        </select>
        <select
          value={selectedYear}
          onChange={(e) => setSelectedYear(Number(e.target.value))}
          className="input-field py-2 text-sm w-28"
          aria-label="Select year"
        >
          {[now.getFullYear() - 1, now.getFullYear(), now.getFullYear() + 1].map((y) => (
            <option key={y} value={y}>{y}</option>
          ))}
        </select>
      </div>

      {loading ? (
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => <div key={i} className="skeleton h-24 rounded-2xl" />)}
        </div>
      ) : editing || !budgetData?.budget ? (
        /* Budget form */
        <div className="card-glow p-6">
          <h3 className="font-display font-semibold text-white mb-5">
            {budgetData?.budget ? 'Edit' : 'Set'} Budget for {MONTH_NAMES[selectedMonth - 1]} {selectedYear}
          </h3>
          <form onSubmit={handleSave} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">Total Budget ({currency}) <span className="text-rose">*</span></label>
                <input
                  type="number" value={form.totalBudget} min="0"
                  onChange={(e) => setForm((p) => ({ ...p, totalBudget: e.target.value }))}
                  className="input-field" placeholder="e.g. 30000"
                />
              </div>
              <div>
                <label className="label">Savings Goal ({currency})</label>
                <input
                  type="number" value={form.savingsGoal} min="0"
                  onChange={(e) => setForm((p) => ({ ...p, savingsGoal: e.target.value }))}
                  className="input-field" placeholder="e.g. 5000"
                />
              </div>
            </div>

            <div>
              <label className="label mb-3">Category Limits (optional)</label>
              <div className="grid grid-cols-2 gap-3">
                {BUDGET_CATEGORIES.map((cat) => (
                  <div key={cat} className="flex items-center gap-2 bg-navy-700/30 rounded-xl px-3 py-2.5 border border-white/[0.05]">
                    <span className="text-base flex-shrink-0">{CAT_EMOJI[cat]}</span>
                    <span className="text-xs text-slate-400 flex-1 truncate">{cat}</span>
                    <input
                      type="number" min="0"
                      value={form.categoryLimits[cat] || ''}
                      onChange={(e) => setForm((p) => ({
                        ...p,
                        categoryLimits: { ...p.categoryLimits, [cat]: e.target.value },
                      }))}
                      className="w-20 bg-transparent border border-white/10 rounded-lg px-2 py-1 text-xs text-white text-right focus:outline-none focus:border-teal/40"
                      placeholder="0"
                      aria-label={`Budget limit for ${cat}`}
                    />
                  </div>
                ))}
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              {editing && (
                <button type="button" onClick={() => setEditing(false)} className="btn-ghost flex-1">Cancel</button>
              )}
              <button type="submit" disabled={saving} className="btn-primary flex-1 flex items-center justify-center gap-2">
                {saving ? (
                  <><span className="w-4 h-4 rounded-full border-2 border-navy-950/30 border-t-navy-950 animate-spin" />Saving...</>
                ) : 'Save Budget'}
              </button>
            </div>
          </form>
        </div>
      ) : (
        /* Budget overview */
        <div className="space-y-5">
          {/* Overall progress */}
          <div className={`card-glow p-6 ${overBudget ? 'border-rose/30' : ''}`}>
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-display font-semibold text-white">Total Spending</h3>
              <span className={`text-sm font-medium ${overBudget ? 'text-rose' : 'text-slate-400'}`}>
                {overBudget ? '⚠ Over budget!' : `${Math.round(spentPct)}% used`}
              </span>
            </div>
            <div className="flex items-end gap-2 mb-3">
              <span className={`font-display font-bold text-3xl ${overBudget ? 'text-rose' : 'text-white'}`}>
                {fmt(totalSpent)}
              </span>
              <span className="text-slate-500 text-sm mb-1">of {fmt(totalBudget)}</span>
            </div>
            <div className="h-2.5 bg-navy-700 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-700 ${overBudget ? 'bg-rose' : spentPct > 80 ? 'bg-amber-400' : 'bg-teal-400'}`}
                style={{ width: `${spentPct}%` }}
                role="progressbar"
                aria-valuenow={Math.round(spentPct)}
                aria-valuemin={0}
                aria-valuemax={100}
              />
            </div>
            {budgetData.budget.savingsGoal > 0 && (
              <p className="text-slate-500 text-xs mt-3">
                Savings goal: {fmt(budgetData.budget.savingsGoal)} ·
                {totalBudget - totalSpent >= budgetData.budget.savingsGoal
                  ? <span className="text-teal-400"> On track ✓</span>
                  : <span className="text-rose"> Needs attention</span>
                }
              </p>
            )}
          </div>

          {/* Category breakdown */}
          {budgetData.budget.categoryLimits?.length > 0 && (
            <div className="card p-6">
              <h3 className="font-display font-semibold text-white mb-4">Category Limits</h3>
              <div className="space-y-4">
                {budgetData.budget.categoryLimits.map(({ category, limit }) => {
                  const spent = budgetData.spending?.find((s) => s._id === category)?.spent || 0;
                  const pct = limit ? Math.min((spent / limit) * 100, 100) : 0;
                  const over = spent > limit;
                  return (
                    <div key={category}>
                      <div className="flex items-center justify-between mb-1.5">
                        <div className="flex items-center gap-2">
                          <span>{CAT_EMOJI[category] || '📦'}</span>
                          <span className="text-sm text-slate-300">{category}</span>
                          {over && <span className="text-xs text-rose">Over!</span>}
                        </div>
                        <span className="text-xs text-slate-500">{fmt(spent)} / {fmt(limit)}</span>
                      </div>
                      <div className="h-1.5 bg-navy-700 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${over ? 'bg-rose' : pct > 80 ? 'bg-amber-400' : 'bg-teal-400'}`}
                          style={{ width: `${pct}%` }}
                          role="progressbar"
                          aria-valuenow={Math.round(pct)}
                          aria-valuemin={0}
                          aria-valuemax={100}
                          aria-label={`${category} budget usage`}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
