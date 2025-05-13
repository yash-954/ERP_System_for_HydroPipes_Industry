'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { 
  ArrowLeft, 
  Save, 
  AlertCircle, 
  PlusCircle, 
  Trash2, 
  Calendar, 
  User,
  Wrench,
  X,
  Check,
  FileText,
  Clock,
  DollarSign
} from 'lucide-react';
import DashboardLayout from '@/app/components/dashboard/DashboardLayout';
import { useAuth } from '@/app/lib/contexts/AuthContext';
import { LocalWorkOrder } from '@/app/lib/db/localDb';
import { WorkOrderStatus, PriorityLevel } from '@/app/models/WorkOrder';
import workOrderService from '@/app/lib/services/workOrderService';
import { localUserService } from '@/app/lib/services/localUserService';
import { UserRole } from '@/app/models/User';
import '@/app/styles/work-order-form.css';
import { formatDateForInput, parseDate } from '@/app/lib/utils/dateUtils';

type Customer = {
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

type User = {
  id: number;
  name: string;
  role: UserRole;
  department: string;
};

type Assembly = {
  id?: number;
  name: string;
  partCode?: string;
  description: string;
  quantity: number;
  completed?: number;
};

export default function CreateWorkOrderPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const editId = searchParams.get('id');
  const { user: currentUser } = useAuth();
  
  // Form state
  const [formData, setFormData] = useState<{
    orderNumber: string;
    customerName: string;
    customerId: string;
    orderDate: string;
    dueDate: string;
    status: WorkOrderStatus;
    priority: PriorityLevel;
    assignedToId: string;
    assignedToName: string;
    description: string;
    assemblies: Array<Assembly>;
    notes: string;
    termsAndConditions: string;
    totalAmount: number;
    subtotal: number;
    taxRate: number;
    taxAmount: number;
    discountRate: number;
    discountAmount: number;
  }>({
    orderNumber: '',
    customerName: '',
    customerId: '',
    orderDate: new Date().toISOString().split('T')[0],
    dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // Default due date is 1 week from now
    status: WorkOrderStatus.DRAFT,
    priority: PriorityLevel.MEDIUM,
    assignedToId: '',
    assignedToName: '',
    description: '',
    assemblies: [{
      name: '',
      partCode: '',
      description: '',
      quantity: 1,
      completed: 0
    }],
    notes: '',
    termsAndConditions: 'Standard terms and conditions apply. All work must meet specified quality standards.',
    totalAmount: 0,
    subtotal: 0,
    taxRate: 18, // Default GST rate in India
    taxAmount: 0,
    discountRate: 0,
    discountAmount: 0
  });
  
  // UI states
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);
  
  // Options for dropdowns
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  
  // Load data
  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true);
        
        // Check if the current user is authenticated
        if (!currentUser) {
          router.push('/login');
          return;
        }
        
        // Load customers
        // In a real application, this would fetch from a customer service
        // For now, we'll use mock data
        const mockCustomers: Customer[] = [
          { id: 1, name: 'Indian Railways', contactPerson: 'Suresh Patel', email: 'suresh@indianrailways.gov.in', phone: '+91 9876543210', address: 'Rail Bhavan, New Delhi' },
          { id: 2, name: 'BHEL', contactPerson: 'Amit Kumar', email: 'amit@bhel.in', phone: '+91 8765432109', address: 'BHEL House, Siri Fort, New Delhi' },
          { id: 3, name: 'L&T Heavy Engineering', contactPerson: 'Priya Sharma', email: 'priya@lnt.com', phone: '+91 7654321098', address: 'L&T Campus, Mumbai' }
        ];
        setCustomers(mockCustomers);
        
        // Load users from database
        try {
          // Get all users
          const allUsers = await localUserService.getAll();
          
          // Filter out inactive users
          const activeUsers = allUsers.filter(user => user.isActive);
          
          // Map to the format needed for the dropdown
          const formattedUsers = activeUsers.map(user => ({
            id: user.id || 0, // Default to 0 if id is undefined
            name: user.name,
            role: user.role,
            department: user.departmentId ? `Department ${user.departmentId}` : 'N/A'
          }));
          
          setUsers(formattedUsers);
        } catch (error) {
          console.error('Error loading users:', error);
          setError('Failed to load users');
        }
        
        // Generate a unique order number or load existing work order
        if (editId) {
          setIsEditMode(true);
          const workOrder = await workOrderService.getById(parseInt(editId));
          if (workOrder) {
            setFormData({
              orderNumber: workOrder.orderNumber,
              customerName: workOrder.customerName,
              customerId: workOrder.customerId.toString(),
              orderDate: formatDateForInput(workOrder.orderDate),
              dueDate: formatDateForInput(workOrder.dueDate),
              status: workOrder.status as WorkOrderStatus,
              priority: workOrder.priority as PriorityLevel,
              assignedToId: workOrder.assignedToId ? workOrder.assignedToId.toString() : '',
              assignedToName: workOrder.assignedToName || '',
              description: workOrder.description || '',
              assemblies: workOrder.assemblies ? workOrder.assemblies.map(assembly => ({
                id: assembly.id,
                name: assembly.name,
                partCode: assembly.partCode || '',
                description: assembly.description || '',
                quantity: assembly.quantity,
                completed: assembly.completed || 0
              })) : [{
                name: '',
                partCode: '',
                description: '',
                quantity: 1,
                completed: 0
              }],
              notes: workOrder.notes || '',
              termsAndConditions: workOrder.termsAndConditions || 'Standard terms and conditions apply. All work must meet specified quality standards.',
              totalAmount: workOrder.totalAmount || 0,
              subtotal: workOrder.subtotal || 0,
              taxRate: workOrder.taxRate || 18,
              taxAmount: workOrder.taxAmount || 0,
              discountRate: workOrder.discountRate || 0,
              discountAmount: workOrder.discountAmount || 0
            });
          } else {
            setError(`Work order with ID ${editId} not found`);
          }
        } else {
          // Generate a unique order number for new work orders
          const orderNumber = await workOrderService.generateOrderNumber();
          setFormData(prev => ({
            ...prev,
            orderNumber
          }));
        }
        
      } catch (error) {
        console.error('Error loading form data:', error);
        setError('Failed to load form data');
      } finally {
        setIsLoading(false);
      }
    };
    
    loadData();
  }, [router, currentUser, editId]);
  
  // Recalculate totals whenever assemblies, tax rate, or discount rate changes
  useEffect(() => {
    // Calculate subtotal (simplified calculation - in a real system this would be more complex)
    // For demo purposes, we'll assume each assembly has a base cost of ₹5000
    const subtotal = formData.assemblies.reduce((sum, assembly) => sum + (assembly.quantity * 5000), 0);
    
    // Calculate tax amount
    const taxAmount = (subtotal * formData.taxRate) / 100;
    
    // Calculate discount amount
    const discountAmount = (subtotal * formData.discountRate) / 100;
    
    // Calculate total amount
    const totalAmount = subtotal + taxAmount - discountAmount;
    
    setFormData(prev => ({
      ...prev,
      subtotal,
      taxAmount,
      discountAmount,
      totalAmount
    }));
  }, [
    formData.assemblies, 
    formData.taxRate, 
    formData.discountRate
  ]);
  
  // Handle form input changes
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Special handling for customer selection
    if (name === 'customerId' && value) {
      const selectedCustomer = customers.find(c => c.id.toString() === value);
      if (selectedCustomer) {
        setFormData(prev => ({
          ...prev,
          customerName: selectedCustomer.name
        }));
      }
    }
    
    // Special handling for assigned user selection
    if (name === 'assignedToId' && value) {
      const selectedUser = users.find(u => u.id.toString() === value);
      if (selectedUser) {
        setFormData(prev => ({
          ...prev,
          assignedToName: selectedUser.name
        }));
      }
    }
  };
  
  // Handle changes to assembly fields
  const handleAssemblyChange = (index: number, field: string, value: string | number) => {
    const updatedAssemblies = [...formData.assemblies];
    
    // @ts-ignore: Dynamic field access
    updatedAssemblies[index][field] = value;
    
    setFormData(prev => ({
      ...prev,
      assemblies: updatedAssemblies
    }));
  };
  
  // Add new assembly row
  const addAssembly = () => {
    setFormData(prev => ({
      ...prev,
      assemblies: [
        ...prev.assemblies,
        {
          name: '',
          partCode: '',
          description: '',
          quantity: 1,
          completed: 0
        }
      ]
    }));
  };
  
  // Remove assembly row
  const removeAssembly = (index: number) => {
    // Don't remove if it's the only assembly
    if (formData.assemblies.length === 1) {
      return;
    }
    
    const updatedAssemblies = formData.assemblies.filter((_, i) => i !== index);
    
    setFormData(prev => ({
      ...prev,
      assemblies: updatedAssemblies
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
    if (!formData.customerId) {
      setError('Please select a customer');
      setIsSaving(false);
      return;
    }
    
    // Validate assemblies
    if (formData.assemblies.some(assembly => !assembly.name)) {
      setError('Please provide a name for all assemblies');
      setIsSaving(false);
      return;
    }
    
    if (formData.assemblies.some(assembly => assembly.quantity <= 0)) {
      setError('Quantity must be greater than 0');
      setIsSaving(false);
      return;
    }
    
    try {
      // Prepare work order data
      const workOrderData: Partial<LocalWorkOrder> = {
        orderNumber: formData.orderNumber,
        customerId: parseInt(formData.customerId),
        customerName: formData.customerName,
        orderDate: new Date(formData.orderDate),
        dueDate: new Date(formData.dueDate),
        status: formData.status,
        priority: formData.priority,
        assignedToId: formData.assignedToId ? parseInt(formData.assignedToId) : undefined,
        assignedToName: formData.assignedToName,
        description: formData.description,
        notes: formData.notes,
        termsAndConditions: formData.termsAndConditions,
        subtotal: formData.subtotal,
        taxRate: formData.taxRate,
        taxAmount: formData.taxAmount,
        discountRate: formData.discountRate,
        discountAmount: formData.discountAmount,
        totalAmount: formData.totalAmount,
        progress: 0, // Initially 0% progress
        createdBy: currentUser.id,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      // Prepare work order assemblies
      const workOrderAssemblies = formData.assemblies.map(assembly => ({
        name: assembly.name,
        partCode: assembly.partCode || '',
        description: assembly.description,
        quantity: assembly.quantity,
        completed: assembly.completed || 0
      }));
      
      let workOrderId: number;
      
      if (isEditMode && editId) {
        // Update existing work order
        await workOrderService.update(
          parseInt(editId),
          workOrderData as LocalWorkOrder
        );
        
        // Update assemblies
        // In a real application, you would handle assembly updates more carefully
        // For this demo, we'll simplify by deleting old assemblies and adding new ones
        workOrderId = parseInt(editId);
        setSuccess('Work order updated successfully');
      } else {
        // Create new work order
        workOrderId = await workOrderService.create(
          workOrderData as LocalWorkOrder, 
          workOrderAssemblies
        );
        setSuccess('Work order created successfully');
      }
      
      // Navigate to work order details page
      setTimeout(() => {
        router.push(`/dashboard/work-orders/${workOrderId}`);
      }, 1500);
      
    } catch (error) {
      console.error('Error saving work order:', error);
      setError('Failed to save work order');
    } finally {
      setIsSaving(false);
    }
  };
  
  // Navigate back to work orders list
  const handleBack = () => {
    router.push('/dashboard/work-orders');
  };
  
  return (
    <DashboardLayout pageTitle={isEditMode ? 'Edit Work Order' : 'Create Work Order'}>
      <div className="work-order-form-container">
        <div className="page-header">
          <button 
            className="back-button"
            onClick={handleBack}
          >
            <ArrowLeft size={16} />
            <span>Back to Work Orders</span>
          </button>
          <h1>{isEditMode ? 'Edit Work Order' : 'Create Work Order'}</h1>
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
        
        <form onSubmit={handleSubmit} className="work-order-form">
          <div className="form-header">
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="orderNumber">Order Number</label>
                <div className="input-with-icon">
                  <Wrench size={16} />
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
                  <option value={WorkOrderStatus.DRAFT}>Draft</option>
                  <option value={WorkOrderStatus.PENDING}>Pending</option>
                  <option value={WorkOrderStatus.IN_PROGRESS}>In Progress</option>
                  {isEditMode && (
                    <>
                      <option value={WorkOrderStatus.ON_HOLD}>On Hold</option>
                      <option value={WorkOrderStatus.COMPLETED}>Completed</option>
                      <option value={WorkOrderStatus.CANCELLED}>Cancelled</option>
                    </>
                  )}
                </select>
              </div>
              
              <div className="form-group">
                <label htmlFor="priority">Priority</label>
                <select
                  id="priority"
                  name="priority"
                  value={formData.priority}
                  onChange={handleChange}
                >
                  <option value={PriorityLevel.LOW}>Low</option>
                  <option value={PriorityLevel.MEDIUM}>Medium</option>
                  <option value={PriorityLevel.HIGH}>High</option>
                  <option value={PriorityLevel.URGENT}>Urgent</option>
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
                <label htmlFor="dueDate">Due Date</label>
                <div className="input-with-icon">
                  <Calendar size={16} />
                  <input
                    type="date"
                    id="dueDate"
                    name="dueDate"
                    value={formData.dueDate}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>
            </div>
          </div>
          
          <div className="form-section">
            <h2>Customer Information</h2>
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="customerId">Customer</label>
                <select
                  id="customerId"
                  name="customerId"
                  value={formData.customerId}
                  onChange={handleChange}
                  required
                >
                  <option value="">Select a customer</option>
                  {customers.map(customer => (
                    <option key={customer.id} value={customer.id}>
                      {customer.name}
                    </option>
                  ))}
                </select>
              </div>
              
              <div className="form-group">
                <label htmlFor="assignedToId">Assigned To</label>
                <select
                  id="assignedToId"
                  name="assignedToId"
                  value={formData.assignedToId}
                  onChange={handleChange}
                >
                  <option value="">Select a user</option>
                  {users.map(user => (
                    <option key={user.id} value={user.id}>
                      {user.name} ({UserRole[user.role]})
                    </option>
                  ))}
                </select>
              </div>
            </div>
            
            {formData.customerId && (
              <div className="customer-info">
                {customers.find(c => c.id.toString() === formData.customerId) && (
                  <>
                    <div className="info-item">
                      <strong>Contact Person:</strong> 
                      <span>{customers.find(c => c.id.toString() === formData.customerId)?.contactPerson}</span>
                    </div>
                    <div className="info-item">
                      <strong>Email:</strong> 
                      <span>{customers.find(c => c.id.toString() === formData.customerId)?.email}</span>
                    </div>
                    <div className="info-item">
                      <strong>Phone:</strong> 
                      <span>{customers.find(c => c.id.toString() === formData.customerId)?.phone}</span>
                    </div>
                    <div className="info-item">
                      <strong>Address:</strong> 
                      <span>{customers.find(c => c.id.toString() === formData.customerId)?.address}</span>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
          
          <div className="form-section">
            <h2>Work Description</h2>
            <div className="form-group">
              <label htmlFor="description">Description</label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                placeholder="Describe the work to be done"
                rows={3}
                required
              />
            </div>
          </div>
          
          <div className="form-section">
            <h2>Assemblies</h2>
            <div className="table-container">
              <table className="assemblies-table">
                <thead>
                  <tr>
                    <th style={{ width: '25%' }}>Assembly Name</th>
                    <th style={{ width: '15%' }}>Part Code</th>
                    <th style={{ width: '30%' }}>Description</th>
                    <th style={{ width: '15%' }}>Quantity</th>
                    {isEditMode && <th style={{ width: '15%' }}>Completed</th>}
                    <th style={{ width: '5%' }}></th>
                  </tr>
                </thead>
                <tbody>
                  {formData.assemblies.map((assembly, index) => (
                    <tr key={index}>
                      <td>
                        <input
                          type="text"
                          value={assembly.name}
                          onChange={(e) => handleAssemblyChange(index, 'name', e.target.value)}
                          placeholder="Assembly name"
                          required
                        />
                      </td>
                      <td>
                        <input
                          type="text"
                          value={assembly.partCode || ''}
                          onChange={(e) => handleAssemblyChange(index, 'partCode', e.target.value)}
                          placeholder="Part code"
                        />
                      </td>
                      <td>
                        <input
                          type="text"
                          value={assembly.description}
                          onChange={(e) => handleAssemblyChange(index, 'description', e.target.value)}
                          placeholder="Assembly description"
                        />
                      </td>
                      <td>
                        <input
                          type="number"
                          min="1"
                          value={assembly.quantity}
                          onChange={(e) => handleAssemblyChange(index, 'quantity', parseInt(e.target.value))}
                          required
                        />
                      </td>
                      {isEditMode && (
                        <td>
                          <input
                            type="number"
                            min="0"
                            max={assembly.quantity}
                            value={assembly.completed || 0}
                            onChange={(e) => handleAssemblyChange(index, 'completed', parseInt(e.target.value))}
                          />
                        </td>
                      )}
                      <td>
                        <button
                          type="button"
                          className="remove-item-button"
                          onClick={() => removeAssembly(index)}
                          disabled={formData.assemblies.length === 1}
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
              onClick={addAssembly}
            >
              <PlusCircle size={16} />
              <span>Add Assembly</span>
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
                    placeholder="Additional notes about this work order"
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
                  <span>Save Work Order</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </DashboardLayout>
  );
} 