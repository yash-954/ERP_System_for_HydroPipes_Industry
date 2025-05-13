'use client';

import React, { useState, useEffect } from 'react';
import { X, Save, AlertCircle } from 'lucide-react';
import { LocalInventoryItem } from '@/app/lib/db/localDb';
import { InventoryStatus, InventoryType } from '@/app/models/Inventory';

interface InventoryItemFormProps {
  item?: LocalInventoryItem | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (item: Partial<LocalInventoryItem>) => Promise<void>;
}

// Format the type name for display
const formatType = (type: string | undefined | null): string => {
  if (!type) return 'N/A';
  return type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
};

const DEFAULT_ITEM: Partial<LocalInventoryItem> = {
  sku: '',
  name: '',
  description: '',
  type: InventoryType.COMPONENT,
  status: InventoryStatus.IN_STOCK,
  currentQuantity: 0,
  reservedQuantity: 0,
  availableQuantity: 0,
  minimumQuantity: 5,
  maximumQuantity: 100,
  reorderQuantity: 20,
  leadTimeInDays: 7,
  unitPrice: 0,
  totalValue: 0,
  location: '',
  unitOfMeasure: 'piece',
  supplierId: 0,
  supplierName: '',
  notes: '',
  isFlagged: false,
  isActive: true
};

