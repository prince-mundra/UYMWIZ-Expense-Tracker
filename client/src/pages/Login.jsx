import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

export default function Login() {
  const [form, setForm] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const { addToast } = useToast();
  const navigate = useNavigate();

  const handleChange = (e) => setForm((p) => ({ ...p, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.email || !form.password) return addToast('Please fill all fields', 'warning');
    setLoading(true);
    try {
      await login(form.email, form.password);
      addToast('Welcome back! 👋', 'success');
      navigate('/');
    } catch (err) {
      addToast(err.response?.data?.message || 'Login failed', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-navy-950 flex items-center justify-center p-4 relative overflow-hidden">
      <div className="orb orb-teal" />
      <div className="orb orb-violet" />

      <div className="w-full max-w-md relative z-10 page-enter">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-teal to-teal/30 shadow-xl shadow-teal/20 mb-5">
            <span className="text-2xl text-navy-950 font-bold">₿</span>
          </div>
          <h1 className="font-display font-bold text-3xl text-white mb-2">Welcome back</h1>
          <p className="text-slate-500 font-body">Sign in to manage your finances</p>
        </div>

        {/* Card */}
        <div className="card-glow p-8">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="label">Email address</label>
              <input
                type="email"
                name="email"
                value={form.email}
                onChange={handleChange}
                className="input-field"
                placeholder="you@example.com"
                autoComplete="email"
              />
            </div>
            <div>
              <label className="label">Password</label>
              <input
                type="password"
                name="password"
                value={form.password}
                onChange={handleChange}
                className="input-field"
                placeholder="••••••••"
                autoComplete="current-password"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full mt-2 flex items-center justify-center gap-2 py-3"
            >
              {loading ? (
                <>
                  <span className="w-4 h-4 rounded-full border-2 border-navy-950/30 border-t-navy-950 animate-spin" />
                  Signing in...
                </>
              ) : (
                'Sign In'
              )}
            </button>
          </form>

          <p className="text-center mt-6 text-sm text-slate-500">
            Don't have an account?{' '}
            <Link to="/register" className="text-teal-400 hover:text-teal font-medium transition-colors">
              Create one →
            </Link>
          </p>
        </div>

        <p className="text-center mt-6 text-xs text-slate-600">
          UYMWIZ · Use Your Money Wisely
        </p>
      </div>
    </div>
  );
}
