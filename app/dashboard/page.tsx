'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../lib/contexts/AuthContext';
import DashboardLayout from '../components/dashboard/DashboardLayout';
import StatsCard from '../components/dashboard/StatsCard';
import ChartCard from '../components/dashboard/ChartCard';
import RevenueChart from '../components/dashboard/charts/RevenueChart';
import OrdersChart from '../components/dashboard/charts/OrdersChart';
import ProductionChart from '../components/dashboard/charts/ProductionChart';
import InventoryChart from '../components/dashboard/charts/InventoryChart';
import RecentOrders from '../components/dashboard/RecentOrders';
import DashboardLoading from '../components/dashboard/DashboardLoading';
import dashboardService, { DashboardStats } from '../lib/services/dashboardService';

// Import icons
import { FaDollarSign, FaBoxes, FaUsers, FaIndustry, FaSync, FaExclamationTriangle } from 'react-icons/fa';

interface DateFilter {
  startDate: Date;
  endDate: Date;
}

export default function DashboardPage() {
  const router = useRouter();
  const { user, isLoading, error, isAuthenticated } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentOrders, setRecentOrders] = useState<any[]>([]);
  const [isDataLoading, setIsDataLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isFirstLoad, setIsFirstLoad] = useState(true);
  const [dateFilter, setDateFilter] = useState<DateFilter | null>(null);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isLoading, isAuthenticated, router]);

  // Load dashboard data
  const loadDashboardData = useCallback(async (filter?: DateFilter) => {
    if (isAuthenticated && user) {
      try {
        if (isFirstLoad) {
          setIsDataLoading(true);
        } else {
          setIsRefreshing(true);
        }
        
        // Pass the date filter to the service calls
        const dashStats = await dashboardService.getStats(filter);
        const orders = await dashboardService.getRecentOrders(filter);
        
        setStats(dashStats);
        setRecentOrders(orders);
      } catch (err) {
        console.error('Error loading dashboard data:', err);
      } finally {
        setIsDataLoading(false);
        setIsRefreshing(false);
        setIsFirstLoad(false);
      }
    }
  }, [isAuthenticated, user, isFirstLoad]);

  // Initial data load
  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);
  
  // Handle date filter
  const handleApplyDateFilter = useCallback((startDate: Date, endDate: Date) => {
    const newFilter = { startDate, endDate };
    setDateFilter(newFilter);
    loadDashboardData(newFilter);
  }, [loadDashboardData]);
  
  if (isLoading) {
    return <div className="loading">Loading...</div>;
  }
  
  if (error) {
    return <div className="error">{error}</div>;
  }
  
  if (!user) {
    return <div className="error">No user data available</div>;
  }

  return (
    <DashboardLayout 
      pageTitle="Dashboard"
      onApplyDateFilter={handleApplyDateFilter}
    >
      {isDataLoading && isFirstLoad ? (
        <DashboardLoading />
      ) : (
        <div className="dashboard-grid">
          {isRefreshing && (
            <div className="refresh-indicator">
              <FaSync className="refresh-icon spinning" />
              <span>Updating dashboard...</span>
            </div>
          )}
          
          {/* Stats Cards - Row 1 */}
          <div className="dashboard-row">
            <div style={{ gridColumn: 'span 3' }}>
              <StatsCard 
                title="Total Revenue"
                value={`₹${stats?.revenue.total.toLocaleString() || '0'}`}
                change={{
                  value: `${stats?.revenue.change || 0}%`,
                  isPositive: (stats?.revenue.change || 0) > 0
                }}
                icon={<FaDollarSign />}
                iconClass="revenue"
                period={stats?.revenue.period}
              />
            </div>
            
            <div style={{ gridColumn: 'span 3' }}>
              <StatsCard 
                title="Total Orders"
                value={stats?.orders.total.toLocaleString() || '0'}
                change={{
                  value: `${stats?.orders.change || 0}%`,
                  isPositive: (stats?.orders.change || 0) > 0
                }}
                icon={<FaBoxes />}
                iconClass="orders"
                period={stats?.orders.period}
              />
            </div>
            
            <div style={{ gridColumn: 'span 3' }}>
              <StatsCard 
                title="Low Inventory Products"
                value={stats?.lowInventory?.total.toLocaleString() || '0'}
                change={{
                  value: `${stats?.lowInventory?.change || 0}%`,
                  isPositive: false
                }}
                icon={<FaExclamationTriangle />}
                iconClass="warning"
                period={stats?.lowInventory?.period || 'Current Status'}
                onClick={() => router.push('/dashboard/inventory')}
              />
            </div>
            
            <div style={{ gridColumn: 'span 3' }}>
              <StatsCard 
                title="Production Efficiency"
                value={`${stats?.efficiency.value || 0}%`}
                change={{
                  value: `${(stats?.efficiency.value || 0) - (stats?.efficiency.target || 0)}%`,
                  isPositive: (stats?.efficiency.value || 0) >= (stats?.efficiency.target || 0)
                }}
                icon={<FaIndustry />}
                iconClass="profit"
                period={stats?.efficiency.period}
              />
            </div>
          </div>

          {/* Charts - Row 2 */}
          <div className="dashboard-row">
            <div style={{ gridColumn: 'span 8' }}>
              <ChartCard 
                title="Revenue & Profit Overview"
                footer={<div>Monthly revenue and profit trends for the current year</div>}
              >
                <div className="chart-container">
                  <RevenueChart />
                </div>
              </ChartCard>
            </div>
            
            <div style={{ gridColumn: 'span 4' }}>
              <ChartCard 
                title="Inventory Status"
                footer={<div>Current inventory distribution by category</div>}
              >
                <div className="chart-container">
                  <InventoryChart />
                </div>
              </ChartCard>
            </div>
          </div>
          
          {/* Row 3 */}
          <div className="dashboard-row">
            <div style={{ gridColumn: 'span 6' }}>
              <ChartCard 
                title="Orders Overview"
                footer={<div>Monthly orders received and shipped</div>}
              >
                <div className="chart-container">
                  <OrdersChart />
                </div>
              </ChartCard>
            </div>
            
            <div style={{ gridColumn: 'span 6' }}>
              <ChartCard 
                title="Production Efficiency"
                footer={<div>Weekly production efficiency against target</div>}
              >
                <div className="chart-container">
                  <ProductionChart />
                </div>
              </ChartCard>
            </div>
          </div>
          
          {/* Row 4 */}
          <div className="dashboard-row">
            <div style={{ gridColumn: 'span 12' }}>
              <RecentOrders orders={recentOrders} />
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
} 