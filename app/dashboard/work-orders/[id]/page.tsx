'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  Clipboard,
  ChevronLeft,
  Clock,
  CalendarDays,
  Tag,
  AlertCircle,
  User,
  Pencil,
  CheckCircle,
  Trash2,
  Activity,
  Package,
  History,
  ListChecks,
  FileText,
  Users
} from 'lucide-react';
import DashboardLayout from '@/app/components/dashboard/DashboardLayout';
import { useAuth } from '@/app/lib/contexts/AuthContext';
import workOrderService from '@/app/lib/services/workOrderService';
import { LocalWorkOrder, LocalStatusChange, LocalWorkOrderAssembly } from '@/app/lib/db/localDb';
import { WorkOrderStatus, PriorityLevel } from '@/app/models/WorkOrder';
import '@/app/styles/work-order-details.css';

// Format date for display
const formatDate = (date: Date | string) => {
  if (!date) return 'N/A';
  return new Date(date).toLocaleDateString('en-US', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  });
};

// Format date with time for display
const formatDateTime = (date: Date | string) => {
  if (!date) return 'N/A';
  return new Date(date).toLocaleString('en-US', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

// Format priority for display
const formatPriority = (priority: PriorityLevel) => {
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
      return 'Unknown';
  }
};

// Format status for display
const formatStatus = (status: WorkOrderStatus) => {
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
      return 'Unknown';
  }
};

// Get user initials from name or ID
const getUserInitials = (name: string | number) => {
  if (typeof name === 'number') {
    return `U${name}`;
  }
  
  if (!name) return 'UN';
  
  const parts = name.trim().split(' ');
  if (parts.length === 1) {
    return parts[0].substring(0, 2).toUpperCase();
  }
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
};

