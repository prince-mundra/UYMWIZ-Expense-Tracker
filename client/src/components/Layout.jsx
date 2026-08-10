import { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const NAV_ITEMS = [
  { to: '/', label: 'Dashboard', icon: '⬡', end: true },
  { to: '/add', label: 'Add Transaction', icon: '+' },
  { to: '/history', label: 'History', icon: '◷' },
  { to: '/budget', label: 'Budget', icon: '◎' },
];

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen flex bg-navy-950 relative overflow-hidden">
      {/* Background orbs */}
      <div className="orb orb-teal" />
      <div className="orb orb-violet" />

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-20 lg:hidden backdrop-blur-sm"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 h-full z-30 flex flex-col w-64
          bg-navy-900/95 backdrop-blur-xl border-r border-white/[0.06]
          transition-transform duration-300 lg:translate-x-0
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}
      >
        {/* Logo */}
        <div className="p-6 border-b border-white/[0.06]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-teal to-teal/40 flex items-center justify-center shadow-lg shadow-teal/20">
              <span className="text-navy-950 font-bold text-sm font-display">₿</span>
            </div>
            <div>
              <h1 className="font-display font-bold text-white text-lg leading-none">UYMWIZ</h1>
              <p className="text-[10px] text-slate-500 mt-0.5 tracking-widest uppercase">Finance Manager</p>
            </div>
          </div>
        </div>

        {/* User Card */}
        <div className="mx-4 mt-4 mb-2 p-3.5 rounded-xl bg-white/[0.03] border border-white/[0.06]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-violet to-teal/50 flex items-center justify-center text-white font-semibold font-display text-sm flex-shrink-0">
              {user?.name?.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0">
              <p className="text-white text-sm font-medium font-display truncate">{user?.name}</p>
              <p className="text-slate-500 text-xs truncate">{user?.email}</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 py-4 space-y-1 overflow-y-auto">
          <p className="text-[10px] text-slate-600 uppercase tracking-widest px-4 mb-2 font-display">Menu</p>
          {NAV_ITEMS.map(({ to, label, icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              onClick={() => setSidebarOpen(false)}
              className={({ isActive }) =>
                `nav-item ${isActive ? 'active' : ''}`
              }
            >
              <span className="text-lg w-6 text-center leading-none">{icon}</span>
              <span className="text-sm">{label}</span>
            </NavLink>
          ))}
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-white/[0.06]">
          <button
            onClick={handleLogout}
            className="w-full nav-item text-rose/70 hover:text-rose hover:bg-rose/10 justify-center"
          >
            <span className="text-base">⏻</span>
            <span className="text-sm">Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col lg:ml-64 min-h-screen relative z-10">
        {/* Top bar */}
        <header className="h-16 flex items-center justify-between px-6 border-b border-white/[0.06] bg-navy-900/60 backdrop-blur-xl sticky top-0 z-10">
          <button
            className="lg:hidden p-2 rounded-lg hover:bg-white/5 text-slate-400"
            onClick={() => setSidebarOpen(true)}
          >
            <span className="text-xl">☰</span>
          </button>
          <div className="hidden lg:flex items-center gap-2">
            <span className="text-slate-500 text-sm font-body">Welcome back,</span>
            <span className="text-white text-sm font-semibold font-display">{user?.name?.split(' ')[0]}</span>
          </div>
          <div className="flex items-center gap-3 ml-auto">
            <div className="badge bg-teal/10 text-teal-400 border border-teal/20">
              <span className="w-1.5 h-1.5 rounded-full bg-teal animate-pulse-slow" />
              <span className="text-xs">{user?.currency || 'INR'}</span>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 p-6 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
