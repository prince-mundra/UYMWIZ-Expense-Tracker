import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement,
  ArcElement, Tooltip, Legend, Filler,
} from 'chart.js';
import { Line, Doughnut } from 'react-chartjs-2';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { CAT_EMOJI } from '../utils/constants';
import { format } from 'date-fns';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, ArcElement, Tooltip, Legend, Filler);

const MONTH_NAMES = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const CATEGORY_COLORS = [
  '#00d4aa','#7c6fff','#ff5e7d','#ffb547','#38bdf8','#a78bfa',
  '#fb7185','#34d399','#fbbf24','#60a5fa','#c084fc','#f472b6',
];

function StatCard({ label, value, sub, color = 'teal', icon, delay = 0 }) {
  const colorMap = {
    teal: { bg: 'bg-teal/10', text: 'text-teal-400', border: 'border-teal/20', glow: 'shadow-teal/10' },
    rose: { bg: 'bg-rose/10', text: 'text-rose', border: 'border-rose/20', glow: 'shadow-rose/10' },
    violet: { bg: 'bg-violet/10', text: 'text-violet', border: 'border-violet/20', glow: 'shadow-violet/10' },
    amber: { bg: 'bg-amber/10', text: 'text-amber', border: 'border-amber/20', glow: 'shadow-amber/10' },
  };
  const c = colorMap[color];

  return (
    <div
      className={`stat-card ${c.glow} animate-fade-up`}
      style={{ animationDelay: `${delay}ms`, animationFillMode: 'both', opacity: 0 }}
    >
      <div className="flex items-start justify-between">
        <div className={`w-9 h-9 rounded-xl ${c.bg} border ${c.border} flex items-center justify-center text-base`}
             aria-hidden="true">
          {icon}
        </div>
        {sub && <span className="text-xs text-slate-500 font-body">{sub}</span>}
      </div>
      <div>
        <p className="text-slate-400 text-xs uppercase tracking-wider font-body mt-1">{label}</p>
        <p className={`font-display font-bold text-2xl ${c.text} mt-0.5`}>{value}</p>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const currency = user?.currency === 'USD' ? '$' : '₹';

  const fmt = (n) => `${currency}${Number(n || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;

  const fetchStats = useCallback(async () => {
    try {
      const res = await api.get('/expenses/stats');
      setStats(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchStats(); }, [fetchStats]);

  const trendData = (() => {
    if (!stats?.monthlyTrend) return null;
    const now = new Date();
    const months = Array.from({ length: 6 }, (_, i) => {
      const d = new Date(now.getFullYear(), now.getMonth() - 5 + i, 1);
      return { month: d.getMonth() + 1, year: d.getFullYear(), label: MONTH_NAMES[d.getMonth()] };
    });

    const expenses = months.map((m) => {
      const found = stats.monthlyTrend.find(
        (t) => t._id.month === m.month && t._id.year === m.year && t._id.type === 'expense'
      );
      return found?.total || 0;
    });
    const income = months.map((m) => {
      const found = stats.monthlyTrend.find(
        (t) => t._id.month === m.month && t._id.year === m.year && t._id.type === 'income'
      );
      return found?.total || 0;
    });

    return {
      labels: months.map((m) => m.label),
      datasets: [
        {
          label: 'Expenses',
          data: expenses,
          borderColor: '#ff5e7d',
          backgroundColor: 'rgba(255,94,125,0.08)',
          fill: true, tension: 0.4,
          pointBackgroundColor: '#ff5e7d', pointRadius: 4, pointHoverRadius: 6,
        },
        {
          label: 'Income',
          data: income,
          borderColor: '#00d4aa',
          backgroundColor: 'rgba(0,212,170,0.08)',
          fill: true, tension: 0.4,
          pointBackgroundColor: '#00d4aa', pointRadius: 4, pointHoverRadius: 6,
        },
      ],
    };
  })();

  const donutData = (() => {
    if (!stats?.categoryBreakdown?.length) return null;
    const top = stats.categoryBreakdown.slice(0, 8);
    return {
      labels: top.map((c) => c._id),
      datasets: [{
        data: top.map((c) => c.total),
        backgroundColor: CATEGORY_COLORS.slice(0, top.length),
        borderColor: '#0f1625',
        borderWidth: 3,
        hoverBorderWidth: 1,
      }],
    };
  })();

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: '#161e30',
        borderColor: 'rgba(255,255,255,0.08)',
        borderWidth: 1,
        titleColor: '#e2e8f0',
        bodyColor: '#94a3b8',
        padding: 12,
        callbacks: { label: (ctx) => ` ${currency}${ctx.raw.toLocaleString()}` },
      },
    },
    scales: {
      x: { grid: { color: 'rgba(255,255,255,0.04)' }, ticks: { color: '#475569', font: { family: 'DM Sans' } } },
      y: {
        grid: { color: 'rgba(255,255,255,0.04)' },
        ticks: { color: '#475569', font: { family: 'DM Sans' }, callback: (v) => `${currency}${(v/1000).toFixed(0)}k` },
      },
    },
  };

  const donutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: '72%',
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: '#161e30',
        borderColor: 'rgba(255,255,255,0.08)',
        borderWidth: 1,
        titleColor: '#e2e8f0',
        bodyColor: '#94a3b8',
        padding: 12,
        callbacks: { label: (ctx) => ` ${currency}${ctx.raw.toLocaleString()}` },
      },
    },
  };

  if (loading) {
    return (
      <div className="space-y-6" aria-busy="true" aria-label="Loading dashboard">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="skeleton h-28 rounded-2xl" />
          ))}
        </div>
        <div className="grid lg:grid-cols-3 gap-6">
          <div className="skeleton h-72 rounded-2xl lg:col-span-2" />
          <div className="skeleton h-72 rounded-2xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 page-enter">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display font-bold text-2xl text-white">Dashboard</h2>
          <p className="text-slate-500 text-sm mt-0.5 font-body">
            {format(new Date(), 'MMMM yyyy')} overview
          </p>
        </div>
        <Link to="/add" className="btn-primary flex items-center gap-2 text-sm">
          <span className="text-base font-bold" aria-hidden="true">+</span> Add Transaction
        </Link>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Expenses" value={fmt(stats?.totalExpenses)} sub="all time" color="rose" icon="↓" delay={0} />
        <StatCard label="Total Income" value={fmt(stats?.totalIncome)} sub="all time" color="teal" icon="↑" delay={80} />
        <StatCard label="Net Savings" value={fmt(stats?.totalSavings)} sub="all time" color={stats?.totalSavings >= 0 ? 'teal' : 'rose'} icon="◈" delay={160} />
        <StatCard label="This Month" value={fmt(stats?.monthExpenses)} sub="spending" color="violet" icon="◷" delay={240} />
      </div>

      {/* Streak cards */}
      <div className="grid grid-cols-2 gap-4">
        <div className="card p-4 flex items-center gap-4" style={{ animationDelay: '320ms' }}>
          <div className="w-12 h-12 rounded-2xl bg-amber/10 border border-amber/20 flex items-center justify-center text-2xl flex-shrink-0" aria-hidden="true">
            🔥
          </div>
          <div>
            <p className="text-xs text-slate-500 uppercase tracking-wider font-body">Current Streak</p>
            <p className="font-display font-bold text-xl text-amber">{stats?.currentStreak || 0} days</p>
          </div>
        </div>
        <div className="card p-4 flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-teal/10 border border-teal/20 flex items-center justify-center text-2xl flex-shrink-0" aria-hidden="true">
            🏆
          </div>
          <div>
            <p className="text-xs text-slate-500 uppercase tracking-wider font-body">Best Streak</p>
            <p className="font-display font-bold text-xl text-teal-400">{stats?.bestSavingStreak || 0} days</p>
          </div>
        </div>
      </div>

      {/* Charts row */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Line chart */}
        <div className="card p-6 lg:col-span-2">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-display font-semibold text-white">Spending vs Income</h3>
            <div className="flex items-center gap-4 text-xs text-slate-500" aria-hidden="true">
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-rose inline-block" />Expenses</span>
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-teal inline-block" />Income</span>
            </div>
          </div>
          <div className="chart-container h-56">
            {trendData ? (
              <Line
                data={trendData}
                options={chartOptions}
                aria-label="6-month spending vs income line chart"
                role="img"
              />
            ) : (
              <div className="h-full flex items-center justify-center text-slate-600 text-sm">
                No transaction data yet
              </div>
            )}
          </div>
        </div>

        {/* Donut chart */}
        <div className="card p-6">
          <h3 className="font-display font-semibold text-white mb-6">This Month by Category</h3>
          <div className="chart-container h-44">
            {donutData ? (
              <Doughnut
                data={donutData}
                options={donutOptions}
                aria-label="Expense breakdown by category doughnut chart"
                role="img"
              />
            ) : (
              <div className="h-full flex items-center justify-center text-slate-600 text-sm">
                No expenses this month
              </div>
            )}
          </div>
          {donutData && (
            <div className="mt-4 space-y-2 max-h-32 overflow-y-auto" role="list" aria-label="Category breakdown">
              {stats.categoryBreakdown.slice(0, 6).map((cat, i) => (
                <div key={cat._id} className="flex items-center justify-between text-xs" role="listitem">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: CATEGORY_COLORS[i] }} aria-hidden="true" />
                    <span className="text-slate-400 truncate max-w-[100px]">{cat._id}</span>
                  </div>
                  <span className="text-slate-300 font-medium">{fmt(cat.total)}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Recent transactions */}
      <div className="card p-6">
        <div className="flex items-center justify-between mb-5">
          <h3 className="font-display font-semibold text-white">Recent Transactions</h3>
          <Link to="/history" className="text-teal-400 text-sm hover:text-teal transition-colors">
            View all →
          </Link>
        </div>
        {stats?.recentTransactions?.length ? (
          <div className="space-y-3" role="list">
            {stats.recentTransactions.map((t) => (
              <div key={t._id} className="flex items-center gap-4 p-3 rounded-xl hover:bg-white/[0.03] transition-colors group" role="listitem">
                <div
                  className={`w-9 h-9 rounded-xl flex items-center justify-center text-sm flex-shrink-0
                    ${t.type === 'income' ? 'bg-teal/10 border border-teal/20' : 'bg-rose/10 border border-rose/20'}`}
                  aria-hidden="true"
                >
                  {CAT_EMOJI[t.category] || (t.type === 'income' ? '↑' : '↓')}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-white text-sm font-medium truncate">{t.title}</p>
                  <p className="text-slate-500 text-xs">{t.category} · {format(new Date(t.date), 'MMM d, yyyy')}</p>
                </div>
                <span className={`font-display font-semibold text-sm flex-shrink-0
                  ${t.type === 'income' ? 'text-teal-400' : 'text-rose'}`}>
                  {t.type === 'income' ? '+' : '-'}{fmt(t.amount)}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-10">
            <p className="text-slate-600 text-sm mb-3">No transactions yet</p>
            <Link to="/add" className="btn-primary text-sm">Add your first transaction</Link>
          </div>
        )}
      </div>
    </div>
  );
}
