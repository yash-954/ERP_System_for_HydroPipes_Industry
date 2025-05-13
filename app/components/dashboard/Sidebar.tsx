'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  FaChartPie, 
  FaUsers, 
  FaBoxes, 
  FaShoppingCart, 
  FaCreditCard, 
  FaCogs, 
  FaTasks, 
  FaChevronLeft, 
  FaChevronRight,
  FaSignOutAlt,
  FaBell
} from 'react-icons/fa';
import { IoWater } from "react-icons/io5";
import { UserRole } from '../../models/User';
import { ModuleId } from '../../models/Permission';
import permissionService from '../../lib/services/permissionService';

interface SidebarProps {
  user: {
    id: number;
    name: string;
    role: UserRole;
  };
  isCollapsed: boolean;
  toggleSidebar: () => void;
  isMobileOpen?: boolean;
  onLogout: () => void;
}

export default function Sidebar({ user, isCollapsed, toggleSidebar, isMobileOpen = false, onLogout }: SidebarProps) {
  const pathname = usePathname();
  const [moduleAccess, setModuleAccess] = useState<{ [key: string]: boolean }>({});
  const [isLoading, setIsLoading] = useState(true);

  // Load user's module access permissions
  useEffect(() => {
    const loadModuleAccess = async () => {
      if (!user || !user.id) return;

      try {
        // Only set loading to true if we don't already have permissions loaded
        if (Object.keys(moduleAccess).length === 0) {
          setIsLoading(true);
        }
        
        const effectivePermissions = await permissionService.getEffectivePermissions(user.id, user.role);
        
        // Convert permissions to a map for easier access
        const accessMap: { [key: string]: boolean } = {};
        effectivePermissions.forEach(permission => {
          accessMap[permission.moduleId] = permission.canView;
        });
        
        setModuleAccess(accessMap);
      } catch (error) {
        console.error('Error loading module access permissions:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadModuleAccess();
  }, [user.id, user.role]); // Only depend on user.id and user.role, not the entire user object

  // Define navigation items with proper structure
  const navItems = [
    {
      section: 'Main',
      items: [
        {
          name: 'Dashboard',
          icon: <FaChartPie />,
          path: '/dashboard',
          moduleId: ModuleId.DASHBOARD,
        },
        {
          name: 'User Management',
          icon: <FaUsers />,
          path: '/dashboard/users',
          moduleId: ModuleId.USER_MANAGEMENT,
        },
        {
          name: 'Notifications',
          icon: <FaBell />,
          path: '/dashboard/notifications',
          moduleId: ModuleId.DASHBOARD, // Notifications is part of dashboard
        },
      ],
    },
    {
      section: 'Operations',
      items: [
        {
          name: 'Inventory',
          icon: <FaBoxes />,
          path: '/dashboard/inventory',
          moduleId: ModuleId.INVENTORY,
        },
        {
          name: 'Work Orders',
          icon: <FaTasks />,
          path: '/dashboard/work-orders',
          moduleId: ModuleId.WORK_ORDERS,
        },
        {
          name: 'Purchase',
          icon: <FaShoppingCart />,
          path: '/dashboard/purchases',
          moduleId: ModuleId.PURCHASE,
        },
        {
          name: 'Sales',
          icon: <FaCreditCard />,
          path: '/dashboard/sales',
          moduleId: ModuleId.SALES,
        },
      ],
    },
    {
      section: 'System',
      items: [
        {
          name: 'Settings',
          icon: <FaCogs />,
          path: '/dashboard/settings',
          moduleId: ModuleId.DASHBOARD,
          roles: [UserRole.ADMIN],
        },
      ],
    },
  ];

  // Filter items based on user permissions and role
  const filteredNavItems = navItems.map(section => ({
    ...section,
    items: section.items.filter(item => {
      // Always check for role restrictions first
      if (item.roles && !item.roles.includes(user.role)) {
        return false;
      }
      
      // Admin and Manager have access to all modules
      if (user.role === UserRole.ADMIN || user.role === UserRole.MANAGER) {
        return true;
      }
      
      // For Basic users, check module access
      return moduleAccess[item.moduleId] === true;
    }),
  })).filter(section => section.items.length > 0);

  // Function to get user initials for the avatar
  const getUserInitials = () => {
    if (!user.name) return '';
    return user.name
      .split(' ')
      .map(name => name[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  if (isLoading) {
    return (
      <div className="sidebar loading">
        <div className="sidebar-header">
          <div className="sidebar-logo">
            <span className="sidebar-logo-icon"><IoWater /></span>
            {!isCollapsed && <span>ERP-IITR</span>}
          </div>
        </div>
        <div className="flex-1 flex items-center justify-center">
          <div className="text-gray-400">Loading...</div>
        </div>
      </div>
    );
  }

  return (
    <div className={`sidebar ${isCollapsed ? 'collapsed' : ''} ${isMobileOpen ? 'mobile-open' : ''}`}>
      <div className="sidebar-header">
        <div className="sidebar-logo">
          <span className="sidebar-logo-icon"><IoWater /></span>
          {!isCollapsed && <span>ERP-IITR</span>}
        </div>
        <button className="sidebar-toggle" onClick={toggleSidebar}>
          {isCollapsed ? <FaChevronRight /> : <FaChevronLeft />}
        </button>
      </div>
      
      <div className="sidebar-nav">
        {filteredNavItems.map((section, sectionIndex) => (
          <div className="nav-section" key={sectionIndex}>
            {!isCollapsed && (
              <h3 className="nav-section-title">{section.section}</h3>
            )}
            <ul className="nav-items">
              {section.items.map((item, itemIndex) => (
                <li className="nav-item" key={itemIndex}>
                  <Link 
                    href={item.path}
                    className={`nav-link ${pathname === item.path ? 'active' : ''}`}
                  >
                    <span className="nav-link-icon">{item.icon}</span>
                    {!isCollapsed && (
                      <span className="nav-link-text">{item.name}</span>
                    )}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      
      <div className="sidebar-footer">
        <div className="user-profile">
          <div className="user-avatar">
            {getUserInitials()}
          </div>
          {!isCollapsed && (
            <div className="user-info">
              <div className="user-name">{user.name}</div>
              <div className="user-role">{user.role}</div>
            </div>
          )}
        </div>
        
        <button 
          className="sidebar-logout-button"
          onClick={onLogout}
        >
          <span className="logout-icon"><FaSignOutAlt /></span>
          {!isCollapsed && <span className="logout-text">Logout</span>}
        </button>
      </div>
    </div>
  );
} 