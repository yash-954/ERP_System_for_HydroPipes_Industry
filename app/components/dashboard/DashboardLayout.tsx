'use client';

import React, { useState, ReactNode } from 'react';
import Sidebar from './Sidebar';
import Header from './Header';
import { useAuth } from '../../lib/contexts/AuthContext';
import { FaBars } from 'react-icons/fa';

interface DashboardLayoutProps {
  children: ReactNode;
  pageTitle: string;
  onApplyDateFilter?: (startDate: Date, endDate: Date) => void;
}

export default function DashboardLayout({ 
  children, 
  pageTitle,
  onApplyDateFilter
}: DashboardLayoutProps) {
  const { user, logout } = useAuth();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  const toggleSidebar = () => {
    setIsCollapsed(!isCollapsed);
  };

  const toggleMobileSidebar = () => {
    setIsMobileOpen(!isMobileOpen);
  };

  if (!user) {
    return null;
  }

  return (
    <div className="dashboard-container">
      {/* Mobile sidebar backdrop */}
      <div 
        className={`mobile-sidebar-backdrop ${isMobileOpen ? 'active' : ''}`}
        onClick={toggleMobileSidebar}
      />
      
      {/* Mobile menu toggle - only visible on mobile */}
      <button 
        className="mobile-menu-toggle"
        onClick={toggleMobileSidebar}
      >
        <FaBars />
      </button>
      
      {/* Sidebar */}
      <Sidebar 
        user={{
          id: user.id!,
          name: user.name,
          role: user.role
        }} 
        isCollapsed={isCollapsed} 
        toggleSidebar={toggleSidebar}
        isMobileOpen={isMobileOpen}
        onLogout={logout}
      />
      
      {/* Main Content */}
      <div className={`main-content ${isCollapsed ? 'expanded' : ''}`}>
        <Header 
          pageTitle={pageTitle} 
          onToggleSidebar={toggleMobileSidebar}
          onApplyDateFilter={onApplyDateFilter}
        />
        
        <div className="main-container">
          {children}
        </div>
      </div>
    </div>
  );
} 