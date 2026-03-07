import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface SidebarContextType {
  isCollapsed: boolean;
  toggleCollapse: () => void;
  expandedGroups: Set<string>;
  toggleGroup: (groupTitle: string) => void;
  isGroupExpanded: (groupTitle: string) => boolean;
  expandAllGroups: () => void;
  collapseAllGroups: () => void;
}

const SidebarContext = createContext<SidebarContextType | undefined>(undefined);

const STORAGE_KEY_COLLAPSED = 'sidebar-collapsed';
const STORAGE_KEY_EXPANDED_GROUPS = 'sidebar-expanded-groups';

// Default expanded groups
const DEFAULT_EXPANDED_GROUPS = ['Task Management', 'Maintenance', 'Produksi', 'Reports', 'Pengaturan'];

export function SidebarProvider({ children }: { children: ReactNode }) {
  // Load initial state from localStorage
  const [isCollapsed, setIsCollapsed] = useState(() => {
    const stored = localStorage.getItem(STORAGE_KEY_COLLAPSED);
    return stored === 'true';
  });

  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(() => {
    const stored = localStorage.getItem(STORAGE_KEY_EXPANDED_GROUPS);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        return new Set(parsed);
      } catch {
        return new Set(DEFAULT_EXPANDED_GROUPS);
      }
    }
    return new Set(DEFAULT_EXPANDED_GROUPS);
  });

  // Persist collapsed state
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_COLLAPSED, String(isCollapsed));
  }, [isCollapsed]);

  // Persist expanded groups
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_EXPANDED_GROUPS, JSON.stringify(Array.from(expandedGroups)));
  }, [expandedGroups]);

  const toggleCollapse = () => {
    setIsCollapsed((prev) => !prev);
  };

  const toggleGroup = (groupTitle: string) => {
    setExpandedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(groupTitle)) {
        next.delete(groupTitle);
      } else {
        next.add(groupTitle);
      }
      return next;
    });
  };

  const isGroupExpanded = (groupTitle: string) => {
    return expandedGroups.has(groupTitle);
  };

  const expandAllGroups = () => {
    setExpandedGroups(new Set(DEFAULT_EXPANDED_GROUPS));
  };

  const collapseAllGroups = () => {
    setExpandedGroups(new Set());
  };

  return (
    <SidebarContext.Provider
      value={{
        isCollapsed,
        toggleCollapse,
        expandedGroups,
        toggleGroup,
        isGroupExpanded,
        expandAllGroups,
        collapseAllGroups,
      }}
    >
      {children}
    </SidebarContext.Provider>
  );
}

export function useSidebar() {
  const context = useContext(SidebarContext);
  if (context === undefined) {
    throw new Error('useSidebar must be used within a SidebarProvider');
  }
  return context;
}
