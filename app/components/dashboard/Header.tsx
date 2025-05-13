'use client';

import React from 'react';
import { FaBars } from 'react-icons/fa';
import DateFilter from '../common/DateFilter';
import { useAuth } from '../../lib/contexts/AuthContext';
import { useRouter } from 'next/navigation';

interface HeaderProps {
  pageTitle: string;
  onToggleSidebar: () => void;
  onApplyDateFilter?: (startDate: Date, endDate: Date) => void;
}

export default function Header({ 
  pageTitle, 
  onToggleSidebar,
  onApplyDateFilter
}: HeaderProps) {
  const { user } = useAuth();
  const router = useRouter();
  
  return (
    <div className="main-header-container">
      <div className="main-header">
        <button 
          className="sidebar-toggle-mobile" 
          onClick={onToggleSidebar}
        >
          <FaBars />
        </button>
        
        <h1 className="page-title">{pageTitle}</h1>
        
        <div className="header-actions">
          {onApplyDateFilter && (
            <DateFilter onApplyFilter={onApplyDateFilter} />
          )}
        </div>
      </div>
    </div>
  );
} 