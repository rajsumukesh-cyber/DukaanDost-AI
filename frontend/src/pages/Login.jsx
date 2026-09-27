import React, { useState } from 'react';
import { Bot, Phone, Lock, ArrowRight, Store, Sparkles } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Login({ setActiveRoute }) {
  const { login, t } = useAuth();
  const [phone, setPhone] = useState('9876543210');
  const [password, setPassword] = useState('kirana123');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(phone, password);
      setActiveRoute('dashboard');
    } catch (err) {
      setError(err.message || 'Login failed. Please check credentials.');
    } finally {
      setLoading(false);
    }
  };

  const fillDemoAccount = (demoPhone, demoPass) => {
    setPhone(demoPhone);
    setPassword(demoPass);
  };

  return (
    <div className="min-h-[calc(100vh-80px)] flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-2xl relative overflow-hidden">
        {/* Glow accent */}
        <div className="absolute -top-16 -right-16 w-36 h-36 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />

        <div className="text-center mb-6">
          <div className="w-14 h-14 bg-gradient-to-tr from-emerald-500 to-teal-400 rounded-2xl flex items-center justify-center text-white mx-auto shadow-lg shadow-emerald-500/25 mb-3">
            <Store className="w-7 h-7" />
          </div>
          <h2 className="text-2xl font-bold text-white tracking-tight">{t.navLogin}</h2>
          <p className="text-xs text-slate-400 mt-1">
            Access your DukaanBot AI FAQ Manager & Voice Assistant
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-xs font-medium">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Phone Number
            </label>
            <div className="relative">
              <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="10-digit mobile number"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-slate-500 outline-none focus:border-emerald-500 transition"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Password / PIN
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Your password"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-slate-500 outline-none focus:border-emerald-500 transition"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 py-3 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-white rounded-xl font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 transition-all"
          >
            {loading ? 'Logging in...' : (
              <>
                <span>Login to Dashboard</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* 1-Click Demo Accounts */}
        <div className="mt-6 pt-5 border-t border-slate-800">
          <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            1-Click Demo Accounts (Pre-Seeded)
          </div>
          <div className="grid grid-cols-1 gap-1.5">
            <button
              type="button"
              onClick={() => fillDemoAccount('9876543210', 'kirana123')}
              className="text-left px-3 py-2 bg-slate-950 hover:bg-slate-800 border border-slate-800 rounded-lg text-xs flex justify-between items-center transition"
            >
              <span className="font-semibold text-emerald-400">🛒 Sharma Kirana Store</span>
              <span className="text-[10px] text-slate-400">Grocery (Noida)</span>
            </button>
            <button
              type="button"
              onClick={() => fillDemoAccount('9415011223', 'medicos123')}
              className="text-left px-3 py-2 bg-slate-950 hover:bg-slate-800 border border-slate-800 rounded-lg text-xs flex justify-between items-center transition"
            >
              <span className="font-semibold text-sky-400">💊 Gupta Medicos & Healthcare</span>
              <span className="text-[10px] text-slate-400">Pharmacy (Lucknow)</span>
            </button>
            <button
              type="button"
              onClick={() => fillDemoAccount('9444012345', 'murugan123')}
              className="text-left px-3 py-2 bg-slate-950 hover:bg-slate-800 border border-slate-800 rounded-lg text-xs flex justify-between items-center transition"
            >
              <span className="font-semibold text-orange-400">🥥 Murugan Provisions</span>
              <span className="text-[10px] text-slate-400">Provisions (Chennai)</span>
            </button>
          </div>
        </div>

        <div className="mt-6 text-center text-xs text-slate-400">
          New store owner?{' '}
          <button
            onClick={() => setActiveRoute('signup')}
            className="text-emerald-400 font-bold hover:underline"
          >
            {t.navSignup}
          </button>
        </div>
      </div>
    </div>
  );
}
