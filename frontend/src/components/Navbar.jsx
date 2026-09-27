import React from 'react';
import { Bot, Store, Globe, LogOut, ExternalLink, User } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Navbar({ activeRoute, setActiveRoute }) {
  const { user, shop, language, changeLanguage, logout, t } = useAuth();

  return (
    <header className="sticky top-0 z-40 bg-slate-900/90 backdrop-blur-md border-b border-slate-800 px-4 lg:px-8 py-3.5">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
        {/* Logo */}
        <div 
          onClick={() => setActiveRoute(user ? 'dashboard' : 'login')}
          className="flex items-center gap-3 cursor-pointer group"
        >
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white shadow-lg shadow-emerald-500/20 group-hover:scale-105 transition-transform">
            <Bot className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-lg lg:text-xl tracking-tight text-white font-sans">
                {t.appName}
              </span>
              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                AI Voice
              </span>
            </div>
            <p className="text-[11px] text-slate-400 font-medium hidden sm:block">
              {t.tagline}
            </p>
          </div>
        </div>

        {/* Right Action Menu */}
        <div className="flex items-center gap-3">
          {/* Multilingual Selector (English, Hindi, Telugu, Tamil) */}
          <div className="flex items-center gap-1.5 bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-300">
            <Globe className="w-3.5 h-3.5 text-emerald-400" />
            <select
              value={language}
              onChange={(e) => changeLanguage(e.target.value)}
              className="bg-transparent text-slate-200 outline-none cursor-pointer font-medium"
            >
              <option value="en" className="bg-slate-900 text-white">English (EN)</option>
              <option value="hi" className="bg-slate-900 text-white">हिंदी (Hindi)</option>
              <option value="te" className="bg-slate-900 text-white">తెలుగు (Telugu)</option>
              <option value="ta" className="bg-slate-900 text-white">தமிழ் (Tamil)</option>
            </select>
          </div>

          {/* User Logged In state */}
          {user ? (
            <div className="flex items-center gap-2 sm:gap-3">
              <button
                onClick={() => setActiveRoute('customer-chat')}
                className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 transition"
                title="Open Live Customer Chat View"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>{t.navCustomerView}</span>
              </button>

              <div className="flex items-center gap-2 pl-2 border-l border-slate-800">
                <div className="hidden md:block text-right">
                  <div className="text-xs font-bold text-slate-200">{shop?.name || 'My Shop'}</div>
                  <div className="text-[10px] text-slate-400">{user.phone}</div>
                </div>
                <button
                  onClick={logout}
                  className="p-2 text-slate-400 hover:text-red-400 hover:bg-slate-800 rounded-lg transition"
                  title={t.navLogout}
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <button
                onClick={() => setActiveRoute('customer-chat')}
                className="px-3 py-1.5 text-xs font-semibold text-slate-300 hover:text-white rounded-lg hover:bg-slate-800 transition"
              >
                {t.navCustomerView}
              </button>
              <button
                onClick={() => setActiveRoute('login')}
                className="px-3.5 py-1.5 text-xs font-bold bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg shadow-sm transition"
              >
                {t.navLogin}
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
