'use client';

import React from 'react';

interface Order {
  id: string;
  customer: string;
  amount: number;
  status: string;
  date: string;
}

interface RecentOrdersProps {
  orders: Order[];
}

export default function RecentOrders({ orders }: RecentOrdersProps) {
  // Function to get badge class based on status
  const getStatusBadgeClass = (status: string) => {
    switch (status.toLowerCase()) {
      case 'delivered':
        return 'success';
      case 'shipped':
        return 'info';
      case 'processing':
        return 'warning';
      case 'pending':
        return 'danger';
      default:
        return '';
    }
  };

  return (
    <div className="dashboard-card recent-orders-card">
      <div className="card-header">
        <h3 className="card-title">Recent Orders</h3>
      </div>
      
      <div className="card-content">
        <div className="table-responsive">
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th style={{ textAlign: 'left', padding: '0.75rem 1rem', borderBottom: '1px solid var(--border-color)', color: 'var(--text-secondary)', fontWeight: 600, width: '15%' }}>Order ID</th>
                <th style={{ textAlign: 'left', padding: '0.75rem 1rem', borderBottom: '1px solid var(--border-color)', color: 'var(--text-secondary)', fontWeight: 600, width: '35%' }}>Customer</th>
                <th style={{ textAlign: 'right', padding: '0.75rem 1rem', borderBottom: '1px solid var(--border-color)', color: 'var(--text-secondary)', fontWeight: 600, width: '15%' }}>Amount</th>
                <th style={{ textAlign: 'center', padding: '0.75rem 1rem', borderBottom: '1px solid var(--border-color)', color: 'var(--text-secondary)', fontWeight: 600, width: '15%' }}>Status</th>
                <th style={{ textAlign: 'right', padding: '0.75rem 1rem', borderBottom: '1px solid var(--border-color)', color: 'var(--text-secondary)', fontWeight: 600, width: '20%' }}>Date</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => (
                <tr key={order.id}>
                  <td style={{ padding: '0.75rem 1rem', borderBottom: '1px solid var(--border-color)', color: 'var(--text-primary)' }}>{order.id}</td>
                  <td style={{ padding: '0.75rem 1rem', borderBottom: '1px solid var(--border-color)', color: 'var(--text-primary)' }}>{order.customer}</td>
                  <td style={{ padding: '0.75rem 1rem', borderBottom: '1px solid var(--border-color)', color: 'var(--text-primary)', textAlign: 'right' }}>₹{order.amount.toLocaleString()}</td>
                  <td style={{ padding: '0.75rem 1rem', borderBottom: '1px solid var(--border-color)', textAlign: 'center' }}>
                    <span className={`status-badge ${getStatusBadgeClass(order.status)}`}>
                      {order.status}
                    </span>
                  </td>
                  <td style={{ padding: '0.75rem 1rem', borderBottom: '1px solid var(--border-color)', color: 'var(--text-secondary)', textAlign: 'right' }}>{new Date(order.date).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      
      <div className="card-footer">
        <a href="/dashboard/orders" className="view-all-link">View All Orders</a>
        <span style={{ color: 'var(--text-secondary)' }}>{orders.length} recent orders</span>
      </div>
    </div>
  );
} 