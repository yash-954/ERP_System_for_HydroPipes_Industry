'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Clipboard, 
  Search, 
  Filter, 
  PlusCircle, 
  AlertCircle,
  XCircle,
  ChevronLeft,
  ChevronRight,
  ArrowUpDown,
  Building,
  PenLine,
  CheckCircle,
  XIcon
} from 'lucide-react';
import DashboardLayout from '@/app/components/dashboard/DashboardLayout';
import { useAuth } from '@/app/lib/contexts/AuthContext';
import workOrderService from '@/app/lib/services/workOrderService';
import { LocalWorkOrder, db } from '@/app/lib/db/localDb';
import { WorkOrderStatus, PriorityLevel } from '@/app/models/WorkOrder';
import '@/app/styles/work-orders.css';
import { formatDateOnly } from '@/app/lib/utils/dateUtils';

const ITEMS_PER_PAGE = 10;

// Priority name formatter
const formatPriority = (priority: string): string => {
  switch (priority) {
    case PriorityLevel.LOW:
      return 'Low';
    case PriorityLevel.MEDIUM:
      return 'Medium';
    case PriorityLevel.HIGH:
      return 'High';
    case PriorityLevel.URGENT:
      return 'Urgent';
    default:
      return priority.toString().charAt(0).toUpperCase() + priority.toString().slice(1);
  }
};

// Status name formatter
const formatStatus = (status: string): string => {
  switch (status) {
    case WorkOrderStatus.DRAFT:
      return 'Draft';
    case WorkOrderStatus.PENDING:
      return 'Pending';
    case WorkOrderStatus.IN_PROGRESS:
      return 'In Progress';
    case WorkOrderStatus.ON_HOLD:
      return 'On Hold';
    case WorkOrderStatus.COMPLETED:
      return 'Completed';
    case WorkOrderStatus.DELIVERED:
      return 'Delivered';
    case WorkOrderStatus.CANCELLED:
      return 'Cancelled';
    default:
      return status.toString().charAt(0).toUpperCase() + status.toString().slice(1);
  }
};

// Format date for display with fallback
const formatDate = (date: Date | undefined) => {
  if (!date) {
    return "No date";
  }
  return formatDateOnly(date);
};

// Extend the LocalWorkOrder interface to include missing properties
interface ExtendedWorkOrder extends Omit<LocalWorkOrder, 'assemblies'> {
  id?: number;
  assignedToId?: number;
  assignedToName?: string;
  assemblies?: Array<{
    id?: number;
    name: string;
    partCode?: string;
    quantity: number;
    completedQuantity: number;
  }>;
}

