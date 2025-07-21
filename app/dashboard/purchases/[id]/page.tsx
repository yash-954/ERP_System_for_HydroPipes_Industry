'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  Clipboard,
  ChevronLeft,
  Calendar,
  CalendarDays,
  Tag,
  AlertCircle,
  User,
  Pencil,
  CheckCircle,
  Truck,
  Trash2,
  Activity,
  Package,
  History,
  ListChecks,
  FileText,
  Building,
  ShoppingBag,
  DollarSign,
  Clock,
  ExternalLink,
  X as XIcon
} from 'lucide-react';
import { CalendarDays as CalendarDaysIcon, Tag as TagIcon, User as UserIcon, Package as PackageIcon, ShoppingBag as ShoppingBagIcon, Clock as ClockIcon, ExternalLink as ExternalLinkIcon } from 'lucide-react';
import DashboardLayout from '@/app/components/dashboard/DashboardLayout';
import { useAuth } from '@/app/lib/contexts/AuthContext';
import purchaseService from '@/app/lib/services/purchaseService';
import { LocalPurchaseOrder } from '@/app/models/Purchase';
import { LocalPurchaseOrderStatusChange } from '@/app/lib/db/localDb';
import { PurchaseOrderStatus } from '@/app/models/Purchase';
import '@/app/styles/purchases.css';

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

// Format status for display
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
    case PurchaseOrderStatus.RECEIVED:
      return 'Fully Received';
    case PurchaseOrderStatus.CANCELLED:
      return 'Cancelled';
    default:
      return (status as string).charAt(0).toUpperCase() + (status as string).slice(1).replace(/_/g, ' ');
  }
};

// Format currency
const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR'
  }).format(amount);
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

export default function PurchaseOrderDetailsPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const { user: currentUser } = useAuth();
  const purchaseOrderId = parseInt(params.id, 10);
  
  // State
  const [purchaseOrder, setPurchaseOrder] = useState<LocalPurchaseOrder | null>(null);
  const [statusHistory, setStatusHistory] = useState<LocalPurchaseOrderStatusChange[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'details' | 'items' | 'history'>('details');
  
  // Load purchase order data
  useEffect(() => {
    const fetchPurchaseOrderData = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        // Check if current user exists and is authenticated
        if (!currentUser) {
          router.push('/login');
          return;
        }
        
        // Get purchase order by ID
        const fetchedPurchaseOrder = await purchaseService.getById(purchaseOrderId);
        
        if (!fetchedPurchaseOrder) {
          setError(`Purchase order with ID ${purchaseOrderId} not found`);
          return;
        }
        
        setPurchaseOrder(fetchedPurchaseOrder);
        
        // Get status change history
        const fetchedStatusHistory = await purchaseService.getStatusHistory(purchaseOrderId);
        setStatusHistory(fetchedStatusHistory);
        
      } catch (err) {
        console.error('Error loading purchase order details:', err);
        setError('Failed to load purchase order details');
      } finally {
        setIsLoading(false);
      }
    };

    fetchPurchaseOrderData();
  }, [purchaseOrderId, currentUser, router]);
  
  // Handle status update to the next step
  const handleAdvanceStatus = async () => {
    if (!purchaseOrder) return;
    
    let newStatus: PurchaseOrderStatus;
    
    // Determine the next status based on current status
    switch (purchaseOrder.status) {
      case PurchaseOrderStatus.DRAFT:
        newStatus = PurchaseOrderStatus.PENDING_APPROVAL;
        break;
      case PurchaseOrderStatus.PENDING_APPROVAL:
        newStatus = PurchaseOrderStatus.APPROVED;
        break;
      case PurchaseOrderStatus.APPROVED:
        newStatus = PurchaseOrderStatus.ORDERED;
        break;
      case PurchaseOrderStatus.ORDERED:
        // For ordered, we check if all items are received
        const allItemsReceived = purchaseOrder.lineItems.every(
          item => item.receivedQuantity === item.quantity
        );
        newStatus = allItemsReceived 
          ? PurchaseOrderStatus.RECEIVED 
          : PurchaseOrderStatus.PARTIALLY_RECEIVED;
        break;
      default:
        return; // No advancement for other statuses
    }
    
    try {
      await purchaseService.updateStatus(
        purchaseOrderId, 
        newStatus, 
        currentUser?.id || 0,
        `Status updated from ${formatStatus(purchaseOrder.status)} to ${formatStatus(newStatus)}`
      );
      
      // Refresh the data
      const updatedPurchaseOrder = await purchaseService.getById(purchaseOrderId);
      setPurchaseOrder(updatedPurchaseOrder || null);
      
      const updatedStatusHistory = await purchaseService.getStatusHistory(purchaseOrderId);
      setStatusHistory(updatedStatusHistory);
      
    } catch (err) {
      console.error('Error updating purchase order status:', err);
      setError('Failed to update purchase order status');
    }
  };
  
  // Handle marking items as received
  const handleMarkItemReceived = async (itemIndex: number, receivedQuantity: number) => {
    if (!purchaseOrder) return;
    
    try {
      // Clone the line items
      const updatedLineItems = [...purchaseOrder.lineItems];
      
      // Update the received quantity for the specific item
      updatedLineItems[itemIndex] = {
        ...updatedLineItems[itemIndex],
        receivedQuantity
      };
      
      // Check if all items are fully received
      const allItemsReceived = updatedLineItems.every(
        item => item.receivedQuantity === item.quantity
      );
      
      // Update the purchase order
      await purchaseService.update(purchaseOrderId, {
        lineItems: updatedLineItems,
        status: allItemsReceived 
          ? PurchaseOrderStatus.RECEIVED 
          : PurchaseOrderStatus.PARTIALLY_RECEIVED,
        createdBy: currentUser?.id || 0 // Using createdBy to track who updated it
      });
      
      // Refresh the data
      const updatedPurchaseOrder = await purchaseService.getById(purchaseOrderId);
      setPurchaseOrder(updatedPurchaseOrder || null);
      
    } catch (err) {
      console.error('Error marking item as received:', err);
      setError('Failed to mark item as received');
    }
  };
  
  // Handle purchase order cancellation
  const handleCancel = async () => {
    if (!purchaseOrder) return;
    
    if (window.confirm('Are you sure you want to cancel this purchase order? This action cannot be undone.')) {
      try {
        await purchaseService.updateStatus(
          purchaseOrderId,
          PurchaseOrderStatus.CANCELLED,
          currentUser?.id || 0,
          'Purchase order cancelled'
        );
        
        // Refresh the data
        const updatedPurchaseOrder = await purchaseService.getById(purchaseOrderId);
        setPurchaseOrder(updatedPurchaseOrder || null);
        
        const updatedStatusHistory = await purchaseService.getStatusHistory(purchaseOrderId);
        setStatusHistory(updatedStatusHistory);
        
      } catch (err) {
        console.error('Error cancelling purchase order:', err);
        setError('Failed to cancel purchase order');
      }
    }
  };
  
  // Handle purchase order deletion
  const handleDelete = async () => {
    if (!purchaseOrder) return;
    
    if (window.confirm('Are you sure you want to delete this purchase order? This action cannot be undone.')) {
      try {
        await purchaseService.delete(purchaseOrderId);
        router.push('/dashboard/purchases');
      } catch (err) {
        console.error('Error deleting purchase order:', err);
        setError('Failed to delete purchase order');
      }
    }
  };
  
  // Navigate to edit page
  const navigateToEdit = () => {
    router.push(`/dashboard/purchases/create?id=${purchaseOrderId}`);
  };
  
  // Navigate to create work order page
  const navigateToCreateWorkOrder = () => {
    router.push(`/dashboard/work-orders/create`);
  };
  
  // Handle print/download PDF
  const handlePrintPDF = () => {
    window.print();
  };
  
  // Render status badge
  const renderStatusBadge = (status: PurchaseOrderStatus) => {
    let className = 'status-badge ';
    
    switch (status) {
      case PurchaseOrderStatus.DRAFT:
        className += 'status-draft';
        break;
      case PurchaseOrderStatus.PENDING_APPROVAL:
        className += 'status-pending';
        break;
      case PurchaseOrderStatus.APPROVED:
        className += 'status-approved';
        break;
      case PurchaseOrderStatus.ORDERED:
        className += 'status-ordered';
        break;
      case PurchaseOrderStatus.PARTIALLY_RECEIVED:
        className += 'status-partial';
        break;
      case PurchaseOrderStatus.RECEIVED:
        className += 'status-completed';
        break;
      case PurchaseOrderStatus.CANCELLED:
        className += 'status-cancelled';
        break;
      default:
        className += 'status-unknown';
    }
    
    return <span className={className}>{formatStatus(status)}</span>;
  };
  
  // Get next action button text
  const getNextActionText = () => {
    if (!purchaseOrder) return '';
    
    switch (purchaseOrder.status) {
      case PurchaseOrderStatus.DRAFT:
        return 'Submit for Approval';
      case PurchaseOrderStatus.PENDING_APPROVAL:
        return 'Approve Order';
      case PurchaseOrderStatus.APPROVED:
        return 'Mark as Ordered';
      case PurchaseOrderStatus.ORDERED:
        return 'Mark Items as Received';
      default:
        return '';
    }
  };
  
  // Render loading state
  if (isLoading) {
    return (
      <DashboardLayout pageTitle="Loading Purchase Order">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading purchase order details...</p>
        </div>
      </DashboardLayout>
    );
  }
  
  // Render error state
  if (error) {
    return (
      <DashboardLayout pageTitle="Error">
        <div className="error-container">
          <AlertCircle className="error-icon" />
          <h2>Error</h2>
          <p>{error}</p>
          <Link href="/dashboard/purchases" className="btn-secondary">
            <ChevronLeft size={16} />
            Back to Purchase Orders
          </Link>
        </div>
      </DashboardLayout>
    );
  }
  
  // Render not found state
  if (!purchaseOrder) {
    return (
      <DashboardLayout pageTitle="Not Found">
        <div className="not-found-container">
          <AlertCircle className="not-found-icon" />
          <h2>Purchase Order Not Found</h2>
          <p>The requested purchase order could not be found.</p>
          <Link href="/dashboard/purchases" className="btn-secondary">
            <ChevronLeft size={16} />
            Back to Purchase Orders
          </Link>
        </div>
      </DashboardLayout>
    );
  }
  
  return (
    <DashboardLayout pageTitle={`Purchase Order: ${purchaseOrder.orderNumber}`}>
      <div className="purchase-order-details-container">
        {/* Header */}
        <div className="purchase-order-header">
          <div className="header-actions">
            <Link href="/dashboard/purchases" className="btn-link">
              <ChevronLeft size={16} />
              Back to Purchase Orders
            </Link>
          </div>
          
          <div className="header-main">
            <h1 className="purchase-order-title">
              <Clipboard className="icon" />
              {purchaseOrder.orderNumber}
            </h1>
            <div className="purchase-order-meta">
              {renderStatusBadge(purchaseOrder.status)}
              <span className="meta-item">
                <Calendar className="icon-sm" />
                {formatDate(purchaseOrder.orderDate)}
              </span>
              <span className="meta-item">
                <Building className="icon-sm" />
                {purchaseOrder.supplierName}
              </span>
              <span className="meta-item">
                <DollarSign className="icon-sm" />
                {formatCurrency(purchaseOrder.totalAmount)}
              </span>
            </div>
          </div>
          
          <div className="header-actions">
            {purchaseOrder.status === PurchaseOrderStatus.DRAFT && (
              <button 
                className="btn-primary"
                onClick={navigateToEdit}
              >
                <Pencil size={16} />
                Edit
              </button>
            )}
            
            {(purchaseOrder.status === PurchaseOrderStatus.RECEIVED || 
              purchaseOrder.status === PurchaseOrderStatus.PARTIALLY_RECEIVED) && (
              <button 
                className="btn-primary"
                onClick={navigateToCreateWorkOrder}
              >
                <ExternalLinkIcon size={16} />
                Create Work Order
              </button>
            )}
            
            {purchaseOrder.status !== PurchaseOrderStatus.CANCELLED && 
             purchaseOrder.status !== PurchaseOrderStatus.RECEIVED && 
             getNextActionText() && (
              <button 
                className="btn-secondary"
                onClick={handleAdvanceStatus}
              >
                <CheckCircle size={16} />
                {getNextActionText()}
              </button>
            )}
            
            <button 
              className="btn-secondary"
              onClick={handlePrintPDF}
            >
              <FileText size={16} />
              Print / Download
            </button>
            
            {purchaseOrder.status !== PurchaseOrderStatus.CANCELLED && (
              <button 
                className="btn-danger"
                onClick={handleCancel}
              >
                <XIcon size={16} />
                Cancel Order
              </button>
            )}
          </div>
        </div>
        
        {/* Tab Navigation */}
        <div className="tabs-container">
          <div className="tabs">
            <button 
              className={`tab ${activeTab === 'details' ? 'active' : ''}`}
              onClick={() => setActiveTab('details')}
            >
              <FileText size={16} />
              Order Details
            </button>
            <button 
              className={`tab ${activeTab === 'items' ? 'active' : ''}`}
              onClick={() => setActiveTab('items')}
            >
              <ListChecks size={16} />
              Line Items
            </button>
            <button 
              className={`tab ${activeTab === 'history' ? 'active' : ''}`}
              onClick={() => setActiveTab('history')}
            >
              <History size={16} />
              Status History
            </button>
          </div>
        </div>
        
        {/* Tab Content */}
        <div className="tab-content">
          {/* Details Tab */}
          {activeTab === 'details' && (
            <div className="details-tab">
              <div className="details-section">
                <h2 className="section-title">Purchase Order Information</h2>
                <div className="details-grid">
                  <div className="detail-item">
                    <span className="detail-label">Order Number:</span>
                    <span className="detail-value">{purchaseOrder.orderNumber}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Status:</span>
                    <span className="detail-value">{renderStatusBadge(purchaseOrder.status)}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Reference Number:</span>
                    <span className="detail-value">{purchaseOrder.referenceNumber || 'N/A'}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Created By:</span>
                    <span className="detail-value">User #{purchaseOrder.createdBy}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Created On:</span>
                    <span className="detail-value">{formatDateTime(purchaseOrder.createdAt)}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Last Updated:</span>
                    <span className="detail-value">{formatDateTime(purchaseOrder.updatedAt)}</span>
                  </div>
                </div>
              </div>

              <div className="details-section">
                <h2 className="section-title">Supplier Information</h2>
                <div className="details-grid">
                  <div className="detail-item">
                    <span className="detail-label">Supplier Name:</span>
                    <span className="detail-value">{purchaseOrder.supplierName}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Supplier ID:</span>
                    <span className="detail-value">{purchaseOrder.supplierId}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Payment Terms:</span>
                    <span className="detail-value">{purchaseOrder.paymentTerms || 'N/A'}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Shipping Method:</span>
                    <span className="detail-value">{purchaseOrder.shippingMethod || 'N/A'}</span>
                  </div>
                </div>
              </div>

              <div className="details-section">
                <h2 className="section-title">Dates and Timeline</h2>
                <div className="details-grid">
                  <div className="detail-item">
                    <span className="detail-label">Order Date:</span>
                    <span className="detail-value">{formatDate(purchaseOrder.orderDate)}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Expected Delivery Date:</span>
                    <span className="detail-value">{formatDate(purchaseOrder.expectedDeliveryDate)}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Actual Delivery Date:</span>
                    <span className="detail-value">{purchaseOrder.actualDeliveryDate ? formatDate(purchaseOrder.actualDeliveryDate) : 'Not yet delivered'}</span>
                  </div>
                </div>
              </div>

              <div className="details-section">
                <h2 className="section-title">Financial Information</h2>
                <div className="details-grid">
                  <div className="detail-item">
                    <span className="detail-label">Subtotal:</span>
                    <span className="detail-value">{formatCurrency(purchaseOrder.subtotal)}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Tax Amount:</span>
                    <span className="detail-value">{formatCurrency(purchaseOrder.taxAmount)}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Shipping Cost:</span>
                    <span className="detail-value">{formatCurrency(purchaseOrder.shippingCost || 0)}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Additional Charges:</span>
                    <span className="detail-value">{formatCurrency(purchaseOrder.additionalCharges || 0)}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Discount:</span>
                    <span className="detail-value">{formatCurrency(purchaseOrder.discount || 0)}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Total Amount:</span>
                    <span className="detail-value total-amount">{formatCurrency(purchaseOrder.totalAmount)}</span>
                  </div>
                </div>
              </div>

              {purchaseOrder.notes && (
                <div className="details-section">
                  <h2 className="section-title">Notes</h2>
                  <div className="notes-container">
                    <p>{purchaseOrder.notes}</p>
                  </div>
                </div>
              )}
            </div>
          )}
          
          {/* Line Items Tab */}
          {activeTab === 'items' && (
            <div className="items-tab">
              <div className="items-container">
                <h2 className="section-title">Purchase Order Line Items</h2>
                <div className="items-table-container">
                  <table className="items-table">
                    <thead>
                      <tr>
                        <th>Product</th>
                        <th>Description</th>
                        <th>Quantity</th>
                        <th>Received</th>
                        <th>Unit</th>
                        <th>Unit Price</th>
                        <th>Tax</th>
                        <th>Total</th>
                        {purchaseOrder.status === PurchaseOrderStatus.ORDERED && <th>Actions</th>}
                      </tr>
                    </thead>
                    <tbody>
                      {purchaseOrder.lineItems.map((item, index) => (
                        <tr key={index}>
                          <td>{item.productName}</td>
                          <td>{item.description || 'N/A'}</td>
                          <td>{item.quantity}</td>
                          <td>{item.receivedQuantity || 0} / {item.quantity}</td>
                          <td>{item.unit}</td>
                          <td>{formatCurrency(item.unitPrice)}</td>
                          <td>{formatCurrency(item.taxAmount)}</td>
                          <td>{formatCurrency(item.totalPrice)}</td>
                          {purchaseOrder.status === PurchaseOrderStatus.ORDERED && (
                            <td>
                              {item.receivedQuantity < item.quantity && (
                                <div className="receive-item-controls">
                                  <input 
                                    type="number" 
                                    min={item.receivedQuantity || 0}
                                    max={item.quantity}
                                    defaultValue={item.receivedQuantity || 0}
                                    id={`receive-quantity-${index}`}
                                    className="receive-quantity-input"
                                  />
                                  <button 
                                    className="btn-sm btn-primary"
                                    onClick={() => {
                                      const input = document.getElementById(`receive-quantity-${index}`) as HTMLInputElement;
                                      const value = parseInt(input.value, 10);
                                      if (value >= (item.receivedQuantity || 0) && value <= item.quantity) {
                                        handleMarkItemReceived(index, value);
                                      }
                                    }}
                                  >
                                    <Truck size={14} />
                                    Receive
                                  </button>
                                </div>
                              )}
                              {item.receivedQuantity === item.quantity && (
                                <span className="received-badge">
                                  <CheckCircle size={14} />
                                  Fully Received
                                </span>
                              )}
                            </td>
                          )}
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr>
                        <td colSpan={5}></td>
                        <td colSpan={2}>Subtotal</td>
                        <td>{formatCurrency(purchaseOrder.subtotal)}</td>
                        {purchaseOrder.status === PurchaseOrderStatus.ORDERED && <td></td>}
                      </tr>
                      <tr>
                        <td colSpan={5}></td>
                        <td colSpan={2}>Tax</td>
                        <td>{formatCurrency(purchaseOrder.taxAmount)}</td>
                        {purchaseOrder.status === PurchaseOrderStatus.ORDERED && <td></td>}
                      </tr>
                      {(purchaseOrder.shippingCost || 0) > 0 && (
                        <tr>
                          <td colSpan={5}></td>
                          <td colSpan={2}>Shipping</td>
                          <td>{formatCurrency(purchaseOrder.shippingCost || 0)}</td>
                          {purchaseOrder.status === PurchaseOrderStatus.ORDERED && <td></td>}
                        </tr>
                      )}
                      {(purchaseOrder.additionalCharges || 0) > 0 && (
                        <tr>
                          <td colSpan={5}></td>
                          <td colSpan={2}>Additional Charges</td>
                          <td>{formatCurrency(purchaseOrder.additionalCharges || 0)}</td>
                          {purchaseOrder.status === PurchaseOrderStatus.ORDERED && <td></td>}
                        </tr>
                      )}
                      {(purchaseOrder.discount || 0) > 0 && (
                        <tr>
                          <td colSpan={5}></td>
                          <td colSpan={2}>Discount</td>
                          <td>-{formatCurrency(purchaseOrder.discount || 0)}</td>
                          {purchaseOrder.status === PurchaseOrderStatus.ORDERED && <td></td>}
                        </tr>
                      )}
                      <tr className="total-row">
                        <td colSpan={5}></td>
                        <td colSpan={2}>Total</td>
                        <td>{formatCurrency(purchaseOrder.totalAmount)}</td>
                        {purchaseOrder.status === PurchaseOrderStatus.ORDERED && <td></td>}
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>
            </div>
          )}
          
          {/* History Tab */}
          {activeTab === 'history' && (
            <div className="history-tab">
              <div className="history-container">
                <h2 className="section-title">Status Change History</h2>
                {statusHistory.length === 0 ? (
                  <p className="no-history">No status changes recorded yet.</p>
                ) : (
                  <div className="timeline">
                    {statusHistory.map((change, index) => (
                      <div className="timeline-item" key={index}>
                        <div className="timeline-badge">
                          <Activity size={18} />
                        </div>
                        <div className="timeline-content">
                          <div className="timeline-header">
                            <span className="timeline-title">
                              Status changed from <strong>{formatStatus(change.previousStatus)}</strong> to <strong>{formatStatus(change.newStatus)}</strong>
                            </span>
                            <span className="timeline-date">{formatDateTime(change.timestamp)}</span>
                          </div>
                          <div className="timeline-body">
                            <p>
                              <span className="timeline-user">By: User #{change.changedBy}</span>
                              {change.reason && <span className="timeline-reason">Reason: {change.reason}</span>}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
        
        {/* Footer Actions */}
        <div className="purchase-order-footer">
          <div className="footer-actions">
            <Link href="/dashboard/purchases" className="btn-secondary">
              <ChevronLeft size={16} />
              Back to Purchase Orders
            </Link>
            
            {purchaseOrder.status === PurchaseOrderStatus.DRAFT && (
              <button 
                className="btn-danger"
                onClick={handleDelete}
              >
                <Trash2 size={16} />
                Delete Purchase Order
              </button>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
} 