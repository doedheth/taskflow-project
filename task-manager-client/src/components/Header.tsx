import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useMobileMenu } from '../context/MobileMenuContext';
import { useTheme } from '../context/ThemeContext';
import { User, Settings, LogOut, Menu, CheckCircle2, Sun, Moon } from 'lucide-react';
import NotificationDropdown from './NotificationDropdown';

const pageTitles: Record<string, string> = {
  '/': 'Dashboard',
  '/tickets': 'All Tickets',
  '/board': 'Kanban Board',
  '/departments': 'Departments',
  '/users': 'User Management',
  '/profile': 'Profile Settings',
  '/sprints': 'Sprints',
  '/epics': 'Epics',
  '/timeline': 'Timeline',
  '/performance': 'Performance',
};

export default function Header() {
  const location = useLocation();
  const { user, logout } = useAuth();
  const { toggle } = useMobileMenu();
  const { theme, toggleTheme } = useTheme();
  const [showUserMenu, setShowUserMenu] = useState(false);

  const currentTitle = pageTitles[location.pathname] || 'TaskFlow';
  const isDark = theme === 'dark';

  return (
    <>
      <header className={`h-14 md:h-16 border-b backdrop-blur-xl flex items-center justify-between px-3 md:px-6 sticky top-0 z-40 transition-colors
        ${isDark
          ? 'border-dark-800/50 bg-dark-900/30'
          : 'border-gray-200 bg-white/80'
        }`}>
        {/* Left side - Mobile menu button and title */}
        <div className="flex items-center gap-2 md:gap-4">
          {/* Hamburger menu - mobile only */}
          <button
            onClick={toggle}
            className={`lg:hidden p-2 rounded-lg transition-colors
              ${isDark
                ? 'text-dark-400 hover:text-white hover:bg-dark-800'
                : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100'
              }`}
          >
            <Menu className="w-5 h-5" />
          </button>

          {/* Logo for mobile */}
          <div className="flex items-center gap-2 lg:hidden">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-violet-600 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4 text-white" />
            </div>
            <span className={`font-bold text-sm ${isDark ? 'text-white' : 'text-gray-900'}`}>TaskFlow</span>
          </div>

          {/* Page title - desktop only */}
          <h2 className={`hidden lg:block text-xl font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
            {currentTitle}
          </h2>
        </div>

        {/* Right side - actions */}
        <div className="flex items-center gap-2 md:gap-3">
          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            className={`p-2 rounded-xl transition-all duration-300
              ${isDark
                ? 'bg-dark-800 hover:bg-dark-700 text-yellow-400'
                : 'bg-gray-100 hover:bg-gray-200 text-blue-600'
              }`}
            title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          >
            <div className="relative w-5 h-5">
              <Sun
                className={`w-5 h-5 transition-all duration-300 absolute inset-0
                  ${isDark ? 'rotate-0 scale-100 opacity-100' : '-rotate-90 scale-0 opacity-0'}
                `}
              />
              <Moon
                className={`w-5 h-5 transition-all duration-300
                  ${!isDark ? 'rotate-0 scale-100 opacity-100' : 'rotate-90 scale-0 opacity-0'}
                `}
              />
            </div>
          </button>

          {/* Notifications */}
          <NotificationDropdown />

          {/* User Menu */}
          <div className="relative">
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className={`flex items-center gap-2 p-1.5 md:p-2 rounded-xl transition-colors
                ${isDark ? 'hover:bg-dark-800' : 'hover:bg-gray-100'}`}
            >
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-violet-600 flex items-center justify-center text-white text-sm font-semibold">
                {user?.name?.charAt(0).toUpperCase()}
              </div>
            </button>

            {showUserMenu && (
              <>
                <div
                  className="fixed inset-0 z-10"
                  onClick={() => setShowUserMenu(false)}
                />
                <div className={`absolute right-0 top-full mt-2 w-48 rounded-xl shadow-xl z-20 overflow-hidden
                  ${isDark
                    ? 'bg-dark-800 border border-dark-700'
                    : 'bg-white border border-gray-200'
                  }`}>
                  <div className={`p-3 border-b ${isDark ? 'border-dark-700' : 'border-gray-100'}`}>
                    <p className={`text-sm font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>{user?.name}</p>
                    <p className={`text-xs ${isDark ? 'text-dark-400' : 'text-gray-500'}`}>{user?.email}</p>
                  </div>
                  <div className="p-1">
                    <Link
                      to="/profile"
                      onClick={() => setShowUserMenu(false)}
                      className={`flex items-center gap-2 w-full px-3 py-2 text-sm rounded-lg transition-colors
                        ${isDark
                          ? 'text-dark-300 hover:text-white hover:bg-dark-700'
                          : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                        }`}
                    >
                      <User className="w-4 h-4" />
                      Profile
                    </Link>
                    <Link
                      to="/profile"
                      onClick={() => setShowUserMenu(false)}
                      className={`flex items-center gap-2 w-full px-3 py-2 text-sm rounded-lg transition-colors
                        ${isDark
                          ? 'text-dark-300 hover:text-white hover:bg-dark-700'
                          : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                        }`}
                    >
                      <Settings className="w-4 h-4" />
                      Settings
                    </Link>
                    <button
                      onClick={() => {
                        setShowUserMenu(false);
                        logout();
                      }}
                      className="flex items-center gap-2 w-full px-3 py-2 text-sm text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                    >
                      <LogOut className="w-4 h-4" />
                      Logout
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </header>
    </>
  );
}
