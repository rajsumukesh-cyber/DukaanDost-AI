import React, { useState, useEffect } from 'react';
import { useAuth } from './context/AuthContext';
import Navbar from './components/Navbar';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Dashboard from './pages/Dashboard';
import CustomerChat from './pages/CustomerChat';

export default function App() {
  const { user, loading } = useAuth();

  // Detect route from URL params or hash
  const getInitialRoute = () => {
    const params = new URLSearchParams(window.location.search);
    const hash = window.location.hash.replace('#', '');

    if (params.get('embedded') === 'true' || params.get('shop_id') || hash === 'customer-chat' || hash === 'chat') {
      return 'customer-chat';
    }
    return user ? 'dashboard' : 'login';
  };

  const [activeRoute, setActiveRoute] = useState(getInitialRoute);

  // Sync route if user auth state changes and we're not explicitly in customer-chat
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const hash = window.location.hash.replace('#', '');
    if (params.get('embedded') === 'true' || params.get('shop_id') || hash === 'customer-chat') {
      return;
    }
    if (user && (activeRoute === 'login' || activeRoute === 'signup')) {
      setActiveRoute('dashboard');
    }
  }, [user]);

  // Keep window hash synced
  useEffect(() => {
    if (activeRoute) {
      window.location.hash = activeRoute;
    }
  }, [activeRoute]);

  // Listen to hash changes (e.g. user uses browser back/forward)
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.replace('#', '');
      if (['dashboard', 'login', 'signup', 'customer-chat'].includes(hash)) {
        setActiveRoute(hash);
      }
    };
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-slate-300">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center text-slate-950 font-bold animate-pulse shadow-lg shadow-emerald-500/30 mb-4">
          🏪
        </div>
        <p className="text-sm font-semibold tracking-wide">Starting DukaanBot...</p>
      </div>
    );
  }

  const isEmbedded = new URLSearchParams(window.location.search).get('embedded') === 'true';

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-emerald-500 selection:text-slate-950">
      {/* Hide navbar if in standalone embedded iframe mode */}
      {!isEmbedded && (
        <Navbar 
          activeRoute={activeRoute} 
          setActiveRoute={setActiveRoute} 
        />
      )}

      <main className="flex-1 flex flex-col">
        {activeRoute === 'customer-chat' && (
          <CustomerChat 
            onBackToDashboard={user ? () => setActiveRoute('dashboard') : null}
          />
        )}

        {activeRoute === 'dashboard' && (
          user ? (
            <Dashboard setActiveRoute={setActiveRoute} />
          ) : (
            <Login setActiveRoute={setActiveRoute} />
          )
        )}

        {activeRoute === 'login' && (
          <Login setActiveRoute={setActiveRoute} />
        )}

        {activeRoute === 'signup' && (
          <Signup setActiveRoute={setActiveRoute} />
        )}
      </main>
    </div>
  );
}
