import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { format } from 'date-fns';
import { CATEGORIES, PAYMENT_METHODS, CAT_EMOJI } from '../utils/constants';

export default function AddExpense() {
  const { user } = useAuth();
  const { addToast } = useToast();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const editId = searchParams.get('edit');

  const currency = user?.currency === 'USD' ? '$' : '₹';

  const [form, setForm] = useState({
    title: '', amount: '', category: 'Food & Dining', paymentMethod: 'UPI',
    date: format(new Date(), 'yyyy-MM-dd'), notes: '', type: 'expense',
    isRecurring: false, recurringFrequency: 'monthly',
  });
  const [loading, setLoading] = useState(false);
  const [fetchingEdit, setFetchingEdit] = useState(!!editId);

  useEffect(() => {
    if (editId) {
      setFetchingEdit(true);
      api.get(`/expenses?_id=${editId}`)
        .then((res) => {
          const exp = res.data.expenses?.[0];
          if (exp) {
            setForm({
              title: exp.title, amount: String(exp.amount), category: exp.category,
              paymentMethod: exp.paymentMethod, date: format(new Date(exp.date), 'yyyy-MM-dd'),
              notes: exp.notes || '', type: exp.type,
              isRecurring: exp.isRecurring || false,
              recurringFrequency: exp.recurringFrequency || 'monthly',
            });
          }
        })
        .catch(() => addToast('Could not load expense', 'error'))
        .finally(() => setFetchingEdit(false));
    }
  }, [editId]);

  const handleChange = (e) => {
    const { name, value, type: inputType, checked } = e.target;
    setForm((p) => ({ ...p, [name]: inputType === 'checkbox' ? checked : value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title || !form.amount || !form.category || !form.paymentMethod)
      return addToast('Please fill all required fields', 'warning');
    if (isNaN(form.amount) || Number(form.amount) <= 0)
      return addToast('Please enter a valid amount', 'warning');

    setLoading(true);
    try {
      const payload = {
        ...form,
        amount: Number(form.amount),
        recurringFrequency: form.isRecurring ? form.recurringFrequency : null,
      };
      if (editId) {
        await api.put(`/expenses/${editId}`, payload);
        addToast('Transaction updated!', 'success');
      } else {
        await api.post('/expenses', payload);
        addToast('Transaction added! 💸', 'success');
      }
      navigate('/history');
    } catch (err) {
      addToast(err.response?.data?.message || 'Failed to save', 'error');
    } finally {
      setLoading(false);
    }
  };

  if (fetchingEdit) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 rounded-full border-2 border-teal/30 border-t-teal animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto page-enter">
      <div className="mb-6">
        <h2 className="font-display font-bold text-2xl text-white">
          {editId ? 'Edit Transaction' : 'Add Transaction'}
        </h2>
        <p className="text-slate-500 text-sm mt-0.5 font-body">
          {editId ? 'Update the details below' : 'Log a new income or expense'}
        </p>
      </div>

      <div className="card-glow p-6 lg:p-8">
        {/* Type toggle */}
        <div className="flex gap-3 mb-6 p-1 bg-navy-700/50 rounded-xl">
          {['expense', 'income'].map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setForm((p) => ({ ...p, type: t }))}
              className={`flex-1 py-2.5 rounded-lg text-sm font-semibold font-display capitalize transition-all
                ${form.type === t
                  ? t === 'expense'
                    ? 'bg-rose/20 text-rose border border-rose/30'
                    : 'bg-teal/20 text-teal-400 border border-teal/30'
                  : 'text-slate-500 hover:text-slate-300'
                }`}
            >
              {t === 'expense' ? '↓ Expense' : '↑ Income'}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Title */}
          <div>
            <label className="label">Title <span className="text-rose">*</span></label>
            <input
              type="text" name="title" value={form.title} onChange={handleChange}
              className="input-field" placeholder="e.g. Lunch at Cafe, Salary..."
            />
          </div>

          {/* Amount + Date */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Amount ({currency}) <span className="text-rose">*</span></label>
              <input
                type="number" name="amount" value={form.amount} onChange={handleChange}
                className="input-field" placeholder="0.00" min="0" step="0.01"
              />
            </div>
            <div>
              <label className="label">Date <span className="text-rose">*</span></label>
              <input
                type="date" name="date" value={form.date} onChange={handleChange}
                className="input-field"
              />
            </div>
          </div>

          {/* Category */}
          <div>
            <label className="label">Category <span className="text-rose">*</span></label>
            <div className="grid grid-cols-3 sm:grid-cols-5 gap-2 mt-1">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat} type="button"
                  onClick={() => setForm((p) => ({ ...p, category: cat }))}
                  className={`flex flex-col items-center gap-1 p-2.5 rounded-xl text-xs font-medium transition-all border
                    ${form.category === cat
                      ? 'bg-teal/15 border-teal/40 text-teal-400'
                      : 'bg-navy-700/50 border-white/[0.05] text-slate-500 hover:border-white/10 hover:text-slate-300'
                    }`}
                >
                  <span className="text-base">{CAT_EMOJI[cat] || '📦'}</span>
                  <span className="text-center leading-tight line-clamp-2">{cat}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Payment method */}
          <div>
            <label className="label">Payment Method <span className="text-rose">*</span></label>
            <div className="flex flex-wrap gap-2">
              {PAYMENT_METHODS.map((pm) => (
                <button
                  key={pm} type="button"
                  onClick={() => setForm((p) => ({ ...p, paymentMethod: pm }))}
                  className={`px-3.5 py-2 rounded-xl text-sm font-medium transition-all border
                    ${form.paymentMethod === pm
                      ? 'bg-violet/15 border-violet/40 text-violet'
                      : 'bg-navy-700/50 border-white/[0.05] text-slate-500 hover:border-white/10 hover:text-slate-300'
                    }`}
                >
                  {pm}
                </button>
              ))}
            </div>
          </div>

          {/* Recurring */}
          {form.type === 'expense' && (
            <div className="rounded-xl border border-white/[0.06] bg-navy-700/30 p-4">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox" name="isRecurring" checked={form.isRecurring}
                  onChange={handleChange}
                  className="w-4 h-4 rounded accent-teal-400"
                />
                <span className="text-sm text-slate-300 font-medium">Recurring expense</span>
              </label>
              {form.isRecurring && (
                <div className="mt-3 flex gap-2">
                  {['weekly', 'monthly', 'yearly'].map((freq) => (
                    <button
                      key={freq} type="button"
                      onClick={() => setForm((p) => ({ ...p, recurringFrequency: freq }))}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all capitalize
                        ${form.recurringFrequency === freq
                          ? 'bg-amber/15 border-amber/40 text-amber-400'
                          : 'bg-navy-700/50 border-white/[0.05] text-slate-500 hover:text-slate-300'
                        }`}
                    >
                      {freq}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Notes */}
          <div>
            <label className="label">Notes (optional)</label>
            <textarea
              name="notes" value={form.notes} onChange={handleChange}
              className="input-field resize-none" rows={3}
              placeholder="Any additional details..."
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={() => navigate(-1)} className="btn-ghost flex-1">
              Cancel
            </button>
            <button type="submit" disabled={loading} className="btn-primary flex-1 flex items-center justify-center gap-2">
              {loading ? (
                <><span className="w-4 h-4 rounded-full border-2 border-navy-950/30 border-t-navy-950 animate-spin" />Saving...</>
              ) : editId ? 'Update Transaction' : 'Add Transaction'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
