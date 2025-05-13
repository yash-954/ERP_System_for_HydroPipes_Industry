import { db } from '../db/localDb';
import { inventoryService } from './inventoryService'; // Add import for inventory service

// Type definitions for dashboard statistics
export interface DashboardStats {
  revenue: {
    total: number;
    change: number;
    period: string;
  };
  orders: {
    total: number;
    change: number;
    period: string;
  };
  customers: {
    total: number;
    change: number;
    period: string;
  };
  efficiency: {
    value: number;
    target: number;
    period: string;
  };
  lowInventory?: { // Add low inventory to the stats interface
    total: number;
    change: number;
    period: string;
  };
}

// Date Filter type
export interface DateFilter {
  startDate: Date;
  endDate: Date;
}

const dashboardService = {
  /**
   * Get dashboard statistics filtered by date range
   */
  getStats: async (dateFilter?: DateFilter): Promise<DashboardStats> => {
    try {
      // We would normally fetch actual data from the database filtered by date range
      // For demo purposes, we're generating dummy data
      const stats: DashboardStats = {
        revenue: {
          total: 85500,
          change: 10.5,
          period: 'From Last Day'
        },
        orders: {
          total: 1000,
          change: 10.5,
          period: 'From Last Day'
        },
        customers: {
          total: 300,
          change: 10.5,
          period: 'From Last Day'
        },
        efficiency: {
          value: 89,
          target: 90,
          period: 'This Week'
        },
        lowInventory: {
          total: 0,
          change: 0,
          period: 'Current Status'
        }
      };
      
      // Try to get some real counts from the database
      try {
        const customerCount = await db.customers.count();
        if (customerCount > 0) {
          stats.customers.total = customerCount;
        }
        
        const orderCount = await db.orders.count();
        if (orderCount > 0) {
          stats.orders.total = orderCount;
        }
        
        // Get low inventory items count
        const lowInventoryItems = await inventoryService.getLowStockItems();
        if (lowInventoryItems.length > 0) {
          stats.lowInventory!.total = lowInventoryItems.length;
          // We'll show a negative change to highlight this is a concern
          stats.lowInventory!.change = -5.2; 
        }
      } catch (error) {
        console.error('Error fetching counts from database:', error);
      }
      
      // If dateFilter is provided, adjust the stats based on date range
      if (dateFilter) {
        // Calculate days difference
        const daysDifference = Math.ceil(
          (dateFilter.endDate.getTime() - dateFilter.startDate.getTime()) / (1000 * 60 * 60 * 24)
        );
        
        // Update period text
        stats.revenue.period = `${daysDifference} days`;
        stats.orders.period = `${daysDifference} days`;
        stats.customers.period = `${daysDifference} days`;
        
        // For demo purposes, scale the values based on date range
        if (daysDifference <= 1) {
          // Single day stats (scale down from monthly)
          const dailyFactor = 1/30;
          stats.revenue.total = Math.round(stats.revenue.total * dailyFactor);
          stats.orders.total = Math.max(10, Math.round(stats.orders.total * dailyFactor));
          stats.customers.total = Math.max(5, Math.round(stats.customers.total * dailyFactor));
        } else if (daysDifference <= 7) {
          // Weekly stats
          const weeklyFactor = 7/30;
          stats.revenue.total = Math.round(stats.revenue.total * weeklyFactor);
          stats.orders.total = Math.round(stats.orders.total * weeklyFactor);
          stats.customers.total = Math.round(stats.customers.total * weeklyFactor);
        } else if (daysDifference <= 90) {
          // Monthly/quarterly stats
          const monthlyFactor = daysDifference / 30;
          stats.revenue.total = Math.round(stats.revenue.total * monthlyFactor);
          stats.orders.total = Math.round(stats.orders.total * monthlyFactor);
        } else {
          // Yearly stats
          const yearlyFactor = daysDifference / 365;
          stats.revenue.total = Math.round(stats.revenue.total * 12 * yearlyFactor);
          stats.orders.total = Math.round(stats.orders.total * 12 * yearlyFactor);
          stats.customers.total = Math.round(stats.customers.total * (1 + yearlyFactor));
        }
      }
      
      return stats;
    } catch (error) {
      console.error('Error in getStats:', error);
      throw error;
    }
  },
  
  /**
   * Get the current inventory items to display on the dashboard
   */
  getInventoryStatus: async (dateFilter?: DateFilter) => {
    try {
      // Count inventory items by category
      // For demo purposes, return dummy data
      console.log('Filtering inventory by createdAt field');
      
      return [
        { name: 'Hydraulic Pumps', value: 42, color: '#3b82f6' },
        { name: 'Valves', value: 28, color: '#10b981' },
        { name: 'Cylinders', value: 15, color: '#f59e0b' },
        { name: 'Pipes & Hoses', value: 10, color: '#8b5cf6' },
        { name: 'Other Components', value: 5, color: '#64748b' },
      ];
    } catch (error) {
      console.error('Error in getInventoryStatus:', error);
      throw error;
    }
  },
  
  /**
   * Get recent orders for the dashboard, optionally filtered by date range
   */
  getRecentOrders: async (dateFilter?: DateFilter) => {
    try {
      // In a real app, we would filter orders by date range
      console.log('Filtering orders by createdAt field');
      
      // For demo, return dummy data with adjusted dates if date filter is provided
      const baseOrders = [
        { id: 'ORD-5123', customer: 'Reliance Industries', amount: 25600, status: 'Delivered', date: '2023-10-15' },
        { id: 'ORD-5122', customer: 'Tata Motors', amount: 18400, status: 'Shipped', date: '2023-10-14' },
        { id: 'ORD-5121', customer: 'Bharat Hydraulics', amount: 32000, status: 'Processing', date: '2023-10-13' },
        { id: 'ORD-5120', customer: 'Mahindra & Mahindra', amount: 15600, status: 'Pending', date: '2023-10-12' },
        { id: 'ORD-5119', customer: 'Larsen & Toubro', amount: 29800, status: 'Delivered', date: '2023-10-11' },
      ];
      
      // If date filter is provided, adjust dates to fall within the range
      if (dateFilter) {
        const startTime = dateFilter.startDate.getTime();
        const endTime = dateFilter.endDate.getTime();
        const timeSpan = endTime - startTime;
        
        return baseOrders.map((order, index) => {
          // Distribute orders evenly across the date range
          const orderTime = startTime + (timeSpan * (index / baseOrders.length));
          const orderDate = new Date(orderTime);
          
          return {
            ...order,
            date: orderDate.toISOString().split('T')[0],
          };
        });
      }
      
      return baseOrders;
    } catch (error) {
      console.error('Error in getRecentOrders:', error);
      throw error;
    }
  },
  
  /**
   * Get monthly revenue data, optionally filtered by date range
   */
  getRevenueData: async (dateFilter?: DateFilter) => {
    try {
      // Generate monthly revenue data for last 12 months
      // In a real app, we would filter by date range
      console.log('Filtering revenue data by createdAt field');
      
      return [
        { month: 'Jan', revenue: 25000, profit: 10000 },
        { month: 'Feb', revenue: 30000, profit: 12000 },
        { month: 'Mar', revenue: 28000, profit: 11000 },
        { month: 'Apr', revenue: 32000, profit: 13000 },
        { month: 'May', revenue: 40000, profit: 16000 },
        { month: 'Jun', revenue: 35000, profit: 14000 },
        { month: 'Jul', revenue: 45000, profit: 18000 },
        { month: 'Aug', revenue: 50000, profit: 21000 },
        { month: 'Sep', revenue: 42000, profit: 17000 },
        { month: 'Oct', revenue: 48000, profit: 20000 },
        { month: 'Nov', revenue: 52000, profit: 22000 },
        { month: 'Dec', revenue: 60000, profit: 24000 },
      ];
    } catch (error) {
      console.error('Error in getRevenueData:', error);
      throw error;
    }
  }
};

export default dashboardService; 