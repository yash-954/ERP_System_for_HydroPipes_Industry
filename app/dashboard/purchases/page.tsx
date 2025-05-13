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
  XIcon,
  ShoppingBag
} from 'lucide-react';
import DashboardLayout from '@/app/components/dashboard/DashboardLayout';
import { useAuth } from '@/app/lib/contexts/AuthContext';
import purchaseService from '@/app/lib/services/purchaseService';
import { LocalPurchaseOrder } from '@/app/lib/db/localDb';
import { PurchaseOrderStatus } from '@/app/models/Purchase';
import '@/app/styles/purchases.css';

const ITEMS_PER_PAGE = 10;

// Status name formatter
const formatStatus = (status: PurchaseOrderStatus) => {
  switch (status) {
    case PurchaseOrderStatus.DRAFT:
      return 'Draft';
    case PurchaseOrderStatus.PENDING_APPROVAL:
      return 'Pending Approval';
    case PurchaseOrderStatus.APPROVED:
      return 'Approved';
    case PurchaseOrderStatus.ORDERED:
      return 'Ordered';
    case PurchaseOrderStatus.PARTIALLY_RECEIVED:
      return 'Partially Received';
    case PurchaseOrderStatus.FULLY_RECEIVED:
      return 'Fully Received';
    case PurchaseOrderStatus.CANCELLED:
      return 'Cancelled';
    default:
      return status.charAt(0).toUpperCase() + status.slice(1).replace(/_/g, ' ');
  }
};

// Format date for display
const formatDate = (date: Date) => {
  return new Date(date).toLocaleDateString('en-US', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  });
};

// Format currency
const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR'
  }).format(amount);
};