export default function WorkOrderDetailsPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const { user: currentUser } = useAuth();
  const workOrderId = parseInt(params.id, 10);
  
  // State
  const [workOrder, setWorkOrder] = useState<LocalWorkOrder | null>(null);
  const [statusHistory, setStatusHistory] = useState<LocalStatusChange[]>([]);
  const [assemblies, setAssemblies] = useState<LocalWorkOrderAssembly[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'details' | 'assemblies' | 'history' | 'assignment'>('details');
  
  // Load work order data
  useEffect(() => {
    const fetchWorkOrderData = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        // Check if current user exists and is authenticated
        if (!currentUser) {
          router.push('/login');
          return;
        }
        
        // Get work order by ID
        const fetchedWorkOrder = await workOrderService.getById(workOrderId);
        
        if (!fetchedWorkOrder) {
          setError(`Work order with ID ${workOrderId} not found`);
          return;
        }
        
        setWorkOrder(fetchedWorkOrder);
        
        // Get status change history
        const fetchedStatusHistory = await workOrderService.getStatusChanges(workOrderId);
        setStatusHistory(fetchedStatusHistory);
        
        // Get assemblies
        const fetchedAssemblies = await workOrderService.getAssemblies(workOrderId);
        setAssemblies(fetchedAssemblies);
        
      } catch (err) {
        console.error('Error loading work order details:', err);
        setError('Failed to load work order details');
      } finally {
        setIsLoading(false);
      }
    };

    fetchWorkOrderData();
  }, [workOrderId, currentUser, router]);
  
  // Calculate progress percentage
  const calculateProgress = () => {
    if (!workOrder) return 0;
    return workOrder.totalQuantity > 0 
      ? Math.round((workOrder.completedQuantity / workOrder.totalQuantity) * 100) 
      : 0;
  };
  
  // Handle work order completion
  const handleComplete = async () => {
    if (!workOrder) return;
    
    try {
      await workOrderService.update(workOrderId, {
        status: WorkOrderStatus.COMPLETED,
        completedDate: new Date(),
        createdBy: currentUser?.id || 0
      });
      
      // Refresh the data
      const updatedWorkOrder = await workOrderService.getById(workOrderId);
      setWorkOrder(updatedWorkOrder || null);
      
      const updatedStatusHistory = await workOrderService.getStatusChanges(workOrderId);
      setStatusHistory(updatedStatusHistory);
      
    } catch (err) {
      console.error('Error completing work order:', err);
      setError('Failed to complete work order');
    }
  };
  
  // Handle work order deletion
  const handleDelete = async () => {
    if (!workOrder) return;
    
    if (window.confirm('Are you sure you want to delete this work order? This action cannot be undone.')) {
      try {
        await workOrderService.delete(workOrderId);
        router.push('/dashboard/work-orders');
      } catch (err) {
        console.error('Error deleting work order:', err);
        setError('Failed to delete work order');
      }
    }
  };
  
  // Navigate to edit page
  const navigateToEdit = () => {
    router.push(`/dashboard/work-orders/${workOrderId}/edit`);
  };

  // If still loading, show loading state
  if (isLoading) {
    return (
      <DashboardLayout pageTitle="Work Order Details">
        <div className="work-order-details-page">
          <div className="flex justify-center items-center h-64">
            <div className="text-center">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500 mb-4"></div>
              <p>Loading work order details...</p>
            </div>
          </div>
        </div>
      </DashboardLayout>
    );
  }
  
  // If error occurred, show error message
  if (error) {
    return (
      <DashboardLayout pageTitle="Work Order Details">
        <div className="work-order-details-page">
          <Link href="/dashboard/work-orders" className="back-link">
            <ChevronLeft className="back-icon" />
            Back to Work Orders
          </Link>
          
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
            <div className="flex items-center">
              <AlertCircle className="w-5 h-5 mr-2" />
              <span>{error}</span>
            </div>
            <div className="mt-2">
              <Link 
                href="/dashboard/work-orders" 
                className="text-red-700 underline"
              >
                Return to Work Orders
              </Link>
            </div>
          </div>
        </div>
      </DashboardLayout>
    );
  }
  
  // If no work order found, show not found message
  if (!workOrder) {
    return (
      <DashboardLayout pageTitle="Work Order Details">
        <div className="work-order-details-page">
          <Link href="/dashboard/work-orders" className="back-link">
            <ChevronLeft className="back-icon" />
            Back to Work Orders
          </Link>
          
          <div className="bg-gray-50 border border-gray-200 text-gray-700 px-4 py-3 rounded-lg mb-6">
            <div className="flex items-center">
              <AlertCircle className="w-5 h-5 mr-2" />
              <span>Work order not found</span>
            </div>
            <div className="mt-2">
              <Link 
                href="/dashboard/work-orders" 
                className="text-gray-700 underline"
              >
                Return to Work Orders
              </Link>
            </div>
          </div>
        </div>
      </DashboardLayout>
    );
  }
  
  // Calculate progress percentage
  const progressPercentage = calculateProgress();
  
  return (
    <DashboardLayout pageTitle={`Work Order ${workOrder.orderNumber}`}>
      <div className="work-order-details-page">
        <Link href="/dashboard/work-orders" className="back-link">
          <ChevronLeft className="back-icon" />
          Back to Work Orders
        </Link>
        
        {/* Header */}
        <div className="details-header">
          <div className="details-header-content">
            <h2 className="details-header-title">
              <Clipboard className="details-title-icon" />
              Work Order
              <span className="order-id-display">{workOrder.orderNumber}</span>
            </h2>
            
            <div className="customer-display">
              <User className="customer-icon" />
              Customer: {workOrder.customerName || `Customer #${workOrder.customerId}`}
            </div>
          </div>
          
          <div className="details-actions">
            <button 
              onClick={navigateToEdit}
              className="edit-button"
              disabled={workOrder.status === WorkOrderStatus.COMPLETED || workOrder.status === WorkOrderStatus.CANCELLED}
            >
              <Pencil className="action-icon" />
              Edit
            </button>
            
            {workOrder.status !== WorkOrderStatus.COMPLETED && 
             workOrder.status !== WorkOrderStatus.DELIVERED && 
             workOrder.status !== WorkOrderStatus.CANCELLED && (
              <button 
                onClick={handleComplete}
                className="complete-button"
              >
                <CheckCircle className="action-icon" />
                Complete
              </button>
            )}
            
            <button 
              onClick={handleDelete}
              className="delete-button"
            >
              <Trash2 className="action-icon" />
              Delete
            </button>
          </div>
        </div>
        
        {/* Status and Info Cards */}
        <div className="status-info-bar">
          <div className="info-card">
            <div className="info-card-title">Status</div>
            <div className="info-card-value">
              <span className={`status-badge status-${workOrder.status}`}>
                {formatStatus(workOrder.status)}
              </span>
            </div>
          </div>
          
          <div className="info-card">
            <div className="info-card-title">Priority</div>
            <div className="info-card-value">
              <span className={`priority-indicator priority-${workOrder.priority}`}></span>
              {formatPriority(workOrder.priority)}
            </div>
          </div>
          
          <div className="info-card">
            <div className="info-card-title">Start Date</div>
            <div className="info-card-value">
              {formatDate(workOrder.startDate)}
            </div>
          </div>
          
          <div className="info-card">
            <div className="info-card-title">Due Date</div>
            <div className="info-card-value">
              {formatDate(workOrder.dueDate)}
            </div>
          </div>
          
          {workOrder.completedDate && (
            <div className="info-card">
              <div className="info-card-title">Completed Date</div>
              <div className="info-card-value">
                {formatDate(workOrder.completedDate)}
              </div>
            </div>
          )}
        </div>
        
        {/* Progress Section */}
        <div className="progress-section">
          <h3 className="section-title">
            <Activity className="section-icon" />
            Order Progress
          </h3>
          
          <div className="progress-stats">
            <div className="stat-item">
              <div className="stat-label">Completion</div>
              <div className="stat-value">{progressPercentage}%</div>
            </div>
            
            <div className="stat-item">
              <div className="stat-label">Total Quantity</div>
              <div className="stat-value">{workOrder.totalQuantity}</div>
            </div>
            
            <div className="stat-item">
              <div className="stat-label">Completed</div>
              <div className="stat-value">{workOrder.completedQuantity}</div>
            </div>
            
            <div className="stat-item">
              <div className="stat-label">Remaining</div>
              <div className="stat-value">{workOrder.totalQuantity - workOrder.completedQuantity}</div>
            </div>
          </div>
          
          <div className="progress-container">
            <div className="progress-header">
              <div className="progress-percent">{progressPercentage}% Complete</div>
              <div className="progress-numbers">{workOrder.completedQuantity} of {workOrder.totalQuantity} completed</div>
            </div>
            <div className="progress-bar">
              <div 
                className="progress-fill"
                style={{ width: `${progressPercentage}%` }}
              ></div>
            </div>
          </div>
        </div>
        
        {/* Tabs */}
        <div className="details-tabs">
          <div 
            className={`tab ${activeTab === 'details' ? 'active' : ''}`}
            onClick={() => setActiveTab('details')}
          >
            <FileText className="w-4 h-4 mr-2 inline" />
            Details
          </div>
          
          <div 
            className={`tab ${activeTab === 'assemblies' ? 'active' : ''}`}
            onClick={() => setActiveTab('assemblies')}
          >
            <Package className="w-4 h-4 mr-2 inline" />
            Assemblies ({assemblies.length})
          </div>
          
          <div 
            className={`tab ${activeTab === 'history' ? 'active' : ''}`}
            onClick={() => setActiveTab('history')}
          >
            <History className="w-4 h-4 mr-2 inline" />
            History
          </div>
          
          <div 
            className={`tab ${activeTab === 'assignment' ? 'active' : ''}`}
            onClick={() => setActiveTab('assignment')}
          >
            <Users className="w-4 h-4 mr-2 inline" />
            Assignment
          </div>
        </div>
        
        {/* Tab Content */}
        {activeTab === 'details' && (
          <div className="details-section">
            <h3 className="section-title">
              <FileText className="section-icon" />
              Order Details
            </h3>
            
            <div className="mb-6">
              <h4 className="text-sm font-medium text-gray-500 mb-2">Description</h4>
              <div className="description-content">
                {workOrder.description || 'No description provided.'}
              </div>
            </div>
            
            {workOrder.notes && (
              <div>
                <h4 className="text-sm font-medium text-gray-500 mb-2">Notes</h4>
                <div className="notes-content">
                  {workOrder.notes}
                </div>
              </div>
            )}
          </div>
        )}
        
        {activeTab === 'assemblies' && (
          <div className="details-section">
            <h3 className="section-title">
              <Package className="section-icon" />
              Assemblies
            </h3>
            
            {assemblies.length === 0 ? (
              <div className="text-gray-500">No assemblies found for this work order.</div>
            ) : (
              <div className="assemblies-list">
                {assemblies.map((assembly) => {
                  // Calculate assembly progress
                  const assemblyProgress = assembly.quantity > 0 
                    ? Math.round((assembly.completedQuantity / assembly.quantity) * 100) 
                    : 0;
                  
                  return (
                    <div key={assembly.id} className="assembly-item">
                      <div className="assembly-header">
                        <div className="assembly-name">
                          {assembly.name}
                        </div>
                        {assembly.partCode && (
                          <div className="assembly-code">
                            Part Code: {assembly.partCode}
                          </div>
                        )}
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <div className="text-sm text-gray-500 mb-1">Quantity</div>
                          <div className="font-medium">{assembly.quantity}</div>
                        </div>
                        <div>
                          <div className="text-sm text-gray-500 mb-1">Completed</div>
                          <div className="font-medium">{assembly.completedQuantity}</div>
                        </div>
                      </div>
                      
                      <div className="assembly-progress">
                        <div className="flex justify-between text-sm mb-1">
                          <div className="font-medium text-primary-600">{assemblyProgress}%</div>
                          <div className="text-gray-500">{assembly.completedQuantity} of {assembly.quantity}</div>
                        </div>
                        <div className="progress-bar">
                          <div 
                            className="progress-fill"
                            style={{ width: `${assemblyProgress}%` }}
                          ></div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
        
        {activeTab === 'history' && (
          <div className="details-section">
            <h3 className="section-title">
              <History className="section-icon" />
              Status History
            </h3>
            
            {statusHistory.length === 0 ? (
              <div className="text-gray-500">No status change history available.</div>
            ) : (
              <div className="history-list">
                {statusHistory.map((change) => (
                  <div key={change.id} className="history-item">
                    <div className="history-icon-container">
                      <Clock className="history-icon" />
                    </div>
                    <div className="history-content">
                      <div className="history-title">
                        Status changed from <span className={`history-status status-${change.previousStatus}`}>{formatStatus(change.previousStatus)}</span> to <span className={`history-status status-${change.newStatus}`}>{formatStatus(change.newStatus)}</span>
                      </div>
                      <div className="history-detail">
                        Changed by User #{change.changedBy}
                        {change.reason && <div>Reason: {change.reason}</div>}
                      </div>
                      <div className="history-date">
                        {formatDateTime(change.timestamp)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
        
        {activeTab === 'assignment' && (
          <div className="details-section">
            <h3 className="section-title">
              <Users className="section-icon" />
              Assigned Users
            </h3>
            
            {!workOrder.assignedUsers || workOrder.assignedUsers.length === 0 ? (
              <div className="text-gray-500">No users assigned to this work order.</div>
            ) : (
              <div>
                <p className="mb-4">This work order is assigned to the following users:</p>
                <div className="assigned-users">
                  {workOrder.assignedUsers.map((userId) => (
                    <div key={userId} className="user-avatar">
                      {getUserInitials(userId)}
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            <div className="mt-6">
              <p className="text-sm text-gray-500">
                Created by User #{workOrder.createdBy} on {formatDateTime(workOrder.createdAt)}
              </p>
              <p className="text-sm text-gray-500">
                Last updated: {formatDateTime(workOrder.updatedAt)}
              </p>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
} 