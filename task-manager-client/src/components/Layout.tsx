import { useEffect, useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';
import ChatBot from './ChatBot';
import { MobileMenuProvider, useMobileMenu } from '../context/MobileMenuContext';
import { SidebarProvider, useSidebar } from '../context/SidebarContext';
import { useTheme } from '../context/ThemeContext';
import { publicAPI } from '../services/api';

function LayoutContent() {
  const { isOpen, close } = useMobileMenu();
  const { isCollapsed } = useSidebar();
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [version, setVersion] = useState<{ server_commit?: string; client_commit?: string; branch?: string } | null>(null);

  useEffect(() => {
    publicAPI.getVersion().then(res => setVersion(res.data)).catch(() => setVersion(null));
  }, []);

  return (
    <div className={`min-h-screen flex transition-colors duration-300
      ${isDark ? 'bg-dark-950' : 'bg-gray-50'}`}>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
          onClick={close}
        />
      )}

      <Sidebar />

      {/* Main content - responsive margin based on sidebar state */}
      <div className={`flex-1 flex flex-col transition-all duration-300 ${isCollapsed ? 'lg:ml-16' : 'lg:ml-52'}`}>
        <Header />
        <main className="flex-1 p-4 md:p-6 overflow-auto">
          <Outlet />
        </main>
        <div className="px-4 pb-3 text-xs text-gray-500 dark:text-gray-400 opacity-70">
          {version ? (
            <span>
              Server {version.server_commit?.slice(0,7) || 'unknown'} • Client {version.client_commit?.slice(0,7) || 'unknown'}
            </span>
          ) : (
            <span>Versi tidak tersedia</span>
          )}
        </div>
      </div>

      {/* Global AI ChatBot */}
      <ChatBot isOpen={isChatOpen} onToggle={() => setIsChatOpen(!isChatOpen)} />
    </div>
  );
}

export default function Layout() {
  return (
    <MobileMenuProvider>
      <SidebarProvider>
        <LayoutContent />
      </SidebarProvider>
    </MobileMenuProvider>
  );
}
