import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { Mail, Lock, ArrowRight, Sun, Moon } from 'lucide-react';
import toast from 'react-hot-toast';
import logoImg from '../images/lgo-header.png';

export default function Login() {
  const { login } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === 'dark';
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      await login(email, password);
      toast.success('Welcome back!');
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Login failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={`min-h-screen flex transition-colors ${isDark ? 'bg-dark-950' : 'bg-gray-50'}`}>
      {/* Theme Toggle - Fixed Position */}
      <button
        onClick={toggleTheme}
        className={`fixed top-4 right-4 z-50 p-3 rounded-xl transition-all duration-300 shadow-lg
          ${isDark 
            ? 'bg-dark-800 hover:bg-dark-700 text-yellow-400' 
            : 'bg-white hover:bg-gray-100 text-blue-600 border border-gray-200'
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

      {/* Left side - Branding */}
      <div className={`hidden lg:flex lg:w-1/2 relative overflow-hidden
        ${isDark
          ? 'bg-gradient-to-br from-blue-600/20 via-dark-900 to-violet-600/20'
          : 'bg-gradient-to-br from-blue-500 via-blue-600 to-violet-600'
        }`}>
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxwYXRoIGQ9Ik0zNiAxOGMtOS45NDEgMC0xOCA4LjA1OS0xOCAxOHM4LjA1OSAxOCAxOCAxOCAxOC04LjA1OSAxOC0xOC04LjA1OS0xOC0xOC0xOHptMCAzMmMtNy43MzIgMC0xNC02LjI2OC0xNC0xNHM2LjI2OC0xNCAxNC0xNCAxNCA2LjI2OCAxNCAxNC02LjI2OCAxNC0xNCAxNHoiIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iLjA1Ii8+PC9nPjwvc3ZnPg==')] opacity-50"></div>

        <div className="relative z-10 flex flex-col justify-center px-16">
          <div className="flex items-center gap-4 mb-8">
            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-xl bg-white p-2`}>
              <img src={logoImg} alt="Logo" className="w-full h-full object-contain" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white">SAP TaskFlow</h1>
              <p className={isDark ? 'text-dark-400' : 'text-white/70'}>Integrated Plant Management</p>
            </div>
          </div>

          <h2 className="text-4xl font-bold text-white mb-4">
            Manage your plant<br />operations seamlessly
          </h2>
          <p className={`text-lg max-w-md ${isDark ? 'text-dark-400' : 'text-white/80'}`}>
            Streamline your workflow with our integrated system.
            Track production, maintenance, and quality control in real-time.
          </p>

          <div className="mt-12 grid grid-cols-3 gap-6">
            <div className="text-center">
              <p className="text-3xl font-bold text-white">10k+</p>
              <p className={`text-sm ${isDark ? 'text-dark-400' : 'text-white/70'}`}>Work Orders</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold text-white">500+</p>
              <p className={`text-sm ${isDark ? 'text-dark-400' : 'text-white/70'}`}>Machines</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold text-white">99%</p>
              <p className={`text-sm ${isDark ? 'text-dark-400' : 'text-white/70'}`}>Uptime</p>
            </div>
          </div>
        </div>
      </div>

      {/* Right side - Login Form */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          <div className="lg:hidden flex items-center gap-3 mb-8 justify-center">
            <div className="w-12 h-12 rounded-xl bg-white p-2 shadow-md flex items-center justify-center">
              <img src={logoImg} alt="Logo" className="w-full h-full object-contain" />
            </div>
            <h1 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>SAP TaskFlow</h1>
          </div>

          <div className="text-center mb-8">
            <h2 className={`text-2xl font-bold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>Welcome back</h2>
            <p className={isDark ? 'text-dark-400' : 'text-gray-500'}>Sign in to your account to continue</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-dark-300' : 'text-gray-700'}`}>
                Email
              </label>
              <div className="relative">
                <Mail className={`absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 ${isDark ? 'text-dark-500' : 'text-gray-400'}`} />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={`w-full pl-12 pr-4 py-3 rounded-xl transition-all focus:outline-none focus:ring-2
                    ${isDark 
                      ? 'bg-dark-900/50 border border-dark-700 text-white placeholder-dark-500 focus:border-blue-500/50 focus:ring-blue-500/20' 
                      : 'bg-white border border-gray-300 text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:ring-blue-500/20'
                    }`}
                  placeholder="you@example.com"
                  required
                />
              </div>
            </div>

            <div>
              <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-dark-300' : 'text-gray-700'}`}>
                Password
              </label>
              <div className="relative">
                <Lock className={`absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 ${isDark ? 'text-dark-500' : 'text-gray-400'}`} />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={`w-full pl-12 pr-4 py-3 rounded-xl transition-all focus:outline-none focus:ring-2
                    ${isDark 
                      ? 'bg-dark-900/50 border border-dark-700 text-white placeholder-dark-500 focus:border-blue-500/50 focus:ring-blue-500/20' 
                      : 'bg-white border border-gray-300 text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:ring-blue-500/20'
                    }`}
                  placeholder="Enter your password"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="btn btn-primary w-full py-3"
            >
              {isLoading ? (
                <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white"></div>
              ) : (
                <>
                  Sign In
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          <div className="mt-8 text-center">
            <p className={isDark ? 'text-dark-400' : 'text-gray-500'}>
              Don't have an account?{' '}
              <Link to="/register" className="text-blue-400 hover:text-blue-300 font-medium">
                Create one
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
