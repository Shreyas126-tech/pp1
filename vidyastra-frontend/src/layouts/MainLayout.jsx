import React from 'react';
import { Outlet, Link, useNavigate } from 'react-router-dom';
import { Brain, LayoutDashboard, MessageSquare, LogOut, Settings } from 'lucide-react';
import useAuthStore from '../store/authStore';

const MainLayout = () => {
  const logout = useAuthStore((s) => s.logout);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <div className="flex h-screen bg-background-dark text-white overflow-hidden">
      {/* Sidebar */}
      <aside className="w-64 glass-dark border-r border-white/10 hidden md:flex flex-col">
        <div className="p-6 flex items-center gap-2">
          <Brain className="w-8 h-8 text-saffron-500" />
          <span className="text-xl font-bold text-gradient">VidyAstra</span>
        </div>
        
        <nav className="flex-1 px-4 space-y-2 mt-4">
          <Link to="/dashboard" className="flex items-center gap-3 px-4 py-3 rounded-lg bg-white/5 text-white hover:bg-white/10 transition">
            <LayoutDashboard size={20} />
            Dashboard
          </Link>
          <Link to="/chat" className="flex items-center gap-3 px-4 py-3 rounded-lg text-gray-400 hover:bg-white/10 hover:text-white transition">
            <MessageSquare size={20} />
            AI Tutor
          </Link>
          <Link to="/review" className="flex items-center gap-3 px-4 py-3 rounded-lg text-gray-400 hover:bg-white/10 hover:text-white transition">
            <Brain size={20} />
            Review Tools
          </Link>
          <Link to="/settings" className="flex items-center gap-3 px-4 py-3 rounded-lg text-gray-400 hover:bg-white/10 hover:text-white transition">
            <Settings size={20} />
            Settings
          </Link>
        </nav>
        
        <div className="p-4 border-t border-white/10">
          <button onClick={handleLogout} className="flex items-center gap-3 px-4 py-3 w-full rounded-lg text-gray-400 hover:bg-red-500/20 hover:text-red-400 transition">
            <LogOut size={20} />
            Logout
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col relative">
        <header className="h-16 glass border-b border-white/10 flex items-center justify-between px-6 md:hidden">
           <div className="flex items-center gap-2">
            <Brain className="w-6 h-6 text-saffron-500" />
            <span className="text-lg font-bold text-gradient">VidyAstra</span>
          </div>
        </header>
        <div className="flex-1 overflow-auto p-6 relative">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default MainLayout;
