/**
 * Inventory model definitions for the HydroPipes ERP system
 */

/**
 * Inventory item status enum
 */
export enum InventoryStatus {
  IN_STOCK = 'in_stock',
  LOW_STOCK = 'low_stock',
  OUT_OF_STOCK = 'out_of_stock',
  DISCONTINUED = 'discontinued',
  PENDING_RECEIPT = 'pending_receipt'
}

/**
 * Inventory item type/category enum
 */
export enum InventoryType {
  RAW_MATERIAL = 'raw_material',
  COMPONENT = 'component',
  ELECTRONICS = 'electronics',
  APPAREL = 'apparel',
  BEAUTY = 'beauty', 
  FITNESS = 'fitness',
  TOYS = 'toys',
  KITCHEN = 'kitchen',
  FINISHED_PRODUCT = 'finished_product',
  PACKAGING = 'packaging',
  TOOLS = 'tools',
  MACHINERY = 'machinery',
  OFFICE_SUPPLIES = 'office_supplies',
  OTHER = 'other'
}

/**
 * Reason for inventory adjustment
 */
export enum InventoryAdjustmentReason {
  PHYSICAL_COUNT = 'physical_count',
  DAMAGE = 'damage',
  THEFT = 'theft',
  RETURN = 'return',
  PRODUCTION_LOSS = 'production_loss',
  SYSTEM_CORRECTION = 'system_correction',
  OTHER = 'other'
}

/**
 * Base inventory item interface
 */
export interface IInventoryItem {
  _id?: string;
  sku: string;              // Stock Keeping Unit (unique identifier)
  name: string;             // Product name
  description: string;      // Detailed description
  type: InventoryType;      // Product type/category
  status: InventoryStatus;  // Current inventory status
  currentQuantity: number;  // Current inventory level
  reservedQuantity: number; // Quantity reserved for work orders/sales
  availableQuantity: number; // Actual available quantity (currentQuantity - reservedQuantity)
  minimumQuantity: number;  // Reorder point
  maximumQuantity: number;  // Maximum storage capacity
  reorderQuantity: number;  // Suggested quantity to reorder
  leadTimeInDays: number;   // Time in days to receive new stock after ordering
  unitPrice: number;        // Cost per unit
  totalValue: number;       // Total value (currentQuantity * unitPrice)
  location: string;         // Storage location (warehouse, shelf, bin, etc.)
  unitOfMeasure: string;    // Unit of measurement (pieces, kg, liters, etc.)
  supplierId?: number;      // Primary supplier ID
  supplierName?: string;    // Primary supplier name (denormalized for quick access)
  lastRestockDate?: Date;   // Date of last inventory receipt
  lastCountDate?: Date;     // Date of last physical inventory count
  averageDailyUsage: number; // Average daily consumption rate
  isFlagged: boolean;       // Flagged for attention (urgent reorder, etc.)
  notes?: string;           // Additional notes
  images?: string[];        // URLs to product images
  isActive: boolean;        // Whether the item is active in inventory
  createdBy: number;        // User ID who created the item
  updatedBy: number;        // User ID who last updated the item
  createdAt: Date;          // Creation timestamp
  updatedAt: Date;          // Last update timestamp
}

/**
 * Inventory transaction type enum
 */
export enum InventoryTransactionType {
  PURCHASE = 'purchase',
  SALE = 'sale',
  ADJUSTMENT = 'adjustment',
  TRANSFER = 'transfer',
  PRODUCTION_CONSUMPTION = 'production_consumption',
  PRODUCTION_OUTPUT = 'production_output',
  RETURN_FROM_CUSTOMER = 'return_from_customer',
  RETURN_TO_SUPPLIER = 'return_to_supplier'
}

/**
 * Inventory transaction interface
 */
export interface IInventoryTransaction {
  _id?: string;
  inventoryItemId: number;  // Reference to inventory item
  type: InventoryTransactionType; // Type of transaction
  quantity: number;         // Quantity change (positive for additions, negative for reductions)
  previousQuantity: number; // Quantity before transaction
  newQuantity: number;      // Quantity after transaction
  unitPrice: number;        // Unit price at time of transaction
  totalValue: number;       // Total value of transaction
  referenceType?: string;   // e.g., 'purchase_order', 'sales_order', 'work_order'
  referenceId?: number;     // ID of the reference document
  reason?: InventoryAdjustmentReason; // Reason for adjustment (if applicable)
  notes?: string;           // Transaction notes
  performedBy: number;      // User ID who performed the transaction
  timestamp: Date;          // Transaction timestamp
  locationFrom?: string;    // Source location (for transfers)
  locationTo?: string;      // Destination location (for transfers)
}

/**
 * Inventory reservation interface
 */
export interface IInventoryReservation {
  _id?: string;
  inventoryItemId: number;  // Reference to inventory item
  quantity: number;         // Reserved quantity
  referenceType: string;    // e.g., 'work_order', 'sales_order'
  referenceId: number;      // ID of the reference document
  reservedBy: number;       // User ID who made the reservation
  reservedAt: Date;         // Reservation timestamp
  expiresAt?: Date;         // Expiration of reservation (optional)
  isActive: boolean;        // Whether the reservation is still active
  notes?: string;           // Reservation notes
}

/**
 * Inventory alert levels enum
 */
export enum InventoryAlertLevel {
  NORMAL = 'normal',
  WARNING = 'warning',
  CRITICAL = 'critical'
}

/**
 * Inventory alert interface
 */
export interface IInventoryAlert {
  _id?: string;
  inventoryItemId: number;  // Reference to inventory item
  alertLevel: InventoryAlertLevel; // Alert severity
  message: string;          // Alert message
  isResolved: boolean;      // Whether the alert has been resolved
  createdAt: Date;          // Alert creation timestamp
  resolvedAt?: Date;        // When the alert was resolved (if applicable)
  resolvedBy?: number;      // User ID who resolved the alert
}

/**
 * Inventory metrics interface for dashboard
 */
export interface InventoryMetrics {
  totalProducts: number;       // Total number of product types in inventory
  lowStockProducts: number;    // Products below reorder point but not zero
  outOfStockProducts: number;  // Products with zero stock
  excessStockProducts: number; // Products above maximum quantity
  totalInventoryValue: number; // Total value of all inventory
  topCategories: {             // Top inventory categories by count
    category: string;
    count: number;
  }[];
  alertsCount: number;         // Number of unresolved alerts
} 