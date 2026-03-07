import { useState, useEffect, useRef } from 'react';
import { Users, Check, Search, X } from 'lucide-react';
import { User } from '../types';

interface Props {
  users: User[];
  selectedIds: number[];
  onChange: (ids: number[]) => void;
  isDark?: boolean;
  placeholder?: string;
  required?: boolean;
  filterRole?: boolean; // If true, filter out 'user' role
}

export default function AssigneeMultiSelect({ 
  users, 
  selectedIds, 
  onChange,
  isDark = false,
  placeholder = 'Pilih assignee...',
  required = false,
  filterRole = true,
}: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const toggleUser = (userId: number) => {
    if (selectedIds.includes(userId)) {
      onChange(selectedIds.filter(id => id !== userId));
    } else {
      onChange([...selectedIds, userId]);
    }
  };

  const filteredUsers = users
    .filter(u => !filterRole || u.role !== 'user')
    .filter(u => 
      u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email.toLowerCase().includes(searchQuery.toLowerCase())
    );

  const selectedUsers = users.filter(u => selectedIds.includes(u.id));

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full text-left flex items-center justify-between gap-2 px-4 py-2.5 rounded-xl border transition-all ${
          isDark 
            ? `bg-dark-700 border-dark-600 text-white hover:border-dark-500 ${required && selectedIds.length === 0 ? 'border-red-500/50' : ''}`
            : `bg-gray-50 border-gray-300 text-gray-900 hover:border-gray-400 ${required && selectedIds.length === 0 ? 'border-red-300' : ''}`
        }`}
      >
        <div className="flex items-center gap-2 flex-1 min-w-0">
          {selectedUsers.length === 0 ? (
            <span className={isDark ? 'text-dark-400' : 'text-gray-400'}>{placeholder}</span>
          ) : (
            <div className="flex items-center gap-1 flex-wrap">
              {selectedUsers.slice(0, 3).map(user => (
                <div 
                  key={user.id} 
                  className={`flex items-center gap-1 rounded-full px-2 py-0.5 ${
                    isDark ? 'bg-orange-500/20 text-orange-300' : 'bg-orange-100 text-orange-700'
                  }`}
                >
                  <div className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-medium ${
                    isDark ? 'bg-orange-500 text-white' : 'bg-orange-500 text-white'
                  }`}>
                    {user.name.charAt(0).toUpperCase()}
                  </div>
                  <span className="text-xs truncate max-w-[60px]">{user.name.split(' ')[0]}</span>
                </div>
              ))}
              {selectedUsers.length > 3 && (
                <span className={`text-xs ${isDark ? 'text-dark-400' : 'text-gray-500'}`}>
                  +{selectedUsers.length - 3} lainnya
                </span>
              )}
            </div>
          )}
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          {selectedIds.length > 0 && (
            <span className={`px-2 py-0.5 text-xs rounded-full ${
              isDark ? 'bg-orange-500/20 text-orange-300' : 'bg-orange-100 text-orange-700'
            }`}>
              {selectedIds.length}
            </span>
          )}
          <Users className={`w-4 h-4 ${isDark ? 'text-dark-400' : 'text-gray-400'}`} />
        </div>
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className={`absolute z-50 top-full left-0 right-0 mt-1 rounded-xl border shadow-xl overflow-hidden ${
          isDark ? 'bg-dark-800 border-dark-600' : 'bg-white border-gray-200'
        }`}>
          {/* Search */}
          <div className={`p-2 border-b ${isDark ? 'border-dark-700' : 'border-gray-100'}`}>
            <div className="relative">
              <Search className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${
                isDark ? 'text-dark-400' : 'text-gray-400'
              }`} />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari nama atau email..."
                className={`w-full pl-9 pr-3 py-2 text-sm rounded-lg border ${
                  isDark 
                    ? 'bg-dark-700 border-dark-600 text-white placeholder-dark-400' 
                    : 'bg-gray-50 border-gray-200 text-gray-900 placeholder-gray-400'
                } focus:outline-none focus:ring-2 focus:ring-orange-500/20`}
                autoFocus
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className={`absolute right-3 top-1/2 -translate-y-1/2 ${
                    isDark ? 'text-dark-400 hover:text-white' : 'text-gray-400 hover:text-gray-600'
                  }`}
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          {/* Selected Count */}
          {selectedIds.length > 0 && (
            <div className={`px-3 py-2 text-xs border-b flex items-center justify-between ${
              isDark ? 'bg-dark-700/50 border-dark-700 text-dark-300' : 'bg-gray-50 border-gray-100 text-gray-600'
            }`}>
              <span>{selectedIds.length} dipilih</span>
              <button
                type="button"
                onClick={() => onChange([])}
                className={`text-xs hover:underline ${isDark ? 'text-orange-400' : 'text-orange-600'}`}
              >
                Hapus semua
              </button>
            </div>
          )}

          {/* User List */}
          <div className="max-h-60 overflow-y-auto">
            {filteredUsers.length === 0 ? (
              <div className={`p-4 text-center text-sm ${isDark ? 'text-dark-400' : 'text-gray-400'}`}>
                {searchQuery ? 'Tidak ditemukan' : 'Tidak ada user'}
              </div>
            ) : (
              filteredUsers.map(user => (
                <button
                  key={user.id}
                  type="button"
                  onClick={() => toggleUser(user.id)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 transition-colors ${
                    selectedIds.includes(user.id) 
                      ? isDark ? 'bg-orange-500/10' : 'bg-orange-50'
                      : isDark ? 'hover:bg-dark-700' : 'hover:bg-gray-50'
                  }`}
                >
                  {/* Checkbox */}
                  <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors flex-shrink-0 ${
                    selectedIds.includes(user.id) 
                      ? 'bg-orange-500 border-orange-500' 
                      : isDark ? 'border-dark-500' : 'border-gray-300'
                  }`}>
                    {selectedIds.includes(user.id) && <Check className="w-3 h-3 text-white" />}
                  </div>

                  {/* Avatar */}
                  {user.avatar ? (
                    <img src={user.avatar} alt={user.name} className="w-8 h-8 rounded-full flex-shrink-0" />
                  ) : (
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium flex-shrink-0 ${
                      isDark ? 'bg-dark-600 text-white' : 'bg-gray-200 text-gray-600'
                    }`}>
                      {user.name.charAt(0).toUpperCase()}
                    </div>
                  )}

                  {/* User Info */}
                  <div className="flex-1 text-left min-w-0">
                    <div className={`text-sm font-medium truncate ${isDark ? 'text-white' : 'text-gray-900'}`}>
                      {user.name}
                    </div>
                    <div className={`text-xs truncate ${isDark ? 'text-dark-400' : 'text-gray-500'}`}>
                      {user.email}
                    </div>
                  </div>

                  {/* Role Badge */}
                  <span className={`text-xs px-2 py-0.5 rounded-full flex-shrink-0 ${
                    user.role === 'admin' 
                      ? isDark ? 'bg-purple-500/20 text-purple-300' : 'bg-purple-100 text-purple-700'
                      : user.role === 'manager'
                      ? isDark ? 'bg-blue-500/20 text-blue-300' : 'bg-blue-100 text-blue-700'
                      : isDark ? 'bg-dark-600 text-dark-300' : 'bg-gray-100 text-gray-600'
                  }`}>
                    {user.role}
                  </span>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}


