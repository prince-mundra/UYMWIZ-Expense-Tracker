import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

export default function Register() {
  const [form, setForm] = useState({ name: '', email: '', password: '', currency: 'INR' });
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const { addToast } = useToast();
  const navigate = useNavigate();

  const handleChange = (e) => setForm((p) => ({ ...p, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.password)
      return addToast('Please fill all fields', 'warning');
    if (form.password.length < 6)
      return addToast('Password must be at least 6 characters', 'warning');
    setLoading(true);
    try {
      await register(form.name, form.email, form.password, form.currency);
      addToast('Account created successfully! 🎉', 'success');
      navigate('/');
    } catch (err) {
      addToast(err.response?.data?.message || 'Registration failed', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-navy-950 flex items-center justify-center p-4 relative overflow-hidden">
      <div className="orb orb-teal" />
      <div className="orb orb-violet" />

      <div className="w-full max-w-md relative z-10 page-enter">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-teal to-teal/30 shadow-xl shadow-teal/20 mb-5">
            <span className="text-2xl text-navy-950 font-bold">₿</span>
          </div>
          <h1 className="font-display font-bold text-3xl text-white mb-2">Create account</h1>
          <p className="text-slate-500 font-body">Start your financial journey today</p>
        </div>

        <div className="card-glow p-8">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="label">Full Name</label>
              <input
                type="text"
                name="name"
                value={form.name}
                onChange={handleChange}
                className="input-field"
                placeholder="John Doe"
              />
            </div>
            <div>
              <label className="label">Email address</label>
              <input
                type="email"
                name="email"
                value={form.email}
                onChange={handleChange}
                className="input-field"
                placeholder="you@example.com"
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
                placeholder="Min. 6 characters"
              />
            </div>
            <div>
              <label className="label">Preferred Currency</label>
              <select
                name="currency"
                value={form.currency}
                onChange={handleChange}
                className="input-field"
              >
                <option value="INR">🇮🇳 INR – Indian Rupee</option>
                <option value="USD">🇺🇸 USD – US Dollar</option>
              </select>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full mt-2 flex items-center justify-center gap-2 py-3"
            >
              {loading ? (
                <>
                  <span className="w-4 h-4 rounded-full border-2 border-navy-950/30 border-t-navy-950 animate-spin" />
                  Creating account...
                </>
              ) : (
                'Create Account'
              )}
            </button>
          </form>

          <p className="text-center mt-6 text-sm text-slate-500">
            Already have an account?{' '}
            <Link to="/login" className="text-teal-400 hover:text-teal font-medium transition-colors">
              Sign in →
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
