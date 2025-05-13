'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Package, 
  Search, 
  Filter, 
  PlusCircle, 
  Download,
  ChevronLeft,
  ChevronRight,
  ArrowUpDown,
  AlertCircle,
  ExternalLink,
  Edit,
  Trash,
  XCircle
} from 'lucide-react';
import DashboardLayout from '@/app/components/dashboard/DashboardLayout';
import { useAuth } from '@/app/lib/contexts/AuthContext';
import { inventoryService } from '@/app/lib/services/inventoryService';
import { LocalInventoryItem } from '@/app/lib/db/localDb';
import { InventoryStatus, InventoryType, InventoryMetrics } from '@/app/models/Inventory';
import '@/app/styles/inventory.css';
import InventoryItemForm from '@/app/components/inventory/InventoryItemForm';

const ITEMS_PER_PAGE = 10;

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

// Get class name for quantity display based on stock level
const getQuantityClass = (quantity: number, minQuantity: number): string => {
  if (quantity <= 0) return 'quantity-none';
  if (quantity <= minQuantity) return 'quantity-low';
  if (quantity > 100) return 'quantity-high';
  return 'quantity-medium';
};

// Get class name for type tag based on type
const getTypeTagClass = (type: string): string => {
  const typeMap: Record<string, string> = {
    [InventoryType.ELECTRONICS]: 'tag-electronics',
    [InventoryType.APPAREL]: 'tag-apparel',
    [InventoryType.BEAUTY]: 'tag-beauty',
    [InventoryType.FITNESS]: 'tag-fitness',
    [InventoryType.TOYS]: 'tag-toys',
    [InventoryType.KITCHEN]: 'tag-kitchen',
  };
  
  return typeMap[type] || 'tag-electronics';
};

