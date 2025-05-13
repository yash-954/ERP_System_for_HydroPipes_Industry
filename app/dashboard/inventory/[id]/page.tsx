'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Package, 
  ChevronLeft, 
  Edit, 
  Trash,
  AlertCircle,
  Calendar,
  DollarSign,
  Truck,
  Map,
  Check,
  X,
  PlusCircle,
  Tag,
  Clipboard
} from 'lucide-react';
import DashboardLayout from '@/app/components/dashboard/DashboardLayout';
import { useAuth } from '@/app/lib/contexts/AuthContext';
import { inventoryService } from '@/app/lib/services/inventoryService';
import { LocalInventoryItem, LocalInventoryTransaction } from '@/app/lib/db/localDb';
import { InventoryStatus, InventoryType, InventoryTransactionType } from '@/app/models/Inventory';
import InventoryItemForm from '@/app/components/inventory/InventoryItemForm';
import '@/app/styles/inventory.css';

// Format the type name for display
const formatType = (type: string | undefined | null): string => {
  if (!type) return 'N/A';
  return type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
};

// Format currency for display
const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR'
  }).format(amount);
};

// Format date for display
const formatDate = (date: Date | undefined): string => {
  if (!date) return 'N/A';
  return new Date(date).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  });
};

// Format transaction type for display with appropriate color
const getTransactionTypeClass = (type: string): string => {
  const typeMap: Record<string, string> = {
    [InventoryTransactionType.PURCHASE]: 'transaction-purchase',
    [InventoryTransactionType.SALE]: 'transaction-sale',
    [InventoryTransactionType.ADJUSTMENT]: 'transaction-adjustment',
    [InventoryTransactionType.RETURN]: 'transaction-return',
    [InventoryTransactionType.TRANSFER]: 'transaction-transfer',
  };
  
  return typeMap[type] || 'transaction-other';
};

