import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { authAPI, usersAPI, departmentsAPI } from '../services/api';
import { Department } from '../types';
import {
  User,
  Mail,
  Building2,
  Shield,
  Lock,
  Save,
  Eye,
  EyeOff,
  Sun,
  Moon,
  Monitor,
  Palette,
  Phone,
  MessageCircle,
} from 'lucide-react';
import { format } from 'date-fns';
import toast from 'react-hot-toast';

export default function Profile() {
  const { user, logout } = useAuth();
  const { theme, setTheme } = useTheme();
  const isDark = theme === 'dark';
  const [departments, setDepartments] = useState<Department[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  
  const [profileForm, setProfileForm] = useState({
    name: user?.name || '',
    email: user?.email || '',
    whatsapp: user?.whatsapp || '',
    department_id: user?.department_id?.toString() || '',
  });

  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  useEffect(() => {
    departmentsAPI.getAll()
      .then((res) => setDepartments(res.data))
      .catch(console.error);
  }, []);

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setIsLoading(true);
    try {
      await usersAPI.update(user.id, {
        name: profileForm.name,
        email: profileForm.email,
        whatsapp: profileForm.whatsapp || undefined,
        department_id: profileForm.department_id ? parseInt(profileForm.department_id) : undefined,
      });
      toast.success('Profile updated successfully');
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to update profile');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    if (passwordForm.newPassword.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }

    setIsLoading(true);
    try {
      await authAPI.changePassword(passwordForm.currentPassword, passwordForm.newPassword);
      toast.success('Password changed successfully');
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to change password');
    } finally {
      setIsLoading(false);
    }
  };

  if (!user) return null;

  const cardClass = `rounded-2xl border transition-colors ${
    isDark 
      ? 'bg-dark-900/40 border-dark-800/50' 
      : 'bg-white border-gray-200 shadow-sm'
  }`;

  const inputClass = `w-full px-4 py-3 rounded-xl transition-all focus:outline-none focus:ring-2 ${
    isDark 
      ? 'bg-dark-900/50 border border-dark-700 text-white placeholder-dark-500 focus:border-blue-500/50 focus:ring-blue-500/20' 
      : 'bg-gray-50 border border-gray-300 text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:ring-blue-500/20'
  }`;

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Profile Header */}
      <div className={`${cardClass} p-8`}>
        <div className="flex items-center gap-6">
          <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-blue-500 to-violet-600 flex items-center justify-center text-white text-4xl font-bold shadow-xl shadow-blue-500/30">
            {user.name.charAt(0).toUpperCase()}
          </div>
          <div>
            <h1 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>{user.name}</h1>
            <p className={isDark ? 'text-dark-400' : 'text-gray-500'}>{user.email}</p>
            <div className="flex items-center gap-3 mt-2">
              <span className="badge bg-blue-500/20 text-blue-400 border border-blue-500/30 capitalize">
                {user.role}
              </span>
              {user.department_name && (
                <span className={`text-sm ${isDark ? 'text-dark-400' : 'text-gray-500'}`}>
                  {user.department_name}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Theme Settings */}
      <div className={`${cardClass} p-6`}>
        <h2 className={`text-lg font-semibold mb-6 flex items-center gap-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
          <Palette className="w-5 h-5 text-violet-400" />
          Appearance
        </h2>

        <div className="grid grid-cols-2 gap-4">
          <button
            onClick={() => setTheme('light')}
            className={`p-4 rounded-xl border-2 transition-all flex items-center gap-3 ${
              theme === 'light'
                ? 'border-blue-500 bg-blue-500/10'
                : isDark 
                  ? 'border-dark-700 hover:border-dark-600' 
                  : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
              theme === 'light' ? 'bg-blue-500 text-white' : isDark ? 'bg-dark-800 text-dark-400' : 'bg-gray-100 text-gray-500'
            }`}>
              <Sun className="w-6 h-6" />
            </div>
            <div className="text-left">
              <p className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>Light</p>
              <p className={`text-sm ${isDark ? 'text-dark-400' : 'text-gray-500'}`}>Light background</p>
            </div>
          </button>

          <button
            onClick={() => setTheme('dark')}
            className={`p-4 rounded-xl border-2 transition-all flex items-center gap-3 ${
              theme === 'dark'
                ? 'border-blue-500 bg-blue-500/10'
                : isDark 
                  ? 'border-dark-700 hover:border-dark-600' 
                  : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
              theme === 'dark' ? 'bg-blue-500 text-white' : isDark ? 'bg-dark-800 text-dark-400' : 'bg-gray-100 text-gray-500'
            }`}>
              <Moon className="w-6 h-6" />
            </div>
            <div className="text-left">
              <p className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>Dark</p>
              <p className={`text-sm ${isDark ? 'text-dark-400' : 'text-gray-500'}`}>Dark background</p>
            </div>
          </button>
        </div>

        <p className={`text-sm mt-4 ${isDark ? 'text-dark-500' : 'text-gray-400'}`}>
          Your theme preference is saved automatically and will persist across sessions.
        </p>
      </div>

      {/* Profile Form */}
      <div className={`${cardClass} p-6`}>
        <h2 className={`text-lg font-semibold mb-6 flex items-center gap-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
          <User className="w-5 h-5 text-blue-400" />
          Profile Information
        </h2>

        <form onSubmit={handleProfileUpdate} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-dark-300' : 'text-gray-700'}`}>
                Full Name
              </label>
              <div className="relative">
                <User className={`absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 ${isDark ? 'text-dark-500' : 'text-gray-400'}`} />
                <input
                  type="text"
                  value={profileForm.name}
                  onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                  className={`${inputClass} pl-12`}
                />
              </div>
            </div>

            <div>
              <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-dark-300' : 'text-gray-700'}`}>
                Email Address
              </label>
              <div className="relative">
                <Mail className={`absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 ${isDark ? 'text-dark-500' : 'text-gray-400'}`} />
                <input
                  type="email"
                  value={profileForm.email}
                  onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })}
                  className={`${inputClass} pl-12`}
                />
              </div>
            </div>
          </div>

          {/* WhatsApp Number */}
          <div>
            <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-dark-300' : 'text-gray-700'}`}>
              <span className="flex items-center gap-2">
                <MessageCircle className="w-4 h-4 text-green-500" />
                WhatsApp Number
              </span>
            </label>
            <div className="relative">
              <Phone className={`absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 ${isDark ? 'text-dark-500' : 'text-gray-400'}`} />
              <input
                type="tel"
                value={profileForm.whatsapp}
                onChange={(e) => setProfileForm({ ...profileForm, whatsapp: e.target.value })}
                className={`${inputClass} pl-12`}
                placeholder="+62 812 3456 7890"
              />
            </div>
            <p className={`text-xs mt-1 ${isDark ? 'text-dark-500' : 'text-gray-400'}`}>
              Format: +62 812 3456 7890 (untuk integrasi WhatsApp notifikasi)
            </p>
          </div>

          <div>
            <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-dark-300' : 'text-gray-700'}`}>
              Department
            </label>
            <div className="relative">
              <Building2 className={`absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 ${isDark ? 'text-dark-500' : 'text-gray-400'}`} />
              <select
                value={profileForm.department_id}
                onChange={(e) => setProfileForm({ ...profileForm, department_id: e.target.value })}
                className={`${inputClass} pl-12`}
              >
                <option value="">No department</option>
                {departments.map((dept) => (
                  <option key={dept.id} value={dept.id}>{dept.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-dark-300' : 'text-gray-700'}`}>
              Role
            </label>
            <div className="relative">
              <Shield className={`absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 ${isDark ? 'text-dark-500' : 'text-gray-400'}`} />
              <input
                type="text"
                value={user.role}
                className={`${inputClass} pl-12 capitalize opacity-60 cursor-not-allowed`}
                disabled
              />
            </div>
            <p className={`text-xs mt-1 ${isDark ? 'text-dark-500' : 'text-gray-400'}`}>Contact an admin to change your role</p>
          </div>

          <div className={`flex justify-end pt-4 border-t ${isDark ? 'border-dark-700' : 'border-gray-200'}`}>
            <button type="submit" disabled={isLoading} className="btn btn-primary">
              <Save className="w-4 h-4" />
              Save Changes
            </button>
          </div>
        </form>
      </div>

      {/* Password Change */}
      <div className={`${cardClass} p-6`}>
        <h2 className={`text-lg font-semibold mb-6 flex items-center gap-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
          <Lock className="w-5 h-5 text-yellow-400" />
          Change Password
        </h2>

        <form onSubmit={handlePasswordChange} className="space-y-4">
          <div>
            <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-dark-300' : 'text-gray-700'}`}>
              Current Password
            </label>
            <div className="relative">
              <Lock className={`absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 ${isDark ? 'text-dark-500' : 'text-gray-400'}`} />
              <input
                type={showCurrentPassword ? 'text' : 'password'}
                value={passwordForm.currentPassword}
                onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                className={`${inputClass} pl-12 pr-12`}
                placeholder="Enter current password"
              />
              <button
                type="button"
                onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                className={`absolute right-4 top-1/2 -translate-y-1/2 ${isDark ? 'text-dark-500 hover:text-dark-300' : 'text-gray-400 hover:text-gray-600'}`}
              >
                {showCurrentPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-dark-300' : 'text-gray-700'}`}>
                New Password
              </label>
              <div className="relative">
                <Lock className={`absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 ${isDark ? 'text-dark-500' : 'text-gray-400'}`} />
                <input
                  type={showNewPassword ? 'text' : 'password'}
                  value={passwordForm.newPassword}
                  onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                  className={`${inputClass} pl-12 pr-12`}
                  placeholder="Min 6 characters"
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className={`absolute right-4 top-1/2 -translate-y-1/2 ${isDark ? 'text-dark-500 hover:text-dark-300' : 'text-gray-400 hover:text-gray-600'}`}
                >
                  {showNewPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <div>
              <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-dark-300' : 'text-gray-700'}`}>
                Confirm New Password
              </label>
              <div className="relative">
                <Lock className={`absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 ${isDark ? 'text-dark-500' : 'text-gray-400'}`} />
                <input
                  type="password"
                  value={passwordForm.confirmPassword}
                  onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                  className={`${inputClass} pl-12`}
                  placeholder="Confirm password"
                />
              </div>
            </div>
          </div>

          <div className={`flex justify-end pt-4 border-t ${isDark ? 'border-dark-700' : 'border-gray-200'}`}>
            <button type="submit" disabled={isLoading} className="btn btn-primary">
              <Lock className="w-4 h-4" />
              Change Password
            </button>
          </div>
        </form>
      </div>

      {/* Account Info */}
      <div className={`${cardClass} p-6`}>
        <h2 className={`text-lg font-semibold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>Account Information</h2>
        <div className="space-y-3 text-sm">
          <div className="flex justify-between">
            <span className={isDark ? 'text-dark-400' : 'text-gray-500'}>Account Created</span>
            <span className={isDark ? 'text-white' : 'text-gray-900'}>{format(new Date(user.created_at), 'MMMM d, yyyy')}</span>
          </div>
          <div className="flex justify-between">
            <span className={isDark ? 'text-dark-400' : 'text-gray-500'}>User ID</span>
            <span className={`font-mono ${isDark ? 'text-white' : 'text-gray-900'}`}>{user.id}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
