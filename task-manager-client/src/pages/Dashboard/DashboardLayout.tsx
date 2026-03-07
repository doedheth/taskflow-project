import { ReactNode } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { Sun, Moon, User } from 'lucide-react';

interface DashboardLayoutProps {
  children: ReactNode;
  title?: string;
  subtitle?: string;
}

/**
 * DashboardLayout - Shared layout wrapper for all role-based dashboards
 *
 * Features:
 * - Header with user info and theme toggle
 * - Responsive grid container for widgets
 * - Consistent styling using design tokens
 *
 * Breakpoints:
 * - Mobile (<640px): Single column
 * - Tablet (640-1024px): 2 columns
 * - Desktop (>1024px): 3-4 columns
 */
export function DashboardLayout({ children, title, subtitle }: DashboardLayoutProps) {
  const { user } = useAuth();
  const { theme, toggleTheme } = useTheme();

  const greeting = getGreeting();
  const displayName = user?.name?.split(' ')[0] || 'User';

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 rounded-widget p-4 md:p-6 bg-surface-elevated border border-border">
        <div className="flex items-center gap-4">
          {/* User Avatar */}
          <div className="flex items-center justify-center w-12 h-12 rounded-full bg-primary/10 text-primary">
            <User className="w-6 h-6" />
          </div>

          <div>
            <h1 className="text-xl md:text-2xl font-bold text-text-primary">
              {title || `${greeting}, ${displayName}!`} 👋
            </h1>
            <p className="text-sm md:text-base text-text-secondary">
              {subtitle || getSubtitleByRole(user?.role)}
            </p>
          </div>
        </div>

        {/* Theme Toggle */}
        <button
          onClick={toggleTheme}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-surface hover:bg-surface-hover border border-border transition-colors"
          aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
        >
          {theme === 'dark' ? (
            <>
              <Sun className="w-5 h-5 text-yellow-500" />
              <span className="text-sm text-text-secondary hidden sm:inline">Light</span>
            </>
          ) : (
            <>
              <Moon className="w-5 h-5 text-blue-500" />
              <span className="text-sm text-text-secondary hidden sm:inline">Dark</span>
            </>
          )}
        </button>
      </div>

      {/* Widget Grid Container */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
        {children}
      </div>
    </div>
  );
}

/**
 * Get time-based greeting
 */
function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Selamat Pagi';
  if (hour < 17) return 'Selamat Siang';
  if (hour < 21) return 'Selamat Sore';
  return 'Selamat Malam';
}

/**
 * Get role-specific subtitle
 */
function getSubtitleByRole(role?: string): string {
  switch (role) {
    case 'admin':
      return 'Monitor system health dan user activity';
    case 'manager':
      return 'Lihat KPI summary dan team performance';
    case 'supervisor':
      return 'Pantau status mesin dan team workload';
    case 'member':
      return 'Prioritas tugas hari ini';
    default:
      return 'Selamat bekerja hari ini';
  }
}

export default DashboardLayout;
