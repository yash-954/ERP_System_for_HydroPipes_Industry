'use client';

import React, { ReactNode } from 'react';

interface StatsCardProps {
  title: string;
  value: string | number;
  change?: {
    value: string | number;
    isPositive: boolean;
  };
  icon: ReactNode;
  iconClass: string;
  period?: string;
  onClick?: () => void;
}

export default function StatsCard({ 
  title, 
  value, 
  change, 
  icon, 
  iconClass,
  period,
  onClick
}: StatsCardProps) {
  return (
    <div 
      className={`dashboard-card stats-card ${onClick ? 'cursor-pointer hover:shadow-md' : ''}`}
      onClick={onClick}
    >
      <div className="stats-header">
        <h3 className="stats-title">{title}</h3>
        <div className={`stats-icon ${iconClass}`}>
          {icon}
        </div>
      </div>
      
      <div className="stats-content">
        <h2 className="stats-value">{value}</h2>
        
        {change && (
          <div className={`stats-change ${change.isPositive ? 'positive' : 'negative'}`}>
            {change.isPositive ? '↑' : '↓'} {change.value}
          </div>
        )}
        
        {period && (
          <div className="stats-period">{period}</div>
        )}
      </div>
    </div>
  );
} 