import { useTheme } from '../context/ThemeContext';
import { Sun, Moon } from 'lucide-react';

interface ThemeToggleProps {
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
}

export default function ThemeToggle({ size = 'md', showLabel = false }: ThemeToggleProps) {
  const { theme, toggleTheme } = useTheme();

  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-12 h-12',
  };

  const iconSizes = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6',
  };

  return (
    <button
      onClick={toggleTheme}
      className={`${sizeClasses[size]} rounded-xl flex items-center justify-center gap-2 transition-all duration-300 
        ${theme === 'dark' 
          ? 'bg-dark-800 hover:bg-dark-700 text-yellow-400' 
          : 'bg-gray-200 hover:bg-gray-300 text-blue-600'
        }
        ${showLabel ? 'px-4 w-auto' : ''}
      `}
      title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
    >
      <div className="relative">
        <Sun 
          className={`${iconSizes[size]} transition-all duration-300 absolute inset-0
            ${theme === 'dark' ? 'rotate-0 scale-100 opacity-100' : '-rotate-90 scale-0 opacity-0'}
          `} 
        />
        <Moon 
          className={`${iconSizes[size]} transition-all duration-300
            ${theme === 'light' ? 'rotate-0 scale-100 opacity-100' : 'rotate-90 scale-0 opacity-0'}
          `} 
        />
      </div>
      {showLabel && (
        <span className="text-sm font-medium">
          {theme === 'dark' ? 'Dark' : 'Light'}
        </span>
      )}
    </button>
  );
}

// Switch style toggle
export function ThemeSwitch() {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === 'dark';

  return (
    <div className="flex items-center gap-3">
      <Sun className={`w-4 h-4 transition-colors ${isDark ? 'text-dark-500' : 'text-yellow-500'}`} />
      <button
        onClick={toggleTheme}
        className={`relative w-14 h-7 rounded-full transition-colors duration-300 ${
          isDark ? 'bg-blue-600' : 'bg-gray-300'
        }`}
      >
        <div
          className={`absolute top-1 w-5 h-5 rounded-full bg-white shadow-md transition-transform duration-300 ${
            isDark ? 'translate-x-8' : 'translate-x-1'
          }`}
        />
      </button>
      <Moon className={`w-4 h-4 transition-colors ${isDark ? 'text-blue-400' : 'text-dark-400'}`} />
    </div>
  );
}