export default function WorkOrdersPage() {
  const router = useRouter();
  const { user: currentUser } = useAuth();

  // Work orders data state
  const [workOrders, setWorkOrders] = useState<ExtendedWorkOrder[]>([]);
  const [filteredWorkOrders, setFilteredWorkOrders] = useState<ExtendedWorkOrder[]>([]);
  const [statusCounts, setStatusCounts] = useState<Record<WorkOrderStatus, number>>({
    [WorkOrderStatus.DRAFT]: 0,
    [WorkOrderStatus.PENDING]: 0,
    [WorkOrderStatus.IN_PROGRESS]: 0,
    [WorkOrderStatus.ON_HOLD]: 0,
    [WorkOrderStatus.COMPLETED]: 0,
    [WorkOrderStatus.DELIVERED]: 0,
    [WorkOrderStatus.CANCELLED]: 0
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [organizationName, setOrganizationName] = useState<string>('');

  // Filter and search state
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<WorkOrderStatus | 'ALL'>('ALL');
  const [priorityFilter, setPriorityFilter] = useState<PriorityLevel | 'ALL'>('ALL');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [selectedOrders, setSelectedOrders] = useState<number[]>([]);
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Sorting state
  const [sortField, setSortField] = useState<string>('dueDate');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  // Load work orders data
  useEffect(() => {
    const fetchWorkOrders = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        // Check if current user exists and is authenticated
        if (!currentUser) {
          router.push('/login');
          return;
        }
        
        // Get all work orders
        const fetchedWorkOrders = await workOrderService.getAll();
        
        // Load assemblies for each work order
        const ordersWithAssemblies = await Promise.all(
          fetchedWorkOrders.map(async (order) => {
            if (order.id) {
              // Fetch assemblies for this order
              const assemblies = await db.workOrderAssemblies
                .where('workOrderId')
                .equals(order.id)
                .toArray();
              
              // Calculate total quantity if it's not set
              let totalQty = order.totalQuantity || 0;
              if (totalQty === 0 && assemblies.length > 0) {
                totalQty = assemblies.reduce((sum, assembly) => sum + assembly.quantity, 0);
              }
              
              // Make sure completedQuantity is initialized
              const completedQty = order.completedQuantity || 0;
              
              return {
                ...order,
                assemblies,
                totalQuantity: totalQty,
                completedQuantity: completedQty
              } as ExtendedWorkOrder;
            }
            return order as ExtendedWorkOrder;
          })
        );
        
        setWorkOrders(ordersWithAssemblies);
        
        // Get status counts
        const counts = await workOrderService.getCountsByStatus();
        setStatusCounts(counts);
        
      } catch (err) {
        console.error('Error loading work orders:', err);
        setError('Failed to load work orders');
      } finally {
        setIsLoading(false);
      }
    };

    fetchWorkOrders();
  }, [currentUser, router]);

  // Apply filters and search
  useEffect(() => {
    let result = [...workOrders];
    
    // Apply search
    if (searchTerm) {
      const lowercaseSearch = searchTerm.toLowerCase();
      result = result.filter(
        order => 
          order.orderNumber.toLowerCase().includes(lowercaseSearch) || 
          order.customerName?.toLowerCase().includes(lowercaseSearch) ||
          order.description.toLowerCase().includes(lowercaseSearch)
      );
    }
    
    // Apply status filter
    if (statusFilter !== 'ALL') {
      result = result.filter(order => order.status === statusFilter);
    }
    
    // Apply priority filter
    if (priorityFilter !== 'ALL') {
      result = result.filter(order => order.priority === priorityFilter);
    }
    
    // Apply date range filter
    if (startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      end.setHours(23, 59, 59); // Set to end of day
      
      result = result.filter(order => {
        const dueDate = new Date(order.dueDate);
        return dueDate >= start && dueDate <= end;
      });
    }
    
    // Apply sorting
    result.sort((a, b) => {
      let comparison: number;
      
      if (sortField === 'dueDate') {
        comparison = new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
      } else if (sortField === 'priority') {
        const priorityOrder = {
          [PriorityLevel.LOW]: 1,
          [PriorityLevel.MEDIUM]: 2,
          [PriorityLevel.HIGH]: 3,
          [PriorityLevel.URGENT]: 4
        };
        comparison = priorityOrder[a.priority] - priorityOrder[b.priority];
      } else if (sortField === 'status') {
        const statusOrder = {
          [WorkOrderStatus.DRAFT]: 1,
          [WorkOrderStatus.PENDING]: 2,
          [WorkOrderStatus.IN_PROGRESS]: 3,
          [WorkOrderStatus.ON_HOLD]: 4,
          [WorkOrderStatus.COMPLETED]: 5,
          [WorkOrderStatus.DELIVERED]: 6,
          [WorkOrderStatus.CANCELLED]: 7
        };
        comparison = statusOrder[a.status] - statusOrder[b.status];
      } else if (sortField === 'progress') {
        comparison = (a.completedQuantity / a.totalQuantity) - (b.completedQuantity / b.totalQuantity);
      } else if (sortField === 'quantity') {
        comparison = a.totalQuantity - b.totalQuantity;
      } else if (sortField === 'customer') {
        comparison = (a.customerName || '').localeCompare(b.customerName || '');
      } else {
        // Default sort by order number
        comparison = a.orderNumber.localeCompare(b.orderNumber);
      }
      
      return sortDirection === 'asc' ? comparison : -comparison;
    });
    
    setFilteredWorkOrders(result);
    setTotalPages(Math.ceil(result.length / ITEMS_PER_PAGE));
    setCurrentPage(1); // Reset to first page when filters change
  }, [workOrders, searchTerm, statusFilter, priorityFilter, startDate, endDate, sortField, sortDirection]);

  // Get current page data
  const getCurrentPageData = () => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE;
    return filteredWorkOrders.slice(startIndex, endIndex);
  };

  // Handle selection of all orders on current page
  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      const currentPageIds = getCurrentPageData().map(order => order.id!);
      setSelectedOrders(currentPageIds);
    } else {
      setSelectedOrders([]);
    }
  };

  // Handle individual order selection
  const handleSelectOrder = (id: number, checked: boolean) => {
    if (checked) {
      setSelectedOrders(prev => [...prev, id]);
    } else {
      setSelectedOrders(prev => prev.filter(orderId => orderId !== id));
    }
  };

  // Handle sort toggle
  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(prev => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  // Reset filters
  const handleResetFilters = () => {
    setSearchTerm('');
    setStatusFilter('ALL');
    setPriorityFilter('ALL');
    setStartDate('');
    setEndDate('');
  };

  // Navigate to work order details
  const navigateToDetails = (orderId: number) => {
    router.push(`/dashboard/work-orders/${orderId}`);
  };

  // Navigate to create work order
  const navigateToCreateOrder = () => {
    router.push('/dashboard/work-orders/create');
  };

  // Go to previous page
  const goToPreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage(prev => prev - 1);
    }
  };

  // Go to next page
  const goToNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(prev => prev + 1);
    }
  };

  // Calculate total orders count
  const totalOrdersCount = workOrders.length;

  // Handle change of completed parts
  const handleCompletedPartsChange = async (orderId: number, completedQuantity: number, totalQuantity: number) => {
    try {
      // Get the current order
      const order = workOrders.find(o => o.id === orderId);
      
      if (!order) return;

      // Ensure value is within valid range
      completedQuantity = Math.max(0, Math.min(completedQuantity, totalQuantity));
      
      // Initialize totalQuantity if not defined (fallback)
      totalQuantity = totalQuantity || 0;
      
      // Calculate new completion percentage
      const newPercentage = totalQuantity > 0 ? Math.round((completedQuantity / totalQuantity) * 100) : 0;
      
      // Determine if status should be updated automatically based on completion
      let newStatus = order.status;
      
      if (newPercentage === 100 && order.status !== WorkOrderStatus.COMPLETED && order.status !== WorkOrderStatus.DELIVERED) {
        // If 100% complete and not already marked as completed/delivered, change to COMPLETED
        newStatus = WorkOrderStatus.COMPLETED;
      } else if (newPercentage === 0 && order.status !== WorkOrderStatus.PENDING && order.status !== WorkOrderStatus.DRAFT) {
        // If 0% complete and not already pending/draft, change to PENDING
        newStatus = WorkOrderStatus.PENDING;
      } else if (newPercentage > 0 && newPercentage < 100 && 
                order.status !== WorkOrderStatus.IN_PROGRESS && 
                order.status !== WorkOrderStatus.ON_HOLD &&
                order.status !== WorkOrderStatus.CANCELLED) {
        // If partially complete and not in an appropriate state, change to IN_PROGRESS
        newStatus = WorkOrderStatus.IN_PROGRESS;
      }
      
      // Also update the assembly completion if the order has assemblies
      if (order.assemblies && order.assemblies.length > 0) {
        // For simplicity, we'll update each assembly with a portion of the completed quantity
        // In a real application, you'd want a more sophisticated approach
        const assemblies = [...order.assemblies];
        const totalAssemblies = assemblies.length;
        
        for (let i = 0; i < totalAssemblies; i++) {
          const assembly = assemblies[i];
          // Check if assembly has an id property
          if (assembly && 'id' in assembly && assembly.id) {
            // Calculate completed quantity for this assembly proportionally
            const assemblyCompletedQty = Math.floor(completedQuantity / totalAssemblies);
            
            try {
              // Update assembly in database - specify the correct type for the update operation
              await db.workOrderAssemblies.update(Number(assembly.id), {
                completedQuantity: assemblyCompletedQty
              });
            } catch (updateError) {
              console.error('Error updating assembly:', updateError);
            }
          }
        }
      }
      
      // Update the order in the service
      await workOrderService.update(orderId, {
        completedQuantity,
        status: newStatus
      });
      
      // Update the local state - both completed quantity and potentially status
      const updatedOrders = workOrders.map(o => {
        if (o.id === orderId) {
          return { ...o, completedQuantity, status: newStatus };
        }
        return o;
      });
      
      setWorkOrders(updatedOrders);
      
      // If status changed, update status counts
      if (order.status !== newStatus) {
        const newStatusCounts = { ...statusCounts };
        newStatusCounts[order.status]--;
        newStatusCounts[newStatus]++;
        setStatusCounts(newStatusCounts);
      }
    } catch (err) {
      console.error('Error updating progress:', err);
      setError('Failed to update progress');
    }
  };

  // Add a handler for status changes
  const handleStatusChange = async (orderId: number, newStatus: WorkOrderStatus) => {
    try {
      // Get the current order
      const order = workOrders.find(o => o.id === orderId);
      
      if (!order) return;
      
      // Only update if status has changed
      if (newStatus !== order.status) {
        // Update the order in the service
        await workOrderService.update(orderId, {
          status: newStatus
        });
        
        // Update the local state
        const updatedOrders = workOrders.map(o => {
          if (o.id === orderId) {
            return { ...o, status: newStatus };
          }
          return o;
        });
        
        setWorkOrders(updatedOrders);
        
        // Update status counts
        const newStatusCounts = { ...statusCounts };
        newStatusCounts[order.status]--;
        newStatusCounts[newStatus]++;
        setStatusCounts(newStatusCounts);
      }
    } catch (err) {
      console.error('Error updating status:', err);
      setError('Failed to update status');
    }
  };

  // Function to determine available status options based on progress
  const getAvailableStatuses = (order: ExtendedWorkOrder): WorkOrderStatus[] => {
    // Calculate progress percentage
    const progressPercentage = order.totalQuantity > 0 
      ? Math.round((order.completedQuantity / order.totalQuantity) * 100) 
      : 0;
    
    if (progressPercentage === 100) {
      // All parts are complete, can be marked as COMPLETED
      return [WorkOrderStatus.COMPLETED, WorkOrderStatus.CANCELLED];
    } else if (progressPercentage === 0) {
      // No parts completed, can be PENDING or CANCELLED
      return [WorkOrderStatus.PENDING, WorkOrderStatus.CANCELLED];
    } else {
      // Partial completion, should be IN_PROGRESS
      return [WorkOrderStatus.IN_PROGRESS, WorkOrderStatus.ON_HOLD, WorkOrderStatus.CANCELLED];
    }
  };

  return (
    <DashboardLayout pageTitle="Work Orders">
      <div className="work-orders-page">
        <div className="page-header">
          <div className="header-content">
            <h2 className="header-title">
              <Clipboard className="header-title-icon" />
              Work Orders
              <span className="order-count-badge">
                {filteredWorkOrders.length} orders
              </span>
            </h2>
            {organizationName && (
              <div className="flex items-center text-gray-600 mt-1">
                <Building className="h-4 w-4 mr-1" />
                <span className="text-sm">{organizationName} Organization</span>
              </div>
            )}
          </div>
          
          <button 
            onClick={navigateToCreateOrder}
            className="add-order-button"
          >
            <PlusCircle className="add-order-button-icon" />
            Add Work Order
          </button>
        </div>
        
        {error && (
          <div className="alert alert-error">
            <AlertCircle className="alert-icon" />
            <div className="alert-content">
              <h3 className="alert-title">Error</h3>
              <p className="alert-message">{error}</p>
            </div>
            <button
              onClick={() => setError(null)}
              className="alert-close"
            >
              <XCircle />
            </button>
          </div>
        )}
        
        {/* Status Tabs */}
        <div className="status-tabs">
          <div 
            className={`status-tab ${statusFilter === 'ALL' ? 'active' : ''}`}
            onClick={() => setStatusFilter('ALL')}
          >
            All
            <span className="status-count">{totalOrdersCount}</span>
          </div>
          <div 
            className={`status-tab ${statusFilter === WorkOrderStatus.PENDING ? 'active' : ''}`}
            onClick={() => setStatusFilter(WorkOrderStatus.PENDING)}
          >
            Pending
            <span className="status-count">{statusCounts[WorkOrderStatus.PENDING]}</span>
          </div>
          <div 
            className={`status-tab ${statusFilter === WorkOrderStatus.IN_PROGRESS ? 'active' : ''}`}
            onClick={() => setStatusFilter(WorkOrderStatus.IN_PROGRESS)}
          >
            In-Progress
            <span className="status-count">{statusCounts[WorkOrderStatus.IN_PROGRESS]}</span>
          </div>
          <div 
            className={`status-tab ${statusFilter === WorkOrderStatus.COMPLETED ? 'active' : ''}`}
            onClick={() => setStatusFilter(WorkOrderStatus.COMPLETED)}
          >
            Done
            <span className="status-count">{statusCounts[WorkOrderStatus.COMPLETED] + statusCounts[WorkOrderStatus.DELIVERED]}</span>
          </div>
          <div 
            className={`status-tab ${statusFilter === WorkOrderStatus.CANCELLED ? 'active' : ''}`}
            onClick={() => setStatusFilter(WorkOrderStatus.CANCELLED)}
          >
            Cancelled
            <span className="status-count">{statusCounts[WorkOrderStatus.CANCELLED]}</span>
          </div>
        </div>
        
        {/* Filters */}
        <div className="filters-section">
          <div className="filters-container">
            <div className="search-container">
              <Search className="search-icon" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search work orders..."
                className="search-input"
              />
            </div>
            
            <div>
              <span className="filter-label">Priority:</span>
              <select
                value={priorityFilter}
                onChange={(e) => setPriorityFilter(e.target.value as PriorityLevel | 'ALL')}
                className="filter-select"
              >
                <option value="ALL">All Priorities</option>
                <option value={PriorityLevel.LOW}>Low</option>
                <option value={PriorityLevel.MEDIUM}>Medium</option>
                <option value={PriorityLevel.HIGH}>High</option>
                <option value={PriorityLevel.URGENT}>Urgent</option>
              </select>
            </div>
            
            <div className="date-range">
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="date-input"
                placeholder="From"
              />
              <span>to</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="date-input"
                placeholder="To"
              />
            </div>
            
            <button
              onClick={handleResetFilters}
              className="reset-filters-button"
            >
              <Filter className="reset-filters-icon" />
              Reset Filters
            </button>
          </div>
        </div>
        
        {/* Action Bar */}
        <div className="action-bar">
          <div className="action-buttons">
            <button className="update-status-button" disabled={selectedOrders.length === 0}>
              Update Status ▼
            </button>
            <button className="filter-button">
              <Filter className="w-4 h-4 mr-1" />
              Filter ▼
            </button>
          </div>
        </div>
        
        {/* Work Orders Table */}
        <div className="work-orders-container">
          <div className="overflow-x-auto">
            <table className="work-orders-table">
              <thead>
                <tr>
                  <th>
                    <input 
                      type="checkbox" 
                      onChange={handleSelectAll}
                      checked={selectedOrders.length === getCurrentPageData().length && getCurrentPageData().length > 0}
                    />
                  </th>
                  <th>
                    <button onClick={() => handleSort('priority')}>
                      Priority {sortField === 'priority' && <ArrowUpDown className="inline" />}
                    </button>
                  </th>
                  <th>
                    <button onClick={() => handleSort('orderNumber')}>
                      Order ID {sortField === 'orderNumber' && <ArrowUpDown className="inline" />}
                    </button>
                  </th>
                  <th>
                    <button onClick={() => handleSort('customer')}>
                      Customer {sortField === 'customer' && <ArrowUpDown className="inline" />}
                    </button>
                  </th>
                  <th>Assembly</th>
                  <th>Part Code</th>
                  <th>
                    <button onClick={() => handleSort('quantity')}>
                      Qty {sortField === 'quantity' && <ArrowUpDown className="inline" />}
                    </button>
                  </th>
                  <th>
                    <button onClick={() => handleSort('progress')}>
                      Progress {sortField === 'progress' && <ArrowUpDown className="inline" />}
                    </button>
                  </th>
                  <th>Account</th>
                  <th>
                    <button onClick={() => handleSort('status')}>
                      Status {sortField === 'status' && <ArrowUpDown className="inline" />}
                    </button>
                  </th>
                  <th>Details</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr>
                    <td colSpan={10} className="text-center py-8">
                      Loading work orders...
                    </td>
                  </tr>
                ) : getCurrentPageData().length === 0 ? (
                  <tr>
                    <td colSpan={10} className="text-center py-8">
                      No work orders found. Try adjusting your filters.
                    </td>
                  </tr>
                ) : (
                  getCurrentPageData().map(order => {
                    // Calculate progress percentage
                    const progressPercentage = order.totalQuantity > 0 
                      ? Math.round((order.completedQuantity / order.totalQuantity) * 100) 
                      : 0;
                      
                    // Get the primary assembly for display
                    const primaryAssembly = order.assemblies && order.assemblies.length > 0 
                      ? order.assemblies[0] 
                      : null;
                    
                    return (
                      <tr key={order.id}>
                        <td>
                          <input 
                            type="checkbox" 
                            checked={selectedOrders.includes(order.id!)}
                            onChange={(e) => handleSelectOrder(order.id!, e.target.checked)}
                          />
                        </td>
                        <td className="priority-cell">
                          <span className={`priority-indicator priority-${order.priority}`}></span>
                          {formatPriority(order.priority.toString())}
                        </td>
                        <td>
                          <div className="order-number">
                            <span className="order-id">{order.orderNumber}</span>
                            <span className="order-date">{formatDate(order.createdAt)}</span>
                          </div>
                        </td>
                        <td>
                          <div className="customer-info">
                            <span className="customer-name">{order.customerName || 'N/A'}</span>
                          </div>
                        </td>
                        <td className="assembly-cell">
                          {primaryAssembly ? (
                            <div className="assembly-name">{primaryAssembly.name}</div>
                          ) : (
                            <div className="assembly-name">No assembly</div>
                          )}
                          {order.assemblies && order.assemblies.length > 1 && (
                            <div className="text-xs text-gray-500">
                              +{order.assemblies.length - 1} more
                            </div>
                          )}
                        </td>
                        <td>
                          {primaryAssembly?.partCode || '-'}
                        </td>
                        <td className="text-center font-medium">
                          {order.totalQuantity || (primaryAssembly ? primaryAssembly.quantity : 0)}
                        </td>
                        <td className="progress-cell">
                          <div className="progress-container">
                            <div className="progress-text">
                              <div className="flex items-center">
                                <input
                                  type="number"
                                  min="0"
                                  max={order.totalQuantity || (primaryAssembly ? primaryAssembly.quantity : 0)}
                                  value={order.completedQuantity || 0}
                                  onChange={(e) => handleCompletedPartsChange(order.id!, parseInt(e.target.value, 10), order.totalQuantity || (primaryAssembly ? primaryAssembly.quantity : 0))}
                                  className="w-12 text-center border border-gray-300 rounded-md mr-1"
                                />
                                <span>/{order.totalQuantity || (primaryAssembly ? primaryAssembly.quantity : 0)}</span>
                              </div>
                            </div>
                            <div className="progress-bar">
                              <div 
                                className="progress-fill" 
                                style={{ width: `${progressPercentage}%` }}
                              ></div>
                            </div>
                          </div>
                        </td>
                        <td>
                          {order.assignedToName || (order.createdBy ? `User_${order.createdBy}` : 'Unassigned')}
                        </td>
                        <td className="status-cell">
                          <select
                            value={order.status}
                            onChange={(e) => handleStatusChange(order.id!, e.target.value as WorkOrderStatus)}
                            className={`status-dropdown status-${order.status}`}
                          >
                            <option value={order.status}>
                              {formatStatus(order.status.toString())}
                            </option>
                            {getAvailableStatuses(order)
                              .filter(status => status !== order.status)
                              .map(status => (
                                <option key={status} value={status}>
                                  {formatStatus(status.toString())}
                                </option>
                              ))}
                          </select>
                        </td>
                        <td className="actions-cell">
                          <button 
                            className="action-link"
                            onClick={() => navigateToDetails(order.id!)}
                          >
                            View&nbsp;Details
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
          
          {/* Pagination */}
          {filteredWorkOrders.length > 0 && (
            <div className="pagination">
              <div className="pagination-info">
                Showing <span className="font-medium">{(currentPage - 1) * ITEMS_PER_PAGE + 1}</span> to <span className="font-medium">
                  {Math.min(currentPage * ITEMS_PER_PAGE, filteredWorkOrders.length)}
                </span> of <span className="font-medium">{filteredWorkOrders.length}</span> results
              </div>
              <div className="pagination-controls">
                <button
                  onClick={goToPreviousPage}
                  disabled={currentPage === 1}
                  className="pagination-button"
                >
                  <ChevronLeft className="h-5 w-5" />
                </button>
                
                {/* Page numbers */}
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={`pagination-button ${currentPage === page ? 'active' : ''}`}
                  >
                    {page}
                  </button>
                ))}
                
                <button
                  onClick={goToNextPage}
                  disabled={currentPage === totalPages}
                  className="pagination-button"
                >
                  <ChevronRight className="h-5 w-5" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
} 