export default function InventoryItemDetail({ params }: { params: { id: string } }) {
  const router = useRouter();
  const { user: currentUser } = useAuth();
  const itemId = parseInt(params.id);

  // State for inventory item and related data
  const [inventoryItem, setInventoryItem] = useState<LocalInventoryItem | null>(null);
  const [transactions, setTransactions] = useState<LocalInventoryTransaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // State for modal
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showAdjustModal, setShowAdjustModal] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  // Load inventory item data
  useEffect(() => {
    const loadItemData = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        // Check if current user exists and is authenticated
        if (!currentUser) {
          router.push('/login');
          return;
        }
        
        if (isNaN(itemId)) {
          throw new Error('Invalid inventory item ID');
        }
        
        // Get inventory item
        const item = await inventoryService.getItemById(itemId);
        if (!item) {
          throw new Error('Inventory item not found');
        }
        setInventoryItem(item);
        
        // Get item transactions
        const itemTransactions = await inventoryService.getItemTransactions(itemId);
        setTransactions(itemTransactions);
        
      } catch (err) {
        console.error('Error loading inventory item data:', err);
        setError(err instanceof Error ? err.message : 'Failed to load inventory item data');
      } finally {
        setIsLoading(false);
      }
    };
    
    loadItemData();
  }, [currentUser, router, itemId]);
  
  // Handle navigate back
  const handleBack = () => {
    router.push('/dashboard/inventory');
  };
  
  // Handle edit item
  const handleEditItem = () => {
    setShowEditModal(true);
  };
  
  // Handle delete item
  const handleDeleteClick = () => {
    setShowDeleteConfirm(true);
  };
  
  // Confirm delete
  const handleConfirmDelete = async () => {
    try {
      setIsUpdating(true);
      await inventoryService.deleteItem(itemId);
      router.push('/dashboard/inventory');
    } catch (err) {
      console.error('Error deleting inventory item:', err);
      setError('Failed to delete inventory item');
      setShowDeleteConfirm(false);
    } finally {
      setIsUpdating(false);
    }
  };
  
  // Handle save item (edit)
  const handleSaveItem = async (updatedItem: Partial<LocalInventoryItem>) => {
    try {
      setIsUpdating(true);
      
      if (!currentUser || !currentUser.id) {
        setError('You must be logged in to update inventory items');
        return;
      }
      
      // Ensure the item ID is included
      const itemToUpdate = {
        ...updatedItem,
        id: itemId,
        updatedBy: currentUser.id
      } as LocalInventoryItem;
      
      // Update the item
      const updated = await inventoryService.updateItem(itemToUpdate);
      
      // Update state with updated item
      setInventoryItem(updated);
      
      // Get updated transactions
      const updatedTransactions = await inventoryService.getItemTransactions(itemId);
      setTransactions(updatedTransactions);
      
      setShowEditModal(false);
    } catch (err) {
      console.error('Error updating inventory item:', err);
      setError('Failed to update inventory item');
    } finally {
      setIsUpdating(false);
    }
  };
  
  // Determine status color class
  const getStatusClass = (status: InventoryStatus): string => {
    switch (status) {
      case InventoryStatus.IN_STOCK:
        return 'status-in-stock';
      case InventoryStatus.LOW_STOCK:
        return 'status-low-stock';
      case InventoryStatus.OUT_OF_STOCK:
        return 'status-out-of-stock';
      case InventoryStatus.DISCONTINUED:
        return 'status-discontinued';
      case InventoryStatus.PENDING_RECEIPT:
        return 'status-pending';
      default:
        return '';
    }
  };
  
  // Get stock level description
  const getStockLevelDescription = (): string => {
    if (!inventoryItem) return '';
    
    const { currentQuantity, minimumQuantity, maximumQuantity } = inventoryItem;
    
    if (currentQuantity <= 0) return 'Out of stock';
    if (currentQuantity <= minimumQuantity) return 'Low stock';
    if (currentQuantity >= maximumQuantity) return 'Excess stock';
    return 'Healthy stock level';
  };
  
  // Calculate days until restock needed
  const getDaysUntilRestock = (): number | null => {
    if (!inventoryItem || !inventoryItem.averageDailyUsage || inventoryItem.averageDailyUsage <= 0) {
      return null;
    }
    
    const { currentQuantity, minimumQuantity, averageDailyUsage } = inventoryItem;
    
    if (currentQuantity <= minimumQuantity) return 0;
    
    return Math.floor((currentQuantity - minimumQuantity) / averageDailyUsage);
  };
  
  return (
    <DashboardLayout pageTitle={inventoryItem ? `Inventory: ${inventoryItem.name}` : 'Inventory Item'}>
      <div className="inventory-item-detail">
        {/* Page header */}
        <div className="page-header">
          <div className="header-content">
            <button 
              onClick={handleBack}
              className="back-button"
            >
              <ChevronLeft className="back-icon" />
              Back to Inventory
            </button>
            <h2 className="header-title">
              <Package className="header-title-icon" />
              {isLoading ? 'Loading item...' : inventoryItem?.name || 'Item Details'}
            </h2>
          </div>
          
          {inventoryItem && (
            <div className="header-actions">
              <button 
                onClick={handleEditItem}
                className="edit-button"
                disabled={isLoading || isUpdating}
              >
                <Edit className="button-icon" />
                Edit Item
              </button>
              <button 
                onClick={handleDeleteClick}
                className="delete-button"
                disabled={isLoading || isUpdating}
              >
                <Trash className="button-icon" />
                Delete
              </button>
            </div>
          )}
        </div>
        
        {/* Error message */}
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
              <X className="h-5 w-5" />
            </button>
          </div>
        )}
        
        {/* Loading state */}
        {isLoading ? (
          <div className="loading-container">
            <div className="loading-spinner"></div>
            <p className="loading-text">Loading inventory item details...</p>
          </div>
        ) : inventoryItem ? (
          <>
            {/* Item Details */}
            <div className="item-details-container">
              <div className="item-overview">
                <div className="item-header">
                  <div className="item-identity">
                    <span className="item-sku">{inventoryItem.sku}</span>
                    <h1 className="item-name">{inventoryItem.name}</h1>
                    <p className="item-description">{inventoryItem.description}</p>
                  </div>
                  <div className="item-status-container">
                    <div className={`item-status ${getStatusClass(inventoryItem.status)}`}>
                      {formatType(inventoryItem.status)}
                    </div>
                    <div className="item-type">
                      <Tag className="inline-icon" />
                      {formatType(inventoryItem.type)}
                    </div>
                  </div>
                </div>
                
                <div className="item-metrics">
                  <div className="metric-card">
                    <div className="metric-header">
                      <Package className="metric-icon" />
                      <h3 className="metric-title">Quantity</h3>
                    </div>
                    <div className="metric-content">
                      <div className="metric-main">
                        <span className="metric-value">{inventoryItem.currentQuantity}</span>
                        <span className="metric-unit">{inventoryItem.unitOfMeasure}</span>
                      </div>
                      <div className="metric-details">
                        <div className="metric-detail">
                          <span className="detail-label">Reserved:</span>
                          <span className="detail-value">{inventoryItem.reservedQuantity}</span>
                        </div>
                        <div className="metric-detail">
                          <span className="detail-label">Available:</span>
                          <span className="detail-value">{inventoryItem.availableQuantity}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="metric-card">
                    <div className="metric-header">
                      <AlertCircle className="metric-icon" />
                      <h3 className="metric-title">Stock Levels</h3>
                    </div>
                    <div className="metric-content">
                      <div className="metric-main">
                        <span className="metric-value">{getStockLevelDescription()}</span>
                      </div>
                      <div className="metric-details">
                        <div className="metric-detail">
                          <span className="detail-label">Minimum Level:</span>
                          <span className="detail-value">{inventoryItem.minimumQuantity}</span>
                        </div>
                        <div className="metric-detail">
                          <span className="detail-label">Maximum Level:</span>
                          <span className="detail-value">{inventoryItem.maximumQuantity}</span>
                        </div>
                        <div className="metric-detail">
                          <span className="detail-label">Reorder Point:</span>
                          <span className="detail-value">{inventoryItem.reorderQuantity}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="metric-card">
                    <div className="metric-header">
                      <DollarSign className="metric-icon" />
                      <h3 className="metric-title">Value</h3>
                    </div>
                    <div className="metric-content">
                      <div className="metric-main">
                        <span className="metric-value">{formatCurrency(inventoryItem.totalValue)}</span>
                      </div>
                      <div className="metric-details">
                        <div className="metric-detail">
                          <span className="detail-label">Unit Price:</span>
                          <span className="detail-value">{formatCurrency(inventoryItem.unitPrice)}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="metric-card">
                    <div className="metric-header">
                      <Calendar className="metric-icon" />
                      <h3 className="metric-title">Dates</h3>
                    </div>
                    <div className="metric-content">
                      <div className="metric-details date-details">
                        <div className="metric-detail">
                          <span className="detail-label">Created:</span>
                          <span className="detail-value">{formatDate(inventoryItem.createdAt)}</span>
                        </div>
                        <div className="metric-detail">
                          <span className="detail-label">Last Updated:</span>
                          <span className="detail-value">{formatDate(inventoryItem.updatedAt)}</span>
                        </div>
                        <div className="metric-detail">
                          <span className="detail-label">Last Restocked:</span>
                          <span className="detail-value">{formatDate(inventoryItem.lastRestockDate)}</span>
                        </div>
                        <div className="metric-detail">
                          <span className="detail-label">Last Counted:</span>
                          <span className="detail-value">{formatDate(inventoryItem.lastCountDate)}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="item-detail-sections">
                  <div className="detail-section">
                    <h3 className="section-title">
                      <Truck className="section-icon" />
                      Supplier Information
                    </h3>
                    <div className="section-content">
                      <div className="detail-row">
                        <span className="detail-label">Supplier Name:</span>
                        <span className="detail-value">{inventoryItem.supplierName || 'N/A'}</span>
                      </div>
                      <div className="detail-row">
                        <span className="detail-label">Lead Time:</span>
                        <span className="detail-value">{inventoryItem.leadTimeInDays || 'N/A'} days</span>
                      </div>
                      <div className="detail-row">
                        <span className="detail-label">Days Until Restock Needed:</span>
                        <span className="detail-value">
                          {getDaysUntilRestock() !== null ? `${getDaysUntilRestock()} days` : 'N/A'}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="detail-section">
                    <h3 className="section-title">
                      <Map className="section-icon" />
                      Storage Information
                    </h3>
                    <div className="section-content">
                      <div className="detail-row">
                        <span className="detail-label">Location:</span>
                        <span className="detail-value">{inventoryItem.location || 'N/A'}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="detail-section">
                    <h3 className="section-title">
                      <Clipboard className="section-icon" />
                      Additional Information
                    </h3>
                    <div className="section-content">
                      <div className="detail-row">
                        <span className="detail-label">Notes:</span>
                        <span className="detail-value notes-value">{inventoryItem.notes || 'No additional notes'}</span>
                      </div>
                      <div className="detail-row">
                        <span className="detail-label">Active:</span>
                        <span className="detail-value">
                          {inventoryItem.isActive ? (
                            <Check className="icon-success" />
                          ) : (
                            <X className="icon-error" />
                          )}
                        </span>
                      </div>
                      <div className="detail-row">
                        <span className="detail-label">Flagged:</span>
                        <span className="detail-value">
                          {inventoryItem.isFlagged ? (
                            <Check className="icon-warning" />
                          ) : (
                            <X className="icon-neutral" />
                          )}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Transaction History */}
              <div className="transactions-section">
                <div className="section-header">
                  <h3 className="section-title">Transaction History</h3>
                  <button className="add-transaction-button">
                    <PlusCircle className="button-icon" />
                    Add Transaction
                  </button>
                </div>
                
                {transactions.length > 0 ? (
                  <div className="transaction-list">
                    <table className="transaction-table">
                      <thead>
                        <tr>
                          <th>Date</th>
                          <th>Type</th>
                          <th>Quantity</th>
                          <th>User</th>
                          <th>Reference</th>
                          <th>Notes</th>
                        </tr>
                      </thead>
                      <tbody>
                        {transactions.map(transaction => (
                          <tr key={transaction.id}>
                            <td>{formatDate(transaction.transactionDate)}</td>
                            <td>
                              <span className={`transaction-type ${getTransactionTypeClass(transaction.transactionType)}`}>
                                {formatType(transaction.transactionType)}
                              </span>
                            </td>
                            <td className={transaction.quantity > 0 ? 'quantity-positive' : 'quantity-negative'}>
                              {transaction.quantity > 0 ? '+' : ''}{transaction.quantity}
                            </td>
                            <td>{transaction.createdByName || 'N/A'}</td>
                            <td>{transaction.referenceNumber || 'N/A'}</td>
                            <td>{transaction.notes || 'N/A'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="empty-transactions">
                    <p>No transactions found for this item.</p>
                  </div>
                )}
              </div>
            </div>
            
            {/* Edit Modal */}
            <InventoryItemForm
              item={inventoryItem}
              isOpen={showEditModal}
              onClose={() => setShowEditModal(false)}
              onSave={handleSaveItem}
            />
            
            {/* Delete Confirmation Modal */}
            {showDeleteConfirm && (
              <div className="modal-overlay">
                <div className="modal-container delete-confirm-modal">
                  <div className="modal-header">
                    <h2 className="modal-title">Delete Inventory Item</h2>
                    <button 
                      onClick={() => setShowDeleteConfirm(false)}
                      className="modal-close-button"
                      disabled={isUpdating}
                    >
                      <X className="h-5 w-5" />
                    </button>
                  </div>
                  
                  <div className="modal-content">
                    <AlertCircle className="warning-icon" />
                    <p className="confirm-message">
                      Are you sure you want to delete <strong>{inventoryItem.name}</strong>?
                    </p>
                    <p className="warning-message">
                      This action cannot be undone. All transactions, reservations, and alerts associated with this item will also be deleted.
                    </p>
                  </div>
                  
                  <div className="modal-footer">
                    <button
                      onClick={() => setShowDeleteConfirm(false)}
                      className="cancel-button"
                      disabled={isUpdating}
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleConfirmDelete}
                      className="delete-button"
                      disabled={isUpdating}
                    >
                      {isUpdating ? 'Deleting...' : 'Delete Item'}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="not-found-container">
            <AlertCircle className="not-found-icon" />
            <h2>Inventory Item Not Found</h2>
            <p>The requested inventory item could not be found.</p>
            <button 
              onClick={handleBack}
              className="back-button"
            >
              Return to Inventory
            </button>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
} 