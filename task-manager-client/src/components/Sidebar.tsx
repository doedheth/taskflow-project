import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useMobileMenu } from '../context/MobileMenuContext';
import { useTheme } from '../context/ThemeContext';
import { useSidebar } from '../context/SidebarContext';
import {
  LayoutDashboard,
  Ticket,
  Kanban,
  Zap,
  Timer,
  Calendar,
  Building2,
  Users,
  LogOut,
  CheckCircle2,
  BarChart3,
  X,
  Cpu,
  Wrench,
  Gauge,
  CalendarDays,
  Clock,
  AlertTriangle,
  Factory,
  Tag,
  Sparkles,
  FileText,
  ClipboardList,
  Package,
  ShieldCheck,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Sun,
  Tv,
  Layout,
  Monitor,
} from 'lucide-react';

interface NavItem {
  to: string;
  icon: React.ElementType;
  label: string;
  adminOnly?: boolean;
  managerOrAdmin?: boolean;
  supervisorOrAbove?: boolean;
  allowedDepartments?: string[];
}

interface NavGroup {
  title: string;
  items: NavItem[];
  adminOnly?: boolean;
}

const navGroups: NavGroup[] = [
  {
    title: 'Task Management',
    items: [
      { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
      { to: '/tickets', icon: Ticket, label: 'Tickets' },
      { to: '/board', icon: Kanban, label: 'Board' },
      { to: '/sprints', icon: Timer, label: 'Sprints' },
      { to: '/epics', icon: Zap, label: 'Epics' },
      { to: '/timeline', icon: Calendar, label: 'Timeline' },
    ],
  },
  {
    title: 'Maintenance',
    items: [
      { to: '/assets', icon: Cpu, label: 'Assets' },
      { to: '/work-orders', icon: Wrench, label: 'Work Orders' },
      { to: '/downtime/new', icon: AlertTriangle, label: 'Downtime Baru' },
      { to: '/downtime-tracker', icon: Timer, label: 'Log & Riwayat' },
      { to: '/maintenance-calendar', icon: CalendarDays, label: 'Jadwal PM' },
      { to: '/maintenance-kpi', icon: Gauge, label: 'KPI Maintenance' },
      // Moved from Settings
      { to: '/ai-reports', icon: FileText, label: 'AI Reports', managerOrAdmin: true },
    ],
  },
  {
    title: 'Produksi',
    items: [
      { to: '/spk', icon: ClipboardList, label: 'SPK', supervisorOrAbove: true },
      // Inspeksi Material moved to Quality Control
      { to: '/products', icon: Package, label: 'Master Produk', managerOrAdmin: true },
      // Stok Sparepart BC moved to Sparepart
      { to: '/production-schedule', icon: Factory, label: 'Jadwal Produksi' },
      { to: '/machine-parameters', icon: ClipboardList, label: 'Setting Parameter' },
      { to: '/production-kpi', icon: BarChart3, label: 'KPI Produksi' },
      { to: '/solar', icon: Sun, label: 'Energy Monitoring', managerOrAdmin: true },
      // Moved from Settings
      { to: '/ai-production-reports', icon: Factory, label: 'AI Produksi', supervisorOrAbove: true },
    ],
  },
  {
    title: 'Sparepart',
    items: [
      { to: '/spareparts', icon: Package, label: 'Stok Sparepart BC', supervisorOrAbove: true },
    ],
  },
  {
    title: 'Quality Control',
    items: [
      {
        to: '/incoming-inspection',
        icon: ShieldCheck,
        label: 'Inspeksi Material',
        allowedDepartments: ['Quality Control']
      },
    ],
  },
  {
    title: 'Digital Signage',
    adminOnly: true,
    items: [
      { to: '/admin/digital-signage/templates', icon: Layout, label: 'Templates' },
      { to: '/admin/digital-signage/playlists', icon: Tv, label: 'Playlists' },
      { to: '/slideshow', icon: Monitor, label: 'Public Display' },
    ],
  },
  {
    title: 'User Performa',
    items: [
      { to: '/performance', icon: BarChart3, label: 'Performance' },
    ],
  },
  {
    title: 'Pengaturan',
    adminOnly: true,
    items: [
      { to: '/departments', icon: Building2, label: 'Departments' },
      { to: '/users', icon: Users, label: 'Users', adminOnly: true },
      { to: '/shift-settings', icon: Clock, label: 'Shift' },
      { to: '/failure-codes', icon: AlertTriangle, label: 'Failure Codes', managerOrAdmin: true },
      { to: '/downtime-classifications', icon: Tag, label: 'Klasifikasi Downtime', managerOrAdmin: true },
      { to: '/ai-settings', icon: Sparkles, label: 'AI Settings', managerOrAdmin: true },
    ],
  },
];

export default function Sidebar() {
  const { user, logout } = useAuth();
  const { isOpen, close } = useMobileMenu();
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const { isCollapsed, toggleCollapse, toggleGroup, isGroupExpanded } = useSidebar();

  const handleNavClick = () => {
    close();
  };

  return (
    <aside
      className={`fixed left-0 top-0 h-full backdrop-blur-xl border-r flex flex-col z-50 transition-all duration-300 ease-in-out
        ${isCollapsed ? 'w-16' : 'w-52'}
        ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        ${isDark
          ? 'bg-dark-900/95 border-dark-800/50'
          : 'bg-white/95 border-gray-200'
        }`}
    >
      {/* Logo */}
      <div className={`p-3 md:p-4 border-b ${isDark ? 'border-dark-800/50' : 'border-gray-200'}`}>
        <div className="flex items-center justify-between">
          <div className={`flex items-center gap-2.5 ${isCollapsed ? 'justify-center w-full' : ''}`}>
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-violet-600 flex items-center justify-center shadow-md shadow-blue-500/25 flex-shrink-0">
              <CheckCircle2 className="w-5 h-5 text-white" />
            </div>
            {!isCollapsed && (
              <div>
                <h1 className={`text-lg font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>TaskFlow</h1>
                <p className={`text-[10px] ${isDark ? 'text-dark-400' : 'text-gray-500'}`}>Project & Maintenance</p>
              </div>
            )}
          </div>
          {/* Close button for mobile */}
          {!isCollapsed && (
            <button
              onClick={close}
              className={`lg:hidden p-1.5 rounded-lg transition-colors
                ${isDark
                  ? 'text-dark-400 hover:text-white hover:bg-dark-800'
                  : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100'
                }`}
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-2 md:p-3 overflow-y-auto">
        {navGroups.map((group, groupIndex) => {
          // Check group level admin restriction
          if (group.adminOnly && user?.role !== 'admin') return null;

          // Filter out items based on role requirements
          const visibleItems = group.items.filter(item => {
            if (item.adminOnly && user?.role !== 'admin') return false;
            if (item.managerOrAdmin && !['admin', 'manager'].includes(user?.role || '')) return false;
            if (item.supervisorOrAbove && !['admin', 'manager', 'supervisor'].includes(user?.role || '')) return false;

            // Check department restrictions
            if (item.allowedDepartments && item.allowedDepartments.length > 0) {
              const userDept = user?.department_name;
              // Allow if user is in one of the allowed departments OR is an admin/manager (admin override)
              const isAllowedDept = userDept && item.allowedDepartments.includes(userDept);
              const isAdminOrManager = ['admin', 'manager'].includes(user?.role || '');

              if (!isAllowedDept && !isAdminOrManager) return false;
            }

            return true;
          });

          if (visibleItems.length === 0) return null;

          const isExpanded = isGroupExpanded(group.title);

          return (
            <div key={group.title} className={groupIndex > 0 ? 'mt-3' : ''}>
              {/* Group Header - Clickable for tree toggle */}
              {!isCollapsed ? (
                <button
                  onClick={() => toggleGroup(group.title)}
                  className={`w-full flex items-center justify-between px-3 py-1.5 rounded-lg transition-colors group
                    ${isDark
                      ? 'hover:bg-dark-800/50 text-dark-500 hover:text-dark-300'
                      : 'hover:bg-gray-100 text-gray-400 hover:text-gray-600'
                    }`}
                >
                  <span className="text-[10px] font-semibold uppercase tracking-wider">
                    {group.title}
                  </span>
                  <ChevronDown
                    className={`w-3 h-3 transition-transform duration-200 ${isExpanded ? '' : '-rotate-90'}`}
                  />
                </button>
              ) : (
                <div className={`h-px mx-2 my-2 ${isDark ? 'bg-dark-700' : 'bg-gray-200'}`} />
              )}

              {/* Group Items - Collapsible */}
              <div
                className={`overflow-hidden transition-all duration-200 ease-in-out ${!isCollapsed && !isExpanded ? 'max-h-0 opacity-0' : 'max-h-[500px] opacity-100'
                  }`}
              >
                <div className="space-y-0.5 mt-1">
                  {visibleItems.map((item) => (
                    <NavLink
                      key={item.to}
                      to={item.to}
                      end={item.to === '/'}
                      onClick={handleNavClick}
                      title={isCollapsed ? item.label : undefined}
                      className={({ isActive }) =>
                        `flex items-center gap-2.5 px-3 py-2 rounded-lg transition-all duration-200 ${isCollapsed ? 'justify-center' : ''
                        } ${isActive
                          ? isDark
                            ? 'bg-blue-600/20 text-blue-400 border-l-2 border-blue-500'
                            : 'bg-blue-50 text-blue-700 border-l-2 border-blue-500'
                          : isDark
                            ? 'text-dark-400 hover:text-white hover:bg-dark-800/50'
                            : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                        }`
                      }
                    >
                      <item.icon className="w-4 h-4 flex-shrink-0" />
                      {!isCollapsed && <span className="text-sm">{item.label}</span>}
                    </NavLink>
                  ))}
                </div>
              </div>
            </div>
          );
        })}
      </nav>

      {/* Collapse Toggle Button - Desktop only */}
      <div className={`hidden lg:flex justify-center py-2 border-t ${isDark ? 'border-dark-800/50' : 'border-gray-200'}`}>
        <button
          onClick={toggleCollapse}
          className={`p-2 rounded-lg transition-colors
            ${isDark
              ? 'text-dark-400 hover:text-white hover:bg-dark-800'
              : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100'
            }`}
          title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {isCollapsed ? (
            <ChevronRight className="w-4 h-4" />
          ) : (
            <ChevronLeft className="w-4 h-4" />
          )}
        </button>
      </div>

      {/* User section */}
      <div className={`p-2 md:p-3 border-t ${isDark ? 'border-dark-800/50' : 'border-gray-200'}`}>
        <div className={`flex items-center gap-2 px-2.5 py-2 rounded-lg
          ${isDark ? 'bg-dark-800/30' : 'bg-gray-100'}
          ${isCollapsed ? 'justify-center' : ''}`}>
          <div
            className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-violet-600 flex items-center justify-center text-white text-sm font-semibold flex-shrink-0"
            title={isCollapsed ? `${user?.name} (${user?.role})` : undefined}
          >
            {user?.name?.charAt(0).toUpperCase()}
          </div>
          {!isCollapsed && (
            <>
              <div className="flex-1 min-w-0">
                <p className={`text-xs font-medium truncate ${isDark ? 'text-white' : 'text-gray-900'}`}>{user?.name}</p>
                <p className={`text-[10px] capitalize ${isDark ? 'text-dark-400' : 'text-gray-500'}`}>{user?.role}</p>
              </div>
              <button
                onClick={logout}
                className={`p-1.5 rounded-md transition-colors flex-shrink-0
                  ${isDark
                    ? 'text-dark-400 hover:text-red-400 hover:bg-red-500/10'
                    : 'text-gray-400 hover:text-red-500 hover:bg-red-50'
                  }`}
                title="Logout"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </>
          )}
        </div>
        {/* Logout button when collapsed */}
        {isCollapsed && (
          <button
            onClick={logout}
            className={`w-full mt-2 p-2 rounded-lg transition-colors flex items-center justify-center
              ${isDark
                ? 'text-dark-400 hover:text-red-400 hover:bg-red-500/10'
                : 'text-gray-400 hover:text-red-500 hover:bg-red-50'
              }`}
            title="Logout"
          >
            <LogOut className="w-4 h-4" />
          </button>
        )}
      </div>
    </aside>
  );
}
