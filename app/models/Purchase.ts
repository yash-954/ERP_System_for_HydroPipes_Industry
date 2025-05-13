// Define purchase order status types
export enum PurchaseOrderStatus {
  DRAFT = 'draft',
  PENDING_APPROVAL = 'pending-approval',
  APPROVED = 'approved',
  ORDERED = 'ordered',
  PARTIALLY_RECEIVED = 'partially-received',
  RECEIVED = 'received',
  CANCELLED = 'cancelled'
}

// Main Purchase Order interface
export interface IPurchaseOrder {
  _id?: string;
  orderNumber: string;  // Unique identifier for the purchase order
  supplierId: number;
  supplierName: string; // Denormalized for quick access
  referenceNumber?: string; // Optional reference/indent number
  status: PurchaseOrderStatus;
  orderDate: Date;
  expectedDeliveryDate: Date;
  actualDeliveryDate?: Date;
  paymentTerms?: string;
  shippingMethod?: string;
  
  // Line items in the purchase order
  lineItems: IPurchaseOrderItem[];
  
  // Financial information
  subtotal: number;
  taxAmount: number;
  shippingCost: number;
  additionalCharges: number;
  discount: number;
  totalAmount: number;
  
  // Additional information
  notes?: string;
  attachments?: IAttachment[];
  
  // Audit trail
  createdBy: number; // User ID who created the order
  approvedBy?: number; // User ID who approved the order
  createdAt: Date;
  updatedAt: Date;
}

// Purchase Order Item interface
export interface IPurchaseOrderItem {
  productId: number;
  productName: string;
  description?: string;
  quantity: number;
  receivedQuantity: number;
  unit: string; // e.g., pcs, kg, etc.
  unitPrice: number;
  taxRate: number;
  taxAmount: number;
  totalPrice: number;
}

// Supplier interface
export interface ISupplier {
  _id?: string;
  name: string;
  contactPerson?: string;
  email?: string;
  phone?: string;
  address?: string;
  taxId?: string;
  paymentTerms?: string;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Attachment interface
export interface IAttachment {
  fileName: string;
  fileSize: number;
  fileType: string;
  filePath: string; // In a real system, this would be a storage reference
  uploadedBy: number; // User ID
  uploadedAt: Date;
}

// Status Change History interface
export interface IPurchaseOrderStatusChange {
  _id?: string;
  purchaseOrderId: string;
  previousStatus: PurchaseOrderStatus;
  newStatus: PurchaseOrderStatus;
  changedBy: number; // User ID
  reason?: string;
  timestamp: Date;
}

// Interface for local purchase order (for IndexedDB storage)
export interface LocalPurchaseOrder extends IPurchaseOrder {
  id?: number; // For IndexedDB
} 