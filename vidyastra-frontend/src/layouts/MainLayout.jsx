import React from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { Brain, LayoutDashboard, MessageSquare, LogOut, Settings, Sparkles, BookOpen } from 'lucide-react';
import useAuthStore from '../store/authStore';

const navItems = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/chat', label: 'AI Tutor', icon: MessageSquare },
  { to: '/review', label: 'Review Tools', icon: BookOpen },
  { to: '/ai-lab', label: 'AI Lab', icon: Sparkles, badge: 'NEW' },
  { to: '/settings', label: 'Settings', icon: Settings },
];

const MainLayout = () => {
  const logout = useAuthStore((s) => s.logout);
  const navigate = useNavigate();
  const location = useLocation();

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
        
        <nav className="flex-1 px-4 space-y-1 mt-4">
          {navItems.map(item => {
            const isActive = location.pathname === item.to;
            const Icon = item.icon;
            return (
              <Link
                key={item.to}
                to={item.to}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                  isActive
                    ? 'bg-gradient-to-r from-saffron-500/20 to-primary-600/10 text-white border border-saffron-500/30'
                    : 'text-gray-400 hover:bg-white/10 hover:text-white'
                }`}
              >
                <Icon size={20} className={isActive ? 'text-saffron-500' : ''} />
                {item.label}
                {item.badge && (
                  <span className="ml-auto text-[10px] bg-gradient-to-r from-saffron-500 to-primary-600 text-white px-1.5 py-0.5 rounded-full font-bold">
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
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
