import { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { CATEGORIES, CAT_EMOJI } from '../utils/constants';

export default function History() {
  const { user } = useAuth();
  const { addToast } = useToast();
  const navigate = useNavigate();
  const currency = user?.currency === 'USD' ? '$' : '₹';
  const fmt = (n) => `${currency}${Number(n || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;

  const [expenses, setExpenses] = useState([]);
  const [total, setTotal] = useState(0);
  const [pages, setPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [deleteId, setDeleteId] = useState(null);
  const [exporting, setExporting] = useState(false);

  const [filters, setFilters] = useState({
    page: 1, search: '', category: '', type: '', sortBy: 'date', order: 'desc',
  });

  const fetchExpenses = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([k, v]) => { if (v) params.set(k, v); });
      params.set('limit', '15');
      const res = await api.get(`/expenses?${params}`);
      setExpenses(res.data.expenses);
      setTotal(res.data.total);
      setPages(res.data.pages);
    } catch (err) {
      addToast('Failed to load transactions', 'error');
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => { fetchExpenses(); }, [fetchExpenses]);

  const handleDelete = async (id) => {
    try {
      await api.delete(`/expenses/${id}`);
      addToast('Transaction deleted', 'success');
      setDeleteId(null);
      fetchExpenses();
    } catch {
      addToast('Failed to delete', 'error');
    }
  };

  const handleExport = async () => {
    setExporting(true);
    try {
      const res = await api.get('/expenses/export', { responseType: 'blob' });
      const url = URL.createObjectURL(new Blob([res.data], { type: 'text/csv' }));
      const a = document.createElement('a');
      a.href = url;
      a.download = 'uymwiz-transactions.csv';
      a.click();
      URL.revokeObjectURL(url);
      addToast('CSV exported! 📥', 'success');
    } catch {
      addToast('Export failed', 'error');
    } finally {
      setExporting(false);
    }
  };

  const updateFilter = (key, val) => setFilters((p) => ({ ...p, [key]: val, page: 1 }));

  return (
    <div className="space-y-5 page-enter">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display font-bold text-2xl text-white">History</h2>
          <p className="text-slate-500 text-sm mt-0.5 font-body">{total} transactions total</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleExport}
            disabled={exporting}
            className="btn-ghost flex items-center gap-2 text-sm"
            aria-label="Export transactions as CSV"
          >
            {exporting ? (
              <span className="w-4 h-4 rounded-full border-2 border-slate-500/30 border-t-slate-400 animate-spin" />
            ) : '↓'}
            CSV
          </button>
          <Link to="/add" className="btn-primary flex items-center gap-2 text-sm">
            <span className="text-base font-bold">+</span> Add
          </Link>
        </div>
      </div>

      {/* Filters */}
      <div className="card p-4 space-y-3">
        <div className="flex flex-col sm:flex-row gap-3">
          <input
            type="text" placeholder="Search transactions..."
            value={filters.search}
            onChange={(e) => updateFilter('search', e.target.value)}
            className="input-field flex-1 py-2.5 text-sm"
            aria-label="Search transactions"
          />
          <select
            value={filters.category}
            onChange={(e) => updateFilter('category', e.target.value)}
            className="input-field sm:w-44 py-2.5 text-sm"
            aria-label="Filter by category"
          >
            <option value="">All Categories</option>
            {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
          <select
            value={filters.type}
            onChange={(e) => updateFilter('type', e.target.value)}
            className="input-field sm:w-36 py-2.5 text-sm"
            aria-label="Filter by type"
          >
            <option value="">All Types</option>
            <option value="expense">Expense</option>
            <option value="income">Income</option>
          </select>
        </div>
        <div className="flex gap-2 flex-wrap">
          {[
            { label: 'Latest First', sortBy: 'date', order: 'desc' },
            { label: 'Oldest First', sortBy: 'date', order: 'asc' },
            { label: 'Highest Amount', sortBy: 'amount', order: 'desc' },
            { label: 'Lowest Amount', sortBy: 'amount', order: 'asc' },
          ].map(({ label, sortBy, order }) => (
            <button
              key={label}
              onClick={() => setFilters((p) => ({ ...p, sortBy, order, page: 1 }))}
              className={`text-xs px-3 py-1.5 rounded-lg border transition-all
                ${filters.sortBy === sortBy && filters.order === order
                  ? 'bg-teal/15 border-teal/30 text-teal-400'
                  : 'bg-navy-700/50 border-white/[0.05] text-slate-500 hover:text-slate-300'
                }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Transactions list */}
      <div className="card overflow-hidden">
        {loading ? (
          <div className="p-6 space-y-3">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="skeleton h-16 rounded-xl" />
            ))}
          </div>
        ) : expenses.length === 0 ? (
          <div className="p-12 text-center">
            <p className="text-4xl mb-3">📊</p>
            <p className="text-white font-display font-semibold mb-1">No transactions found</p>
            <p className="text-slate-500 text-sm mb-4">Try adjusting your filters or add a new transaction</p>
            <Link to="/add" className="btn-primary text-sm">Add Transaction</Link>
          </div>
        ) : (
          <div className="divide-y divide-white/[0.04]">
            {expenses.map((t) => (
              <div key={t._id} className="flex items-center gap-4 px-5 py-4 hover:bg-white/[0.02] transition-colors group">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg flex-shrink-0
                  ${t.type === 'income' ? 'bg-teal/10' : 'bg-navy-700'}`}>
                  {CAT_EMOJI[t.category] || '📦'}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-white text-sm font-medium truncate">{t.title}</p>
                    {t.isRecurring && (
                      <span className="text-xs px-1.5 py-0.5 rounded-md bg-amber/10 text-amber-400 border border-amber/20 flex-shrink-0">
                        ↻ {t.recurringFrequency}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-slate-500 text-xs">{t.category}</span>
                    <span className="text-slate-700 text-xs">·</span>
                    <span className="text-slate-500 text-xs">{t.paymentMethod}</span>
                    <span className="text-slate-700 text-xs">·</span>
                    <span className="text-slate-500 text-xs">{format(new Date(t.date), 'MMM d, yyyy')}</span>
                  </div>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className={`font-display font-semibold text-sm ${t.type === 'income' ? 'text-teal-400' : 'text-rose'}`}>
                    {t.type === 'income' ? '+' : '-'}{fmt(t.amount)}
                  </p>
                  <div className="flex gap-1.5 mt-1 justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => navigate(`/add?edit=${t._id}`)}
                      className="text-xs px-2.5 py-1 rounded-lg bg-teal/10 text-teal-400 hover:bg-teal/20 transition-colors"
                      aria-label={`Edit ${t.title}`}
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => setDeleteId(t._id)}
                      className="text-xs px-2.5 py-1 rounded-lg bg-rose/10 text-rose hover:bg-rose/20 transition-colors"
                      aria-label={`Delete ${t.title}`}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Pagination */}
      {pages > 1 && (
        <div className="flex justify-center gap-2" role="navigation" aria-label="Transaction pages">
          {Array.from({ length: Math.min(pages, 10) }, (_, i) => (
            <button
              key={i}
              onClick={() => setFilters((p) => ({ ...p, page: i + 1 }))}
              aria-label={`Page ${i + 1}`}
              aria-current={filters.page === i + 1 ? 'page' : undefined}
              className={`w-9 h-9 rounded-xl text-sm font-medium transition-all
                ${filters.page === i + 1
                  ? 'bg-teal/15 text-teal-400 border border-teal/30'
                  : 'bg-navy-800 text-slate-500 hover:text-slate-300 border border-white/[0.05]'
                }`}
            >
              {i + 1}
            </button>
          ))}
        </div>
      )}

      {/* Delete confirmation modal */}
      {deleteId && (
        <div
          className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 backdrop-blur-sm"
          onClick={() => setDeleteId(null)}
          role="dialog"
          aria-modal="true"
          aria-labelledby="delete-dialog-title"
        >
          <div className="card-glow p-6 w-full max-w-sm mx-4 animate-fade-up" onClick={(e) => e.stopPropagation()}>
            <div className="w-12 h-12 rounded-2xl bg-rose/10 border border-rose/20 flex items-center justify-center text-rose text-xl mx-auto mb-4">⚠</div>
            <h3 id="delete-dialog-title" className="font-display font-bold text-white text-center text-lg mb-2">Delete Transaction</h3>
            <p className="text-slate-500 text-center text-sm mb-6">This action cannot be undone. Are you sure?</p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteId(null)} className="btn-ghost flex-1">Cancel</button>
              <button onClick={() => handleDelete(deleteId)} className="btn-danger flex-1">Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