export default function InventoryDashboard() {
  const router = useRouter();
  const { user: currentUser } = useAuth();

  // State for inventory items and metrics
  const [inventoryItems, setInventoryItems] = useState<LocalInventoryItem[]>([]);
  const [filteredItems, setFilteredItems] = useState<LocalInventoryItem[]>([]);
  const [metrics, setMetrics] = useState<InventoryMetrics>({
    totalProducts: 0,
    lowStockProducts: 0,
    outOfStockProducts: 0,
    excessStockProducts: 0,
    totalInventoryValue: 0,
    topCategories: [],
    alertsCount: 0
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // State for filtering and sorting
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<InventoryType | 'ALL'>('ALL');
  const [statusFilter, setStatusFilter] = useState<InventoryStatus | 'ALL'>('ALL');
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  
  // Sorting state
  const [sortField, setSortField] = useState<string>('name');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  
  // Modal state for add/edit item
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState<LocalInventoryItem | null>(null);
  
  // Load inventory data
  useEffect(() => {
    const loadInventoryData = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        // Check if current user exists and is authenticated
        if (!currentUser) {
          router.push('/login');
          return;
        }
        
        // Get all inventory items
        const items = await inventoryService.getAllItems();
        setInventoryItems(items);
        
        // Get inventory metrics
        const inventoryMetrics = await inventoryService.getInventoryMetrics();
        setMetrics(inventoryMetrics);
        
      } catch (err) {
        console.error('Error loading inventory data:', err);
        setError('Failed to load inventory data');
      } finally {
        setIsLoading(false);
      }
    };
    
    loadInventoryData();
  }, [currentUser, router]);
  
  // Apply filters and search
  useEffect(() => {
    let result = [...inventoryItems];
    
    // Apply search
    if (searchTerm) {
      const lowercaseSearch = searchTerm.toLowerCase();
      result = result.filter(
        item => 
          item.name.toLowerCase().includes(lowercaseSearch) || 
          item.sku.toLowerCase().includes(lowercaseSearch) ||
          item.description.toLowerCase().includes(lowercaseSearch)
      );
    }
    
    // Apply type filter
    if (typeFilter !== 'ALL') {
      result = result.filter(item => item.type === typeFilter);
    }
    
    // Apply status filter
    if (statusFilter !== 'ALL') {
      result = result.filter(item => item.status === statusFilter);
    }
    
    // Apply sorting
    result.sort((a, b) => {
      let comparison: number;
      
      switch (sortField) {
        case 'name':
          comparison = a.name.localeCompare(b.name);
          break;
        case 'sku':
          comparison = a.sku.localeCompare(b.sku);
          break;
        case 'type':
          comparison = a.type.localeCompare(b.type);
          break;
        case 'quantity':
          comparison = a.currentQuantity - b.currentQuantity;
          break;
        case 'value':
          comparison = a.totalValue - b.totalValue;
          break;
        default:
          comparison = a.name.localeCompare(b.name);
      }
      
      return sortDirection === 'asc' ? comparison : -comparison;
    });
    
    setFilteredItems(result);
    setTotalPages(Math.ceil(result.length / ITEMS_PER_PAGE));
    setCurrentPage(1); // Reset to first page when filters change
  }, [inventoryItems, searchTerm, typeFilter, statusFilter, sortField, sortDirection]);
  
  // Get current page data
  const getCurrentPageData = () => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE;
    return filteredItems.slice(startIndex, endIndex);
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
    setTypeFilter('ALL');
    setStatusFilter('ALL');
  };
  
  // Navigate to inventory item details
  const navigateToDetails = (itemId: number) => {
    router.push(`/dashboard/inventory/${itemId}`);
  };
  
  // Open add new item modal
  const handleAddItem = () => {
    setEditingItem(null);
    setShowModal(true);
  };
  
  // Open edit item modal
  const handleEditItem = (item: LocalInventoryItem) => {
    setEditingItem(item);
    setShowModal(true);
  };
  
  // Export inventory to CSV
  const handleExportCSV = () => {
    // Convert inventory items to CSV format
    const headers = [
      'SKU', 
      'Name', 
      'Type', 
      'Current Qty', 
      'Reserved Qty', 
      'Available Qty', 
      'Min Qty', 
      'Unit Price', 
      'Total Value', 
      'Status'
    ];
    
    const csvRows = [
      headers.join(','),
      ...filteredItems.map(item => [
        item.sku,
        `"${item.name.replace(/"/, '""')}"`, // Escape quotes in name
        item.type,
        item.currentQuantity,
        item.reservedQuantity,
        item.availableQuantity,
        item.minimumQuantity,
        item.unitPrice,
        item.totalValue,
        item.status
      ].join(','))
    ];
    
    const csvString = csvRows.join('\n');
    const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    
    // Create a link and trigger download
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `inventory_export_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
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
  
  // Handle save item (add/edit)
  const handleSaveItem = async (newItem: Partial<LocalInventoryItem>) => {
    try {
      setIsLoading(true);
      setError(null);
      
      if (!currentUser || !currentUser.id) {
        setError('You must be logged in to save inventory items');
        return;
      }
      
      if (editingItem) {
        // Update existing item
        const itemToUpdate = {
          ...newItem,
          id: editingItem.id,
          updatedBy: currentUser.id
        } as LocalInventoryItem;
        
        // Update the item
        const updated = await inventoryService.updateItem(itemToUpdate);
        
        // Update local state with the updated item
        setInventoryItems(prev => 
          prev.map(item => item.id === updated.id ? updated : item)
        );
      } else {
        // Create new item with current user's ID
        const itemToCreate = {
          ...newItem,
          createdBy: currentUser.id,
          updatedBy: currentUser.id
        };
        
        // Create new item
        const createdItem = await inventoryService.createItem(itemToCreate);
        
        // Add new item to local state
        setInventoryItems(prev => [...prev, createdItem]);
      }
      
      // Refresh metrics
      const updatedMetrics = await inventoryService.getInventoryMetrics();
      setMetrics(updatedMetrics);
      
      // Close modal
      setShowModal(false);
      setEditingItem(null);
    } catch (err) {
      console.error('Error saving inventory item:', err);
      setError('Failed to save inventory item');
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <DashboardLayout pageTitle="Inventory Dashboard">
      <div className="inventory-dashboard">
        {/* Page header */}
        <div className="page-header">
          <div className="header-content">
            <h2 className="header-title">
              <Package className="header-title-icon" />
              Inventory Dashboard
            </h2>
          </div>
          
          <button 
            onClick={handleAddItem}
            className="add-button"
          >
            <PlusCircle className="button-icon" />
            Add new product
          </button>
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
              <XCircle />
            </button>
          </div>
        )}
        
        {/* Summary Cards */}
        <div className="summary-cards">
          <div className="summary-card card-total">
            <Package className="summary-card-icon" />
            <div className="summary-card-title">Total Products</div>
            <div className="summary-card-value">{metrics.totalProducts}</div>
          </div>
          
          <div className="summary-card card-low-stock">
            <Package className="summary-card-icon" />
            <div className="summary-card-title">Low Stock Products</div>
            <div className="summary-card-value">{metrics.lowStockProducts}</div>
          </div>
          
          <div className="summary-card card-out-of-stock">
            <Package className="summary-card-icon" />
            <div className="summary-card-title">Out of Stock Products</div>
            <div className="summary-card-value">{metrics.outOfStockProducts}</div>
          </div>
          
          <div className="summary-card card-zero-stock">
            <Package className="summary-card-icon" />
            <div className="summary-card-title">Zero Stock Products</div>
            <div className="summary-card-value">{metrics.outOfStockProducts}</div>
          </div>
          
          <div className="summary-card card-most-stocked">
            <Package className="summary-card-icon" />
            <div className="summary-card-title">Most Stock Product</div>
            <div className="summary-card-value">
              {metrics.topCategories.length > 0 ? metrics.topCategories[0].count : 0}
            </div>
          </div>
        </div>
        
        {/* Search and filters */}
        <div className="actions-bar">
          <div className="search-container">
            <Search className="search-icon" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search inventory..."
              className="search-input"
            />
          </div>
          
          <div className="action-buttons">
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value as InventoryType | 'ALL')}
              className="filter-button"
            >
              <option value="ALL">All Types</option>
              {Object.values(InventoryType).map(type => (
                <option key={type} value={type}>{formatType(type)}</option>
              ))}
            </select>
            
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as InventoryStatus | 'ALL')}
              className="filter-button"
            >
              <option value="ALL">All Status</option>
              {Object.values(InventoryStatus).map(status => (
                <option key={status} value={status}>{formatType(status)}</option>
              ))}
            </select>
            
            <button
              onClick={handleResetFilters}
              className="filter-button"
            >
              <Filter className="button-icon" />
              Reset
            </button>
            
            <button
              onClick={handleExportCSV}
              className="export-button"
            >
              <Download className="button-icon" />
              Export as CSV
            </button>
          </div>
        </div>
        
        {/* Inventory Table */}
        <div className="inventory-container">
          <div className="overflow-x-auto">
            <table className="inventory-table">
              <thead>
                <tr>
                  <th>
                    <button onClick={() => handleSort('sku')}>
                      ProductID {sortField === 'sku' && <ArrowUpDown className="inline" />}
                    </button>
                  </th>
                  <th>
                    <button onClick={() => handleSort('name')}>
                      ProductName {sortField === 'name' && <ArrowUpDown className="inline" />}
                    </button>
                  </th>
                  <th>
                    <button onClick={() => handleSort('type')}>
                      Type {sortField === 'type' && <ArrowUpDown className="inline" />}
                    </button>
                  </th>
                  <th>Status</th>
                  <th>
                    <button onClick={() => handleSort('quantity')}>
                      Count {sortField === 'quantity' && <ArrowUpDown className="inline" />}
                    </button>
                  </th>
                  <th>Reserved</th>
                  <th>Available</th>
                  <th>Vendor</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr>
                    <td colSpan={9} className="text-center py-8">
                      Loading inventory items...
                    </td>
                  </tr>
                ) : getCurrentPageData().length === 0 ? (
                  <tr>
                    <td colSpan={9} className="text-center py-8">
                      No inventory items found. Try adjusting your filters.
                    </td>
                  </tr>
                ) : (
                  getCurrentPageData().map(item => (
                    <tr key={item.id}>
                      <td>{item.sku}</td>
                      <td className="product-cell">
                        <div className="product-details">
                          <span className="product-name">{item.name}</span>
                          <span className="product-sku">{item.description.substring(0, 30)}{item.description.length > 30 ? '...' : ''}</span>
                        </div>
                      </td>
                      <td>
                        <span className={`type-tag ${getTypeTagClass(item.type)}`}>
                          {formatType(item.type)}
                        </span>
                      </td>
                      <td className="status-cell">
                        <span className={`status-indicator status-${item.status}`}></span>
                        {formatType(item.status)}
                      </td>
                      <td>
                        <span className={getQuantityClass(item.currentQuantity, item.minimumQuantity)}>
                          {item.currentQuantity}
                        </span>
                      </td>
                      <td>{item.reservedQuantity}</td>
                      <td>{item.availableQuantity}</td>
                      <td>{item.supplierName || 'N/A'}</td>
                      <td className="actions-cell">
                        <button 
                          className="action-button" 
                          onClick={() => navigateToDetails(item.id!)}
                          title="View Details"
                        >
                          <ExternalLink size={16} />
                        </button>
                        <button 
                          className="action-button" 
                          onClick={() => handleEditItem(item)}
                          title="Edit"
                        >
                          <Edit size={16} />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          
          {/* Pagination */}
          {filteredItems.length > 0 && (
            <div className="pagination">
              <div className="pagination-info">
                Showing <span className="font-medium">{(currentPage - 1) * ITEMS_PER_PAGE + 1}</span> to <span className="font-medium">
                  {Math.min(currentPage * ITEMS_PER_PAGE, filteredItems.length)}
                </span> of <span className="font-medium">{filteredItems.length}</span> results
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
                {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                  // Show pages around current page
                  let pageToShow = i + 1;
                  if (totalPages > 5 && currentPage > 3) {
                    pageToShow = currentPage - 2 + i;
                  }
                  if (pageToShow <= totalPages) {
                    return (
                      <button
                        key={pageToShow}
                        onClick={() => setCurrentPage(pageToShow)}
                        className={`pagination-button ${currentPage === pageToShow ? 'active' : ''}`}
                      >
                        {pageToShow}
                      </button>
                    );
                  }
                  return null;
                })}
                
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
      
      {/* Inventory Item Form Modal */}
      <InventoryItemForm
        item={editingItem}
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        onSave={handleSaveItem}
      />
    </DashboardLayout>
  );
} 