'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  ArrowLeft, 
  Save, 
  AlertCircle, 
  PlusCircle, 
  Trash2, 
  Calendar, 
  Building,
  ShoppingBag,
  X,
  Check,
  FileText,
  Clock,
  DollarSign
} from 'lucide-react';
import DashboardLayout from '@/app/components/dashboard/DashboardLayout';
import { useAuth } from '@/app/lib/contexts/AuthContext';
import { LocalPurchaseOrder } from '@/app/lib/db/localDb';
import { PurchaseOrderStatus, IPurchaseOrderItem } from '@/app/models/Purchase';
import purchaseService from '@/app/lib/services/purchaseService';
import '@/app/styles/purchase-form.css';

type Supplier = {
  id: number;
  name: string;
  contactPerson?: string;
  email?: string;
  phone?: string;
  address?: string;
};

type InventoryItem = {
  id: number;
  name: string;
  sku: string;
  category: string;
  unitPrice: number;
  unit: string;
};

export default function CreatePurchaseOrderPage() {
  const router = useRouter();
  const { user: currentUser } = useAuth();
  
  // Form state
  const [formData, setFormData] = useState<{
    orderNumber: string;
    supplierName: string;
    supplierId: string;
    orderDate: string;
    expectedDeliveryDate: string;
    status: PurchaseOrderStatus;
    items: Array<{
      id?: number;
      inventoryItemId: string;
      inventoryItemName: string;
      description: string;
      quantity: number;
      unit: string;
      unitPrice: number;
      totalPrice: number;
      received: number;
    }>;
    notes: string;
    termsAndConditions: string;
    shippingAddress: string;
    totalAmount: number;
    subtotal: number;
    taxRate: number;
    taxAmount: number;
    discountRate: number;
    discountAmount: number;
    shippingCost: number;
    paymentTerms: string;
  }>({
    orderNumber: '',
    supplierName: '',
    supplierId: '',
    orderDate: new Date().toISOString().split('T')[0],
    expectedDeliveryDate: '',
    status: PurchaseOrderStatus.DRAFT,
    items: [{
      inventoryItemId: '',
      inventoryItemName: '',
      description: '',
      quantity: 1,
      unit: 'units',
      unitPrice: 0,
      totalPrice: 0,
      received: 0
    }],
    notes: '',
    termsAndConditions: 'Standard terms and conditions apply. All items must meet specified quality standards.',
    shippingAddress: '',
    totalAmount: 0,
    subtotal: 0,
    taxRate: 18, // Default GST rate in India
    taxAmount: 0,
    discountRate: 0,
    discountAmount: 0,
    shippingCost: 0,
    paymentTerms: 'Net 30 days'
  });
  
  // UI states
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  // Options for dropdowns
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([]);
  
  // Load suppliers and inventory items
  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true);
        
        // Check if the current user is authenticated
        if (!currentUser) {
          router.push('/login');
          return;
        }
        
        // Load suppliers
        // In a real application, this would fetch from a supplier service
        // For now, we'll use mock data
        const mockSuppliers: Supplier[] = [
          { id: 1, name: 'ABC Hydraulics Ltd.', contactPerson: 'Raj Kumar', email: 'raj@abchydraulics.com', phone: '+91 9876543210', address: 'Industrial Area, Delhi' },
          { id: 2, name: 'Global Pipe Solutions', contactPerson: 'Priya Singh', email: 'priya@globalpipes.com', phone: '+91 8765432109', address: 'MIDC, Pune' },
          { id: 3, name: 'PipeTech Industries', contactPerson: 'Ajay Sharma', email: 'ajay@pipetech.in', phone: '+91 7654321098', address: 'Jigani Industrial Area, Bangalore' }
        ];
        setSuppliers(mockSuppliers);
        
        // Load inventory items
        // In a real application, this would fetch from an inventory service
        const mockInventoryItems: InventoryItem[] = [
          { id: 1, name: 'Hydraulic Valve - Standard', sku: 'HV-STD-001', category: 'Valves', unitPrice: 2500, unit: 'pieces' },
          { id: 2, name: 'High-Pressure Pipe (3m)', sku: 'HPP-3M-002', category: 'Pipes', unitPrice: 1800, unit: 'pieces' },
          { id: 3, name: 'Pressure Gauge (0-250 bar)', sku: 'PG-250-003', category: 'Gauges', unitPrice: 950, unit: 'pieces' },
          { id: 4, name: 'Hydraulic Oil (20L)', sku: 'HO-20L-004', category: 'Fluids', unitPrice: 5200, unit: 'cans' },
          { id: 5, name: 'Seal Kit - Standard', sku: 'SK-STD-005', category: 'Seals', unitPrice: 850, unit: 'kits' }
        ];
        setInventoryItems(mockInventoryItems);
        
        // Generate a unique order number
        const orderNumber = await purchaseService.generateOrderNumber();
        
        // Update form with order number and user's organization address
        setFormData(prev => ({
          ...prev,
          orderNumber,
          shippingAddress: currentUser.organizationAddress || 'HydroPipes Industries, Industrial Area Phase 2, Pune, Maharashtra, India - 411057'
        }));
        
      } catch (error) {
        console.error('Error loading form data:', error);
        setError('Failed to load form data');
      } finally {
        setIsLoading(false);
      }
    };
    
    loadData();
  }, [router, currentUser]);
  
  // Recalculate totals whenever items, tax rate, discount rate, or shipping cost changes
  useEffect(() => {
    // Calculate subtotal
    const subtotal = formData.items.reduce((sum, item) => sum + item.totalPrice, 0);
    
    // Calculate tax amount
    const taxAmount = (subtotal * formData.taxRate) / 100;
    
    // Calculate discount amount
    const discountAmount = (subtotal * formData.discountRate) / 100;
    
    // Calculate total amount
    const totalAmount = subtotal + taxAmount - discountAmount + formData.shippingCost;
    
    setFormData(prev => ({
      ...prev,
      subtotal,
      taxAmount,
      discountAmount,
      totalAmount
    }));
  }, [
    formData.items, 
    formData.taxRate, 
    formData.discountRate, 
    formData.shippingCost
  ]);
  
  // Handle form input changes
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Special handling for supplier selection
    if (name === 'supplierId' && value) {
      const selectedSupplier = suppliers.find(s => s.id.toString() === value);
      if (selectedSupplier) {
        setFormData(prev => ({
          ...prev,
          supplierName: selectedSupplier.name
        }));
      }
    }
  };
  
  // Handle changes to item fields
  const handleItemChange = (index: number, field: string, value: string | number) => {
    const updatedItems = [...formData.items];
    
    // @ts-ignore: Dynamic field access
    updatedItems[index][field] = value;
    
    // Special handling for inventory item selection
    if (field === 'inventoryItemId' && typeof value === 'string') {
      const selectedItem = inventoryItems.find(item => item.id.toString() === value);
      if (selectedItem) {
        updatedItems[index].inventoryItemName = selectedItem.name;
        updatedItems[index].unitPrice = selectedItem.unitPrice;
        updatedItems[index].unit = selectedItem.unit;
        // Recalculate total price
        updatedItems[index].totalPrice = updatedItems[index].quantity * selectedItem.unitPrice;
      }
    }
    
    // Recalculate total price if quantity or unit price changes
    if (field === 'quantity' || field === 'unitPrice') {
      updatedItems[index].totalPrice = 
        Number(updatedItems[index].quantity) * Number(updatedItems[index].unitPrice);
    }
    
    setFormData(prev => ({
      ...prev,
      items: updatedItems
    }));
  };
  
  // Add new item row
  const addItem = () => {
    setFormData(prev => ({
      ...prev,
      items: [
        ...prev.items,
        {
          inventoryItemId: '',
          inventoryItemName: '',
          description: '',
          quantity: 1,
          unit: 'units',
          unitPrice: 0,
          totalPrice: 0,
          received: 0
        }
      ]
    }));
  };
  
  // Remove item row
  const removeItem = (index: number) => {
    // Don't remove if it's the only item
    if (formData.items.length === 1) {
      return;
    }
    
    const updatedItems = formData.items.filter((_, i) => i !== index);
    
    setFormData(prev => ({
      ...prev,
      items: updatedItems
    }));
  };
  
  // Format number as currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(amount);
  };
  
  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setError(null);
    setSuccess(null);
    
    // Validate form
    if (!formData.supplierId) {
      setError('Please select a supplier');
      setIsSaving(false);
      return;
    }
    
    // Validate items
    if (formData.items.some(item => !item.inventoryItemId)) {
      setError('Please select an item for all rows');
      setIsSaving(false);
      return;
    }
    
    if (formData.items.some(item => item.quantity <= 0)) {
      setError('Quantity must be greater than 0');
      setIsSaving(false);
      return;
    }
    
    try {
      // Prepare purchase order data
      const purchaseOrderData: Partial<LocalPurchaseOrder> = {
        orderNumber: formData.orderNumber,
        supplierId: parseInt(formData.supplierId),
        supplierName: formData.supplierName,
        orderDate: new Date(formData.orderDate),
        expectedDeliveryDate: formData.expectedDeliveryDate ? new Date(formData.expectedDeliveryDate) : undefined,
        status: formData.status,
        notes: formData.notes,
        termsAndConditions: formData.termsAndConditions,
        shippingAddress: formData.shippingAddress,
        subtotal: formData.subtotal,
        taxRate: formData.taxRate,
        taxAmount: formData.taxAmount,
        discountRate: formData.discountRate,
        discountAmount: formData.discountAmount,
        shippingCost: formData.shippingCost,
        totalAmount: formData.totalAmount,
        paymentTerms: formData.paymentTerms,
        createdBy: currentUser.id,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      // Prepare purchase order items
      const purchaseOrderItems = formData.items.map(item => ({
        inventoryItemId: parseInt(item.inventoryItemId),
        inventoryItemName: item.inventoryItemName,
        description: item.description,
        quantity: item.quantity,
        unit: item.unit,
        unitPrice: item.unitPrice,
        totalPrice: item.totalPrice,
        received: 0
      }));
      
      // Create purchase order
      const newPurchaseOrderId = await purchaseService.create(
        purchaseOrderData as LocalPurchaseOrder, 
        purchaseOrderItems
      );
      
      setSuccess('Purchase order created successfully');
      
      // Navigate to purchase order details page
      setTimeout(() => {
        router.push(`/dashboard/purchases/${newPurchaseOrderId}`);
      }, 1500);
      
    } catch (error) {
      console.error('Error creating purchase order:', error);
      setError('Failed to create purchase order');
    } finally {
      setIsSaving(false);
    }
  };
  
  // Navigate back to purchases list
  const handleBack = () => {
    router.push('/dashboard/purchases');
  };
  
  return (
    <DashboardLayout>
      <div className="purchase-form-container">
        <div className="page-header">
          <button 
            className="back-button"
            onClick={handleBack}
          >
            <ArrowLeft size={16} />
            <span>Back to Purchases</span>
          </button>
          <h1>Create Purchase Order</h1>
        </div>
        
        {error && (
          <div className="error-message">
            <AlertCircle size={18} />
            <span>{error}</span>
            <button onClick={() => setError(null)}><X size={16} /></button>
          </div>
        )}
        
        {success && (
          <div className="success-message">
            <Check size={18} />
            <span>{success}</span>
            <button onClick={() => setSuccess(null)}><X size={16} /></button>
          </div>
        )}
        
        <form onSubmit={handleSubmit} className="purchase-form">
          <div className="form-header">
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="orderNumber">Order Number</label>
                <div className="input-with-icon">
                  <ShoppingBag size={16} />
                  <input
                    type="text"
                    id="orderNumber"
                    name="orderNumber"
                    value={formData.orderNumber}
                    onChange={handleChange}
                    readOnly
                  />
                </div>
              </div>
              
              <div className="form-group">
                <label htmlFor="status">Status</label>
                <select
                  id="status"
                  name="status"
                  value={formData.status}
                  onChange={handleChange}
                >
                  <option value={PurchaseOrderStatus.DRAFT}>Draft</option>
                  <option value={PurchaseOrderStatus.PENDING_APPROVAL}>Pending Approval</option>
                  <option value={PurchaseOrderStatus.APPROVED}>Approved</option>
                </select>
              </div>
            </div>
            
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="orderDate">Order Date</label>
                <div className="input-with-icon">
                  <Calendar size={16} />
                  <input
                    type="date"
                    id="orderDate"
                    name="orderDate"
                    value={formData.orderDate}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>
              
              <div className="form-group">
                <label htmlFor="expectedDeliveryDate">Expected Delivery Date</label>
                <div className="input-with-icon">
                  <Calendar size={16} />
                  <input
                    type="date"
                    id="expectedDeliveryDate"
                    name="expectedDeliveryDate"
                    value={formData.expectedDeliveryDate}
                    onChange={handleChange}
                  />
                </div>
              </div>
            </div>
          </div>
          
          <div className="form-section">
            <h2>Supplier Information</h2>
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="supplierId">Supplier</label>
                <select
                  id="supplierId"
                  name="supplierId"
                  value={formData.supplierId}
                  onChange={handleChange}
                  required
                >
                  <option value="">Select a supplier</option>
                  {suppliers.map(supplier => (
                    <option key={supplier.id} value={supplier.id}>
                      {supplier.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            
            {formData.supplierId && (
              <div className="supplier-info">
                {suppliers.find(s => s.id.toString() === formData.supplierId) && (
                  <>
                    <div className="info-item">
                      <strong>Contact Person:</strong> 
                      <span>{suppliers.find(s => s.id.toString() === formData.supplierId)?.contactPerson}</span>
                    </div>
                    <div className="info-item">
                      <strong>Email:</strong> 
                      <span>{suppliers.find(s => s.id.toString() === formData.supplierId)?.email}</span>
                    </div>
                    <div className="info-item">
                      <strong>Phone:</strong> 
                      <span>{suppliers.find(s => s.id.toString() === formData.supplierId)?.phone}</span>
                    </div>
                    <div className="info-item">
                      <strong>Address:</strong> 
                      <span>{suppliers.find(s => s.id.toString() === formData.supplierId)?.address}</span>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
          
          <div className="form-section">
            <h2>Order Items</h2>
            <div className="table-container">
              <table className="items-table">
                <thead>
                  <tr>
                    <th style={{ width: '30%' }}>Item</th>
                    <th style={{ width: '25%' }}>Description</th>
                    <th style={{ width: '10%' }}>Quantity</th>
                    <th style={{ width: '10%' }}>Unit</th>
                    <th style={{ width: '10%' }}>Unit Price</th>
                    <th style={{ width: '10%' }}>Total</th>
                    <th style={{ width: '5%' }}></th>
                  </tr>
                </thead>
                <tbody>
                  {formData.items.map((item, index) => (
                    <tr key={index}>
                      <td>
                        <select
                          value={item.inventoryItemId}
                          onChange={(e) => handleItemChange(index, 'inventoryItemId', e.target.value)}
                          required
                        >
                          <option value="">Select an item</option>
                          {inventoryItems.map(inventoryItem => (
                            <option key={inventoryItem.id} value={inventoryItem.id}>
                              {inventoryItem.name} ({inventoryItem.sku})
                            </option>
                          ))}
                        </select>
                      </td>
                      <td>
                        <input
                          type="text"
                          value={item.description}
                          onChange={(e) => handleItemChange(index, 'description', e.target.value)}
                          placeholder="Additional details"
                        />
                      </td>
                      <td>
                        <input
                          type="number"
                          min="1"
                          value={item.quantity}
                          onChange={(e) => handleItemChange(index, 'quantity', parseInt(e.target.value))}
                          required
                        />
                      </td>
                      <td>
                        <input
                          type="text"
                          value={item.unit}
                          onChange={(e) => handleItemChange(index, 'unit', e.target.value)}
                          required
                        />
                      </td>
                      <td>
                        <div className="currency-input">
                          <DollarSign size={12} />
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            value={item.unitPrice}
                            onChange={(e) => handleItemChange(index, 'unitPrice', parseFloat(e.target.value))}
                            required
                          />
                        </div>
                      </td>
                      <td className="total-column">
                        {formatCurrency(item.totalPrice)}
                      </td>
                      <td>
                        <button
                          type="button"
                          className="remove-item-button"
                          onClick={() => removeItem(index)}
                          disabled={formData.items.length === 1}
                        >
                          <Trash2 size={16} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            <button
              type="button"
              className="add-item-button"
              onClick={addItem}
            >
              <PlusCircle size={16} />
              <span>Add Item</span>
            </button>
          </div>
          
          <div className="form-section">
            <div className="form-row">
              <div className="form-col">
                <h2>Additional Information</h2>
                <div className="form-group">
                  <label htmlFor="notes">Notes</label>
                  <textarea
                    id="notes"
                    name="notes"
                    value={formData.notes}
                    onChange={handleChange}
                    placeholder="Additional notes about this order"
                    rows={3}
                  />
                </div>
                
                <div className="form-group">
                  <label htmlFor="termsAndConditions">Terms and Conditions</label>
                  <textarea
                    id="termsAndConditions"
                    name="termsAndConditions"
                    value={formData.termsAndConditions}
                    onChange={handleChange}
                    rows={3}
                  />
                </div>
                
                <div className="form-group">
                  <label htmlFor="shippingAddress">Shipping Address</label>
                  <textarea
                    id="shippingAddress"
                    name="shippingAddress"
                    value={formData.shippingAddress}
                    onChange={handleChange}
                    rows={3}
                    required
                  />
                </div>
                
                <div className="form-group">
                  <label htmlFor="paymentTerms">Payment Terms</label>
                  <input
                    type="text"
                    id="paymentTerms"
                    name="paymentTerms"
                    value={formData.paymentTerms}
                    onChange={handleChange}
                  />
                </div>
              </div>
              
              <div className="order-summary">
                <h2>Order Summary</h2>
                <div className="summary-row">
                  <span>Subtotal</span>
                  <span>{formatCurrency(formData.subtotal)}</span>
                </div>
                
                <div className="summary-row">
                  <div className="tax-input">
                    <span>Tax</span>
                    <div className="input-group">
                      <input
                        type="number"
                        name="taxRate"
                        value={formData.taxRate}
                        onChange={handleChange}
                        min="0"
                        max="100"
                      />
                      <span className="input-suffix">%</span>
                    </div>
                  </div>
                  <span>{formatCurrency(formData.taxAmount)}</span>
                </div>
                
                <div className="summary-row">
                  <div className="tax-input">
                    <span>Discount</span>
                    <div className="input-group">
                      <input
                        type="number"
                        name="discountRate"
                        value={formData.discountRate}
                        onChange={handleChange}
                        min="0"
                        max="100"
                      />
                      <span className="input-suffix">%</span>
                    </div>
                  </div>
                  <span>- {formatCurrency(formData.discountAmount)}</span>
                </div>
                
                <div className="summary-row">
                  <div className="tax-input">
                    <span>Shipping</span>
                    <div className="input-group">
                      <DollarSign size={12} />
                      <input
                        type="number"
                        name="shippingCost"
                        value={formData.shippingCost}
                        onChange={handleChange}
                        min="0"
                      />
                    </div>
                  </div>
                  <span>{formatCurrency(formData.shippingCost)}</span>
                </div>
                
                <div className="total-row">
                  <span>Total</span>
                  <span>{formatCurrency(formData.totalAmount)}</span>
                </div>
              </div>
            </div>
          </div>
          
          <div className="form-actions">
            <button
              type="button"
              className="cancel-button"
              onClick={handleBack}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="save-button"
              disabled={isSaving}
            >
              {isSaving ? (
                <>
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <Save size={16} />
                  <span>Save Order</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </DashboardLayout>
  );
} 