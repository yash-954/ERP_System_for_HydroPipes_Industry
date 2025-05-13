'use client';

import React, { ReactNode } from 'react';
import { FaEllipsisV } from 'react-icons/fa';

interface ChartCardProps {
  title: string;
  children: ReactNode;
  footer?: ReactNode;
  actions?: ReactNode[];
}

export default function ChartCard({ title, children, footer, actions }: ChartCardProps) {
  return (
    <div className="dashboard-card">
      <div className="card-header">
        <h3 className="card-title">{title}</h3>
        
        <div className="card-actions">
          {actions?.map((action, index) => (
            <React.Fragment key={index}>{action}</React.Fragment>
          ))}
          
          <button className="card-action-button">
            <FaEllipsisV />
          </button>
        </div>
      </div>
      
      <div className="card-content">
        {children}
      </div>
      
      {footer && (
        <div className="card-footer">
          {footer}
        </div>
      )}
    </div>
  );
} 