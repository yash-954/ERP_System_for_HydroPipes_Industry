// Define work order status types
export enum WorkOrderStatus {
  DRAFT = 'draft',
  PENDING = 'pending',
  IN_PROGRESS = 'in-progress',
  ON_HOLD = 'on-hold',
  COMPLETED = 'completed',
  DELIVERED = 'delivered',
  CANCELLED = 'cancelled'
}

// Define priority levels
export enum PriorityLevel {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  URGENT = 'urgent'
}

// Interface for the main work order
export interface IWorkOrder {
  _id?: string;
  orderNumber: string;
  customerId: number;
  customerName?: string; // Denormalized for quick access
  description: string;
  priority: PriorityLevel;
  status: WorkOrderStatus;
  startDate: Date;
  dueDate: Date;
  completedDate?: Date;
  assemblies: IWorkOrderAssembly[];
  notes?: string;
  assignedUsers?: number[]; // User IDs of assigned team members
  totalQuantity: number;
  completedQuantity: number;
  createdBy: number; // User ID who created the order
  createdAt: Date;
  updatedAt: Date;
}

// Interface for assemblies within a work order
export interface IWorkOrderAssembly {
  assemblyId?: number;
  name: string;
  partCode?: string;
  specifications?: ISpecification[];
  quantity: number;
  completedQuantity: number;
}

// Interface for specifications within an assembly
export interface ISpecification {
  name: string;
  value: string;
  unit?: string;
}

// Interface for status change history
export interface IStatusChange {
  _id?: string;
  workOrderId: number;
  previousStatus: WorkOrderStatus;
  newStatus: WorkOrderStatus;
  changedBy: number; // User ID
  reason?: string;
  timestamp: Date;
} 