export default function InventoryItemForm({ 
  item, 
  isOpen, 
  onClose, 
  onSave 
}: InventoryItemFormProps) {
  const [formData, setFormData] = useState<Partial<LocalInventoryItem>>(DEFAULT_ITEM);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // When the item prop changes, update the form data
  useEffect(() => {
    if (item) {
      setFormData(item);
    } else {
      setFormData(DEFAULT_ITEM);
    }
    setErrors({});
    setSubmitError(null);
  }, [item]);

  // If the modal is not open, don't render
  if (!isOpen) return null;

  // Handle form input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target as HTMLInputElement;
    
    // Handle different input types
    let processedValue: string | number | boolean = value;
    
    if (type === 'number') {
      processedValue = value === '' ? 0 : Number(value);
    } else if (type === 'checkbox') {
      processedValue = (e.target as HTMLInputElement).checked;
    }
    
    setFormData(prev => ({
      ...prev,
      [name]: processedValue
    }));
    
    // Clear error for this field if it exists
    if (errors[name]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  // Validate form data
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    
    // Required fields
    if (!formData.sku?.trim()) newErrors.sku = 'SKU is required';
    if (!formData.name?.trim()) newErrors.name = 'Name is required';
    if (!formData.type) newErrors.type = 'Type is required';
    if (!formData.status) newErrors.status = 'Status is required';
    
    // Numeric validations
    if (typeof formData.currentQuantity !== 'number' || formData.currentQuantity < 0) {
      newErrors.currentQuantity = 'Current quantity must be a non-negative number';
    }
    
    if (typeof formData.minimumQuantity !== 'number' || formData.minimumQuantity < 0) {
      newErrors.minimumQuantity = 'Minimum quantity must be a non-negative number';
    }
    
    if (typeof formData.unitPrice !== 'number' || formData.unitPrice < 0) {
      newErrors.unitPrice = 'Unit price must be a non-negative number';
    }
    
    // SKU format validation
    if (formData.sku && !/^[A-Z0-9-]{3,10}$/.test(formData.sku)) {
      newErrors.sku = 'SKU must be 3-10 uppercase letters, numbers, or hyphens';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate form
    if (!validateForm()) return;
    
    try {
      setIsSubmitting(true);
      setSubmitError(null);
      
      // Calculate derived values
      const updatedItem = {
        ...formData,
        availableQuantity: (formData.currentQuantity || 0) - (formData.reservedQuantity || 0),
        totalValue: (formData.currentQuantity || 0) * (formData.unitPrice || 0)
      };
      
      await onSave(updatedItem);
      onClose();
    } catch (error) {
      console.error('Error saving inventory item:', error);
      setSubmitError('Failed to save inventory item. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-container">
        <div className="modal-header">
          <h2 className="modal-title">{item ? 'Edit Inventory Item' : 'Add New Inventory Item'}</h2>
          <button 
            onClick={onClose}
            className="modal-close-button"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        
        {submitError && (
          <div className="alert alert-error">
            <AlertCircle className="alert-icon" />
            <p className="alert-message">{submitError}</p>
          </div>
        )}
        
        <form onSubmit={handleSubmit} className="modal-form">
          <div className="form-grid">
            {/* Basic Information */}
            <div className="form-section">
              <h3 className="section-title">Basic Information</h3>
              
              <div className="form-field">
                <label htmlFor="sku" className="form-label">SKU*</label>
                <input
                  type="text"
                  id="sku"
                  name="sku"
                  value={formData.sku || ''}
                  onChange={handleInputChange}
                  className={`form-input ${errors.sku ? 'input-error' : ''}`}
                  placeholder="e.g. HP-001"
                />
                {errors.sku && <p className="error-message">{errors.sku}</p>}
              </div>
              
              <div className="form-field">
                <label htmlFor="name" className="form-label">Name*</label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name || ''}
                  onChange={handleInputChange}
                  className={`form-input ${errors.name ? 'input-error' : ''}`}
                  placeholder="e.g. Hydraulic Cylinder"
                />
                {errors.name && <p className="error-message">{errors.name}</p>}
              </div>
              
              <div className="form-field">
                <label htmlFor="description" className="form-label">Description</label>
                <textarea
                  id="description"
                  name="description"
                  value={formData.description || ''}
                  onChange={handleInputChange}
                  className="form-textarea"
                  rows={3}
                  placeholder="Enter item description..."
                />
              </div>
              
              <div className="form-field">
                <label htmlFor="type" className="form-label">Type*</label>
                <select
                  id="type"
                  name="type"
                  value={formData.type || ''}
                  onChange={handleInputChange}
                  className={`form-select ${errors.type ? 'input-error' : ''}`}
                >
                  {Object.values(InventoryType).map(type => (
                    <option key={type} value={type}>{formatType(type)}</option>
                  ))}
                </select>
                {errors.type && <p className="error-message">{errors.type}</p>}
              </div>
              
              <div className="form-field">
                <label htmlFor="status" className="form-label">Status*</label>
                <select
                  id="status"
                  name="status"
                  value={formData.status || ''}
                  onChange={handleInputChange}
                  className={`form-select ${errors.status ? 'input-error' : ''}`}
                >
                  {Object.values(InventoryStatus).map(status => (
                    <option key={status} value={status}>{formatType(status)}</option>
                  ))}
                </select>
                {errors.status && <p className="error-message">{errors.status}</p>}
              </div>
            </div>
            
            {/* Quantity Information */}
            <div className="form-section">
              <h3 className="section-title">Quantity Information</h3>
              
              <div className="form-field">
                <label htmlFor="currentQuantity" className="form-label">Current Quantity*</label>
                <input
                  type="number"
                  id="currentQuantity"
                  name="currentQuantity"
                  value={formData.currentQuantity || 0}
                  onChange={handleInputChange}
                  className={`form-input ${errors.currentQuantity ? 'input-error' : ''}`}
                  min="0"
                />
                {errors.currentQuantity && <p className="error-message">{errors.currentQuantity}</p>}
              </div>
              
              <div className="form-field">
                <label htmlFor="reservedQuantity" className="form-label">Reserved Quantity</label>
                <input
                  type="number"
                  id="reservedQuantity"
                  name="reservedQuantity"
                  value={formData.reservedQuantity || 0}
                  onChange={handleInputChange}
                  className="form-input"
                  min="0"
                  disabled={!item} // Only allow editing for existing items
                />
              </div>
              
              <div className="form-field">
                <label htmlFor="minimumQuantity" className="form-label">Minimum Quantity</label>
                <input
                  type="number"
                  id="minimumQuantity"
                  name="minimumQuantity"
                  value={formData.minimumQuantity || 0}
                  onChange={handleInputChange}
                  className={`form-input ${errors.minimumQuantity ? 'input-error' : ''}`}
                  min="0"
                />
                {errors.minimumQuantity && <p className="error-message">{errors.minimumQuantity}</p>}
              </div>
              
              <div className="form-field">
                <label htmlFor="maximumQuantity" className="form-label">Maximum Quantity</label>
                <input
                  type="number"
                  id="maximumQuantity"
                  name="maximumQuantity"
                  value={formData.maximumQuantity || 0}
                  onChange={handleInputChange}
                  className="form-input"
                  min="0"
                />
              </div>
              
              <div className="form-field">
                <label htmlFor="reorderQuantity" className="form-label">Reorder Quantity</label>
                <input
                  type="number"
                  id="reorderQuantity"
                  name="reorderQuantity"
                  value={formData.reorderQuantity || 0}
                  onChange={handleInputChange}
                  className="form-input"
                  min="0"
                />
              </div>
            </div>
            
            {/* Pricing & Supplier Information */}
            <div className="form-section">
              <h3 className="section-title">Pricing & Supplier</h3>
              
              <div className="form-field">
                <label htmlFor="unitPrice" className="form-label">Unit Price (₹)*</label>
                <input
                  type="number"
                  id="unitPrice"
                  name="unitPrice"
                  value={formData.unitPrice || 0}
                  onChange={handleInputChange}
                  className={`form-input ${errors.unitPrice ? 'input-error' : ''}`}
                  min="0"
                  step="0.01"
                />
                {errors.unitPrice && <p className="error-message">{errors.unitPrice}</p>}
              </div>
              
              <div className="form-field">
                <label htmlFor="unitOfMeasure" className="form-label">Unit of Measure</label>
                <input
                  type="text"
                  id="unitOfMeasure"
                  name="unitOfMeasure"
                  value={formData.unitOfMeasure || ''}
                  onChange={handleInputChange}
                  className="form-input"
                  placeholder="e.g. piece, kg, liter"
                />
              </div>
              
              <div className="form-field">
                <label htmlFor="location" className="form-label">Storage Location</label>
                <input
                  type="text"
                  id="location"
                  name="location"
                  value={formData.location || ''}
                  onChange={handleInputChange}
                  className="form-input"
                  placeholder="e.g. Warehouse A, Shelf B3"
                />
              </div>
              
              <div className="form-field">
                <label htmlFor="supplierName" className="form-label">Supplier Name</label>
                <input
                  type="text"
                  id="supplierName"
                  name="supplierName"
                  value={formData.supplierName || ''}
                  onChange={handleInputChange}
                  className="form-input"
                  placeholder="e.g. ABC Suppliers"
                />
              </div>
              
              <div className="form-field">
                <label htmlFor="leadTimeInDays" className="form-label">Lead Time (days)</label>
                <input
                  type="number"
                  id="leadTimeInDays"
                  name="leadTimeInDays"
                  value={formData.leadTimeInDays || 0}
                  onChange={handleInputChange}
                  className="form-input"
                  min="0"
                />
              </div>
            </div>
            
            {/* Additional Information */}
            <div className="form-section">
              <h3 className="section-title">Additional Information</h3>
              
              <div className="form-field">
                <label htmlFor="notes" className="form-label">Notes</label>
                <textarea
                  id="notes"
                  name="notes"
                  value={formData.notes || ''}
                  onChange={handleInputChange}
                  className="form-textarea"
                  rows={3}
                  placeholder="Additional notes..."
                />
              </div>
              
              <div className="form-field checkbox-field">
                <input
                  type="checkbox"
                  id="isFlagged"
                  name="isFlagged"
                  checked={formData.isFlagged || false}
                  onChange={handleInputChange}
                  className="form-checkbox"
                />
                <label htmlFor="isFlagged" className="checkbox-label">
                  Flag item for attention
                </label>
              </div>
              
              <div className="form-field checkbox-field">
                <input
                  type="checkbox"
                  id="isActive"
                  name="isActive"
                  checked={formData.isActive !== false}
                  onChange={handleInputChange}
                  className="form-checkbox"
                />
                <label htmlFor="isActive" className="checkbox-label">
                  Item is active
                </label>
              </div>
            </div>
          </div>
          
          <div className="modal-footer">
            <button
              type="button"
              onClick={onClose}
              className="cancel-button"
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="save-button"
              disabled={isSubmitting}
            >
              <Save className="button-icon" />
              {isSubmitting ? 'Saving...' : 'Save Item'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
} 