export default function PurchasesPage() {
  const router = useRouter();
  const { user: currentUser } = useAuth();

  // Purchase orders data state
  const [purchaseOrders, setPurchaseOrders] = useState<LocalPurchaseOrder[]>([]);
  const [filteredPurchaseOrders, setFilteredPurchaseOrders] = useState<LocalPurchaseOrder[]>([]);
  const [statusCounts, setStatusCounts] = useState<Record<PurchaseOrderStatus, number>>({
    [PurchaseOrderStatus.DRAFT]: 0,
    [PurchaseOrderStatus.PENDING_APPROVAL]: 0,
    [PurchaseOrderStatus.APPROVED]: 0,
    [PurchaseOrderStatus.ORDERED]: 0,
    [PurchaseOrderStatus.PARTIALLY_RECEIVED]: 0,
    [PurchaseOrderStatus.FULLY_RECEIVED]: 0,
    [PurchaseOrderStatus.CANCELLED]: 0
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [organizationName, setOrganizationName] = useState<string>('');

  // Filter and search state
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<PurchaseOrderStatus | 'ALL'>('ALL');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [selectedOrders, setSelectedOrders] = useState<number[]>([]);
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Sorting state
  const [sortField, setSortField] = useState<string>('orderDate');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  // Load purchase orders data
  useEffect(() => {
    const fetchPurchaseOrders = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        // Check if current user exists and is authenticated
        if (!currentUser) {
          router.push('/login');
          return;
        }
        
        // Get all purchase orders
        const fetchedPurchaseOrders = await purchaseService.getAll();
        setPurchaseOrders(fetchedPurchaseOrders);
        
        // Get status counts
        const counts = await purchaseService.getCountsByStatus();
        setStatusCounts(counts);
        
      } catch (err) {
        console.error('Error loading purchase orders:', err);
        setError('Failed to load purchase orders');
      } finally {
        setIsLoading(false);
      }
    };

    fetchPurchaseOrders();
  }, [currentUser, router]);

  // Apply filters and search
  useEffect(() => {
    let result = [...purchaseOrders];
    
    // Apply search
    if (searchTerm) {
      const lowercaseSearch = searchTerm.toLowerCase();
      result = result.filter(
        order => 
          order.orderNumber.toLowerCase().includes(lowercaseSearch) || 
          order.supplierName?.toLowerCase().includes(lowercaseSearch) ||
          order.notes?.toLowerCase().includes(lowercaseSearch)
      );
    }
    
    // Apply status filter
    if (statusFilter !== 'ALL') {
      result = result.filter(order => order.status === statusFilter);
    }
    
    // Apply date range filter
    if (startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      end.setHours(23, 59, 59); // Set to end of day
      
      result = result.filter(order => {
        const orderDate = new Date(order.orderDate);
        return orderDate >= start && orderDate <= end;
      });
    }
    
    // Apply sorting
    result.sort((a, b) => {
      let comparison: number;
      
      if (sortField === 'orderDate') {
        comparison = new Date(a.orderDate).getTime() - new Date(b.orderDate).getTime();
      } else if (sortField === 'status') {
        const statusOrder = {
          [PurchaseOrderStatus.DRAFT]: 1,
          [PurchaseOrderStatus.PENDING_APPROVAL]: 2,
          [PurchaseOrderStatus.APPROVED]: 3,
          [PurchaseOrderStatus.ORDERED]: 4,
          [PurchaseOrderStatus.PARTIALLY_RECEIVED]: 5,
          [PurchaseOrderStatus.FULLY_RECEIVED]: 6,
          [PurchaseOrderStatus.CANCELLED]: 7
        };
        comparison = statusOrder[a.status] - statusOrder[b.status];
      } else if (sortField === 'totalAmount') {
        comparison = a.totalAmount - b.totalAmount;
      } else {
        // Default comparison for other fields
        comparison = (a[sortField as keyof LocalPurchaseOrder] as string)
          .localeCompare(b[sortField as keyof LocalPurchaseOrder] as string);
      }
      
      return sortDirection === 'asc' ? comparison : -comparison;
    });
    
    // Update filtered results
    setFilteredPurchaseOrders(result);
    
    // Update pagination
    setTotalPages(Math.max(1, Math.ceil(result.length / ITEMS_PER_PAGE)));
    setCurrentPage(1); // Reset to first page when filters change
  }, [purchaseOrders, searchTerm, statusFilter, startDate, endDate, sortField, sortDirection]);

  // Get current page data
  const getCurrentPageData = () => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE;
    return filteredPurchaseOrders.slice(startIndex, endIndex);
  };

  // Handle select all checkbox
  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      const currentPageIds = getCurrentPageData().map(order => order.id as number);
      setSelectedOrders(currentPageIds);
    } else {
      setSelectedOrders([]);
    }
  };

  // Handle individual order selection
  const handleSelectOrder = (id: number, checked: boolean) => {
    if (checked) {
      setSelectedOrders([...selectedOrders, id]);
    } else {
      setSelectedOrders(selectedOrders.filter(orderId => orderId !== id));
    }
  };

  // Handle sorting
  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  // Handle filter reset
  const handleResetFilters = () => {
    setSearchTerm('');
    setStatusFilter('ALL');
    setStartDate('');
    setEndDate('');
    setSelectedOrders([]);
  };

  // Navigate to purchase order details
  const navigateToDetails = (orderId: number) => {
    router.push(`/dashboard/purchases/${orderId}`);
  };

  // Navigate to create purchase order page
  const navigateToCreateOrder = () => {
    router.push('/dashboard/purchases/create');
  };

  // Pagination handlers
  const goToPreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
      setSelectedOrders([]);
    }
  };

  const goToNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
      setSelectedOrders([]);
    }
  };

  return (
    <DashboardLayout>
      <div className="purchase-orders-container">
        <div className="page-header">
          <div className="title-section">
            <h1>Purchase Orders</h1>
            <p>Manage your purchase orders and procurement processes</p>
          </div>
          <button 
            className="create-button"
            onClick={navigateToCreateOrder}
          >
            <PlusCircle size={16} />
            <span>Create Purchase Order</span>
          </button>
        </div>

        {error && (
          <div className="error-message">
            <AlertCircle size={18} />
            <span>{error}</span>
            <button onClick={() => setError(null)}><XCircle size={16} /></button>
          </div>
        )}

        <div className="stats-cards">
          {Object.entries(statusCounts).map(([status, count]) => (
            <div 
              key={status} 
              className={`stat-card ${statusFilter === status ? 'active' : ''}`}
              onClick={() => setStatusFilter(status as PurchaseOrderStatus)}
            >
              <h3>{formatStatus(status as PurchaseOrderStatus)}</h3>
              <p className="count">{count}</p>
            </div>
          ))}
          <div 
            className={`stat-card ${statusFilter === 'ALL' ? 'active' : ''}`}
            onClick={() => setStatusFilter('ALL')}
          >
            <h3>All Orders</h3>
            <p className="count">{purchaseOrders.length}</p>
          </div>
        </div>

        <div className="filter-section">
          <div className="search-box">
            <Search size={18} />
            <input 
              type="text"
              placeholder="Search orders by number, supplier, or notes..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            {searchTerm && (
              <button onClick={() => setSearchTerm('')}>
                <XCircle size={16} />
              </button>
            )}
          </div>

          <div className="filter-group">
            <div className="date-filters">
              <div className="date-input">
                <label>From</label>
                <input 
                  type="date" 
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </div>
              <div className="date-input">
                <label>To</label>
                <input 
                  type="date" 
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                />
              </div>
            </div>

            <button 
              className="reset-button"
              onClick={handleResetFilters}
            >
              <XIcon size={16} />
              <span>Reset</span>
            </button>
          </div>
        </div>

        <div className="table-container">
          <table className="purchase-orders-table">
            <thead>
              <tr>
                <th>
                  <input 
                    type="checkbox" 
                    checked={selectedOrders.length === getCurrentPageData().length && getCurrentPageData().length > 0}
                    onChange={handleSelectAll}
                  />
                </th>
                <th onClick={() => handleSort('orderNumber')}>
                  <div className="sort-header">
                    <span>Order #</span>
                    {sortField === 'orderNumber' && (
                      <ArrowUpDown size={14} className={sortDirection === 'asc' ? 'asc' : 'desc'} />
                    )}
                  </div>
                </th>
                <th onClick={() => handleSort('supplierName')}>
                  <div className="sort-header">
                    <span>Supplier</span>
                    {sortField === 'supplierName' && (
                      <ArrowUpDown size={14} className={sortDirection === 'asc' ? 'asc' : 'desc'} />
                    )}
                  </div>
                </th>
                <th onClick={() => handleSort('orderDate')}>
                  <div className="sort-header">
                    <span>Order Date</span>
                    {sortField === 'orderDate' && (
                      <ArrowUpDown size={14} className={sortDirection === 'asc' ? 'asc' : 'desc'} />
                    )}
                  </div>
                </th>
                <th onClick={() => handleSort('expectedDeliveryDate')}>
                  <div className="sort-header">
                    <span>Expected Delivery</span>
                    {sortField === 'expectedDeliveryDate' && (
                      <ArrowUpDown size={14} className={sortDirection === 'asc' ? 'asc' : 'desc'} />
                    )}
                  </div>
                </th>
                <th onClick={() => handleSort('totalAmount')}>
                  <div className="sort-header">
                    <span>Total Amount</span>
                    {sortField === 'totalAmount' && (
                      <ArrowUpDown size={14} className={sortDirection === 'asc' ? 'asc' : 'desc'} />
                    )}
                  </div>
                </th>
                <th onClick={() => handleSort('status')}>
                  <div className="sort-header">
                    <span>Status</span>
                    {sortField === 'status' && (
                      <ArrowUpDown size={14} className={sortDirection === 'asc' ? 'asc' : 'desc'} />
                    )}
                  </div>
                </th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={8} className="loading-message">Loading purchase orders...</td>
                </tr>
              ) : getCurrentPageData().length === 0 ? (
                <tr>
                  <td colSpan={8} className="no-results">No purchase orders found.</td>
                </tr>
              ) : (
                getCurrentPageData().map((order) => (
                  <tr key={order.id} onClick={() => navigateToDetails(order.id as number)}>
                    <td onClick={(e) => e.stopPropagation()}>
                      <input 
                        type="checkbox" 
                        checked={selectedOrders.includes(order.id as number)}
                        onChange={(e) => handleSelectOrder(order.id as number, e.target.checked)}
                      />
                    </td>
                    <td>
                      <div className="order-number">
                        <ShoppingBag size={16} />
                        <span>{order.orderNumber}</span>
                      </div>
                    </td>
                    <td>
                      <div className="supplier-info">
                        <Building size={16} />
                        <span>{order.supplierName}</span>
                      </div>
                    </td>
                    <td>{formatDate(order.orderDate)}</td>
                    <td>{order.expectedDeliveryDate ? formatDate(order.expectedDeliveryDate) : '--'}</td>
                    <td>{formatCurrency(order.totalAmount)}</td>
                    <td>
                      <div className={`status-badge ${order.status.toLowerCase()}`}>
                        {formatStatus(order.status)}
                      </div>
                    </td>
                    <td>
                      <div className="action-buttons" onClick={(e) => e.stopPropagation()}>
                        <button 
                          className="edit-button"
                          onClick={(e) => {
                            e.stopPropagation();
                            router.push(`/dashboard/purchases/${order.id}/edit`);
                          }}
                        >
                          <PenLine size={14} />
                        </button>
                        {order.status === PurchaseOrderStatus.ORDERED && (
                          <button 
                            className="receive-button"
                            onClick={(e) => {
                              e.stopPropagation();
                              router.push(`/dashboard/purchases/${order.id}/receive`);
                            }}
                          >
                            <CheckCircle size={14} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="pagination">
          <div className="pagination-info">
            Showing {filteredPurchaseOrders.length > 0 ? (currentPage - 1) * ITEMS_PER_PAGE + 1 : 0} to {Math.min(currentPage * ITEMS_PER_PAGE, filteredPurchaseOrders.length)} of {filteredPurchaseOrders.length} orders
          </div>
          <div className="pagination-controls">
            <button 
              className="pagination-button"
              disabled={currentPage === 1}
              onClick={goToPreviousPage}
            >
              <ChevronLeft size={16} />
              <span>Previous</span>
            </button>
            <div className="pagination-pages">
              Page {currentPage} of {totalPages}
            </div>
            <button 
              className="pagination-button"
              disabled={currentPage === totalPages}
              onClick={goToNextPage}
            >
              <span>Next</span>
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
} 