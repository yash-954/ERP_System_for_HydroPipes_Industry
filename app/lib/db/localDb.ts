import Dexie, { Table } from 'dexie';
import { IUser, UserRole } from '../../models/User';
import { IOrganization } from '../../models/Organization';
import { IPermission, ModuleId } from '../../models/Permission';
import { IDepartment, ITeamMember, TeamRole } from '../../models/Department';
import { Notification, NotificationStatus, NotificationType } from '../../models/Notification';
import { IWorkOrder, WorkOrderStatus, IStatusChange, PriorityLevel, IWorkOrderAssembly, ISpecification } from '../../models/WorkOrder';
import { IPurchaseOrder, PurchaseOrderStatus, IPurchaseOrderItem, IPurchaseOrderStatusChange, LocalPurchaseOrder } from '../../models/Purchase';
import { IInventoryItem, InventoryStatus, InventoryType, IInventoryTransaction, IInventoryReservation, IInventoryAlert, InventoryTransactionType, InventoryAlertLevel, InventoryAdjustmentReason } from '../../models/Inventory';

// Define interfaces for our local database entities
export interface LocalUser extends Omit<IUser, '_id'> {
  id?: number;
  name: string;
  email: string;
  password: string;
  role: UserRole;
  isActive: boolean;
  organizationId?: number; // Reference to the organization
  organizationCode?: string; // Cache the organization code for quicker access
  departmentId?: number; // Reference to the department/team
  managerId?: number; // If this is a basic user, this references their manager
  createdAt: Date;
  updatedAt: Date;
  lastLogin?: Date;
}

export interface LocalOrganization extends Omit<IOrganization, '_id'> {
  id?: number;
  name: string;
  code: string;
  adminUserId: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface LocalPermission extends Omit<IPermission, '_id'> {
  id?: number;
  userId: number;
  moduleId: ModuleId;
  canView: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface LocalDepartment extends Omit<IDepartment, '_id'> {
  id?: number;
  name: string;
  description?: string;
  managerId: number;
  organizationId: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface LocalTeamMember extends Omit<ITeamMember, '_id'> {
  id?: number;
  departmentId: number;
  userId: number;
  role: TeamRole;
  joinedAt: Date;
}

export interface LocalInventoryItem extends Omit<IInventoryItem, '_id'> {
  id?: number;
  sku: string;              
  name: string;             
  description: string;      
  type: InventoryType;      
  status: InventoryStatus;  
  currentQuantity: number;  
  reservedQuantity: number; 
  availableQuantity: number;
  minimumQuantity: number;  
  maximumQuantity: number;  
  reorderQuantity: number;  
  leadTimeInDays: number;   
  unitPrice: number;        
  totalValue: number;       
  location: string;         
  unitOfMeasure: string;    
  supplierId?: number;      
  supplierName?: string;    
  lastRestockDate?: Date;   
  lastCountDate?: Date;     
  averageDailyUsage: number;
  isFlagged: boolean;       
  notes?: string;           
  images?: string[];        
  isActive: boolean;        
  createdBy: number;        
  updatedBy: number;        
  createdAt: Date;          
  updatedAt: Date;          
}

export interface LocalSupplier {
  id?: number;
  name: string;
  contactPerson: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  gstin: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface LocalCustomer {
  id?: number;
  name: string;
  contactPerson: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  gstin: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface LocalOrder {
  id?: number;
  orderNumber: string;
  customerId: number;
  items: LocalOrderItem[];
  totalAmount: number;
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  paymentStatus: 'pending' | 'partial' | 'paid';
  notes: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface LocalOrderItem {
  id?: number;
  orderId: number;
  inventoryItemId: number;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

export interface LocalPurchase {
  id?: number;
  purchaseNumber: string;
  supplierId: number;
  items: LocalPurchaseItem[];
  totalAmount: number;
  status: 'pending' | 'received' | 'cancelled';
  paymentStatus: 'pending' | 'partial' | 'paid';
  notes: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface LocalPurchaseItem {
  id?: number;
  purchaseId: number;
  inventoryItemId: number;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

export interface LocalNotification extends Omit<Notification, 'id'> {
  id?: number;
  userId: number;
  title: string;
  message: string;
  type: NotificationType;
  status: NotificationStatus;
  linkedEntityId?: number;
  entityType?: string;
  createdAt: Date;
  updatedAt: Date;
}

// Work Order related interfaces
export interface LocalWorkOrder extends Omit<IWorkOrder, '_id'> {
  id?: number;
  orderNumber: string;
  customerId: number;
  customerName?: string;
  description: string;
  priority: PriorityLevel;
  status: WorkOrderStatus;
  startDate: Date;
  dueDate: Date;
  completedDate?: Date;
  notes?: string;
  assignedUsers?: number[];
  totalQuantity: number;
  completedQuantity: number;
  createdBy: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface LocalWorkOrderAssembly extends Omit<IWorkOrderAssembly, 'specifications'> {
  id?: number;
  workOrderId: number;
  assemblyId?: number;
  name: string;
  partCode?: string;
  quantity: number;
  completedQuantity: number;
}

export interface LocalSpecification extends ISpecification {
  id?: number;
  assemblyId: number; // Foreign key to LocalWorkOrderAssembly
}

export interface LocalStatusChange extends Omit<IStatusChange, '_id'> {
  id?: number;
  workOrderId: number;
  previousStatus: WorkOrderStatus;
  newStatus: WorkOrderStatus;
  changedBy: number;
  reason?: string;
  timestamp: Date;
}

// Interface for purchase order status change in local DB
export interface LocalPurchaseOrderStatusChange extends Omit<IPurchaseOrderStatusChange, '_id'> {
  id?: number;
  purchaseOrderId: string;
  previousStatus: PurchaseOrderStatus;
  newStatus: PurchaseOrderStatus;
  changedBy: number;
  reason?: string;
  timestamp: Date;
}

// Inventory transaction interface for local database
export interface LocalInventoryTransaction extends Omit<IInventoryTransaction, '_id'> {
  id?: number;
  inventoryItemId: number;
  type: InventoryTransactionType;
  quantity: number;
  previousQuantity: number;
  newQuantity: number;
  unitPrice: number;
  totalValue: number;
  referenceType?: string;
  referenceId?: number;
  reason?: InventoryAdjustmentReason;
  notes?: string;
  performedBy: number;
  timestamp: Date;
  locationFrom?: string;
  locationTo?: string;
}

// Inventory reservation interface for local database
export interface LocalInventoryReservation extends Omit<IInventoryReservation, '_id'> {
  id?: number;
  inventoryItemId: number;
  quantity: number;
  referenceType: string;
  referenceId: number;
  reservedBy: number;
  reservedAt: Date;
  expiresAt?: Date;
  isActive: boolean;
  notes?: string;
}

// Inventory alert interface for local database
export interface LocalInventoryAlert extends Omit<IInventoryAlert, '_id'> {
  id?: number;
  inventoryItemId: number;
  alertLevel: InventoryAlertLevel;
  message: string;
  isResolved: boolean;
  createdAt: Date;
  resolvedAt?: Date;
  resolvedBy?: number;
}

// Define our database class
class HydroPipesDatabase extends Dexie {
  users!: Table<LocalUser, number>;
  organizations!: Table<LocalOrganization, number>;
  permissions!: Table<LocalPermission, number>;
  departments!: Table<LocalDepartment, number>;
  teamMembers!: Table<LocalTeamMember, number>;
  inventoryItems!: Table<LocalInventoryItem, number>;
  suppliers!: Table<LocalSupplier, number>;
  customers!: Table<LocalCustomer, number>;
  orders!: Table<LocalOrder, number>;
  orderItems!: Table<LocalOrderItem, number>;
  purchases!: Table<LocalPurchase, number>;
  purchaseItems!: Table<LocalPurchaseItem, number>;
  notifications!: Table<LocalNotification, number>;
  workOrders!: Table<LocalWorkOrder, number>;
  workOrderAssemblies!: Table<LocalWorkOrderAssembly, number>;
  specifications!: Table<LocalSpecification, number>;
  statusChanges!: Table<LocalStatusChange, number>;
  purchaseOrders!: Table<LocalPurchaseOrder, number>;
  purchaseOrderStatusChanges!: Table<LocalPurchaseOrderStatusChange, number>;
  inventoryTransactions!: Table<LocalInventoryTransaction, number>;
  inventoryReservations!: Table<LocalInventoryReservation, number>;
  inventoryAlerts!: Table<LocalInventoryAlert, number>;

  constructor() {
    super('ERP-IITR'); // Updated database name
    
    // Define the schema for our database
    this.version(1).stores({
      users: '++id, email, role, organizationId, organizationCode, departmentId, managerId',
      organizations: '++id, code, adminUserId',
      permissions: '++id, userId, moduleId',
      departments: '++id, name, managerId, organizationId',
      teamMembers: '++id, departmentId, userId',
      inventoryItems: '++id, sku, name, type, status, supplierId',
      suppliers: '++id, name, email',
      customers: '++id, name, email',
      orders: '++id, orderNumber, customerId, status',
      orderItems: '++id, orderId, inventoryItemId',
      purchases: '++id, purchaseNumber, supplierId, status',
      purchaseItems: '++id, purchaseId, inventoryItemId',
      notifications: '++id, userId, status, type, createdAt',
      workOrders: '++id, orderNumber, customerId, status, dueDate, priority',
      workOrderAssemblies: '++id, workOrderId, assemblyId, name',
      specifications: '++id, assemblyId',
      statusChanges: '++id, workOrderId, timestamp',
      purchaseOrders: '++id, orderNumber, supplierId, status, orderDate',
      purchaseOrderStatusChanges: '++id, purchaseOrderId, previousStatus, newStatus'
    });
    
    // Add new tables in version 2
    this.version(2).stores({
      inventoryTransactions: '++id, inventoryItemId, type, timestamp',
      inventoryReservations: '++id, inventoryItemId, referenceType, referenceId, isActive',
      inventoryAlerts: '++id, inventoryItemId, alertLevel, isResolved'
    });
  }
}

// Create a singleton instance of the database
export const db = new HydroPipesDatabase();

// Flag to track if seeding has occurred
let hasSeeded = false;

// Export a function to reset the seeding flag
export function resetSeedFlag() {
  console.log('Resetting database seed flag');
  hasSeeded = false;
}

// Function to generate a random organization code
function generateOrganizationCode(): string {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  
  // Generate a 6-character code
  for (let i = 0; i < 6; i++) {
    const randomIndex = Math.floor(Math.random() * characters.length);
    code += characters.charAt(randomIndex);
  }
  
  return code;
}

// Function to seed initial data
export async function seedDatabase(forceReseed = false) {
  // Check if we've already seeded the database
  if (hasSeeded && !forceReseed) {
    console.log('Database already seeded, skipping seed process');
    return;
  }
  
  try {
    // Check if we have any existing users, if so, don't seed
    const userCount = await db.users.count();
    const orgCount = await db.organizations.count();
    console.log(`Found ${userCount} existing users and ${orgCount} organizations in the database`);
    
    if (userCount > 0 && orgCount > 0 && !forceReseed) {
      console.log('Existing users and organizations found, setting hasSeeded flag to true');
      hasSeeded = true;
      
      // Seed test notifications for admin user
      const adminUser = await db.users.where('role').equals(UserRole.ADMIN).first();
      if (adminUser && adminUser.id) {
        await seedTestNotifications(adminUser.id, 10);
      }
    }

    console.log('Seeding local database with initial data...');

    // Create an organization first
    const orgCode = generateOrganizationCode();
    const organizationId = await db.organizations.add({
      name: 'ERP-IITR Demo Organization',
      code: orgCode,
      adminUserId: 0, // Will update this after creating the admin
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date()
    });
    console.log(`Created organization with ID: ${organizationId} and code: ${orgCode}`);

    // Add admin user
    const adminId = await db.users.add({
      name: 'Admin User',
      email: 'admin@erp-iitr.com',
      password: '$2a$10$vQPLj5mIiw9oHO0Dfb5DA.1EGBd2MJfCreVrb9pdnHnaBVYXCeE5a', // hashed 'password123'
      role: UserRole.ADMIN,
      isActive: true,
      organizationId: organizationId,
      organizationCode: orgCode,
      createdAt: new Date(),
      updatedAt: new Date()
    });
    console.log(`Created admin user with ID: ${adminId}`);

    // Update the organization with the admin ID
    await db.organizations.update(organizationId, {
      adminUserId: adminId
    });

    // Add manager user
    const managerId = await db.users.add({
      name: 'Manager User',
      email: 'manager@erp-iitr.com',
      password: '$2a$10$vQPLj5mIiw9oHO0Dfb5DA.1EGBd2MJfCreVrb9pdnHnaBVYXCeE5a',
      role: UserRole.MANAGER,
      isActive: true,
      organizationId: organizationId,
      organizationCode: orgCode,
      createdAt: new Date(),
      updatedAt: new Date()
    });
    console.log(`Created manager user with ID: ${managerId}`);

    // Add basic user
    const basicId = await db.users.add({
      name: 'Basic User',
      email: 'user@erp-iitr.com',
      password: '$2a$10$vQPLj5mIiw9oHO0Dfb5DA.1EGBd2MJfCreVrb9pdnHnaBVYXCeE5a',
      role: UserRole.BASIC,
      isActive: true,
      organizationId: organizationId,
      organizationCode: orgCode,
      createdAt: new Date(),
      updatedAt: new Date()
    });
    console.log(`Created basic user with ID: ${basicId}`);

    // Add sample suppliers
    const supplierId1 = await db.suppliers.add({
      name: 'Hydro Components Ltd.',
      contactPerson: 'Rajesh Kumar',
      email: 'info@hydrocomponents.com',
      phone: '9876543210',
      address: '123 Industrial Area',
      city: 'Mumbai',
      state: 'Maharashtra',
      pincode: '400001',
      gstin: '27AABCU9603R1ZX',
      createdAt: new Date(),
      updatedAt: new Date()
    });

    const supplierId2 = await db.suppliers.add({
      name: 'Precision Hydraulics',
      contactPerson: 'Amit Sharma',
      email: 'contact@precisionhydraulics.com',
      phone: '8765432109',
      address: '456 MIDC',
      city: 'Pune',
      state: 'Maharashtra',
      pincode: '411057',
      gstin: '27AADCP8564R1ZX',
      createdAt: new Date(),
      updatedAt: new Date()
    });

    // Add sample inventory items
    await db.inventoryItems.bulkAdd([
      {
        name: 'Hydraulic Cylinder',
        description: 'Double-acting hydraulic cylinder, 50mm bore',
        sku: 'HC-001',
        type: InventoryType.COMPONENT,
        status: InventoryStatus.IN_STOCK,
        currentQuantity: 25,
        reservedQuantity: 0,
        availableQuantity: 25,
        minimumQuantity: 5,
        maximumQuantity: 50,
        reorderQuantity: 10,
        leadTimeInDays: 7,
        unitPrice: 7500,
        totalValue: 187500,
        location: 'Rack A-1',
        unitOfMeasure: 'pcs',
        supplierId: supplierId1,
        supplierName: 'Hydro Components Ltd.',
        averageDailyUsage: 0.5,
        isFlagged: false,
        isActive: true,
        createdBy: adminId,
        updatedBy: adminId,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: 'Pressure Valve',
        description: 'Adjustable pressure relief valve, 350 bar',
        sku: 'PV-002',
        type: InventoryType.COMPONENT,
        status: InventoryStatus.IN_STOCK,
        currentQuantity: 40,
        reservedQuantity: 0,
        availableQuantity: 40,
        minimumQuantity: 10,
        maximumQuantity: 80,
        reorderQuantity: 20,
        leadTimeInDays: 5,
        unitPrice: 2200,
        totalValue: 88000,
        location: 'Rack B-3',
        unitOfMeasure: 'pcs',
        supplierId: supplierId2,
        supplierName: 'Precision Hydraulics',
        averageDailyUsage: 1.2,
        isFlagged: false,
        isActive: true,
        createdBy: adminId,
        updatedBy: adminId,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: 'Hydraulic Hose',
        description: 'High-pressure hose, 1/2 inch, 2 meter length',
        sku: 'HH-003',
        type: InventoryType.COMPONENT,
        status: InventoryStatus.IN_STOCK,
        currentQuantity: 100,
        reservedQuantity: 0,
        availableQuantity: 100,
        minimumQuantity: 20,
        maximumQuantity: 120,
        reorderQuantity: 20,
        leadTimeInDays: 3,
        unitPrice: 850,
        totalValue: 85000,
        location: 'Rack C-2',
        unitOfMeasure: 'pcs',
        supplierId: supplierId1,
        supplierName: 'Hydro Components Ltd.',
        averageDailyUsage: 2.5,
        isFlagged: false,
        isActive: true,
        createdBy: adminId,
        updatedBy: adminId,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: 'Hydraulic Pump',
        description: 'Gear pump, 25cc/rev, 250 bar',
        sku: 'HP-004',
        type: InventoryType.COMPONENT,
        status: InventoryStatus.IN_STOCK,
        currentQuantity: 15,
        reservedQuantity: 0,
        availableQuantity: 15,
        minimumQuantity: 3,
        maximumQuantity: 20,
        reorderQuantity: 5,
        leadTimeInDays: 10,
        unitPrice: 12500,
        totalValue: 187500,
        location: 'Rack A-4',
        unitOfMeasure: 'pcs',
        supplierId: supplierId2,
        supplierName: 'Precision Hydraulics',
        averageDailyUsage: 0.3,
        isFlagged: false,
        isActive: true,
        createdBy: adminId,
        updatedBy: adminId,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ]);

    // Add sample customers
    const customerId1 = await db.customers.add({
      name: 'ABC Industries',
      contactPerson: 'Priya Singh',
      email: 'procurement@abcindustries.com',
      phone: '7654321098',
      address: '789 Industrial Estate',
      city: 'Delhi',
      state: 'Delhi',
      pincode: '110001',
      gstin: '07AABCA8765R1ZX',
      createdAt: new Date(),
      updatedAt: new Date()
    });

    const customerId2 = await db.customers.add({
      name: 'XYZ Engineering',
      contactPerson: 'Suresh Patel',
      email: 'orders@xyzengineering.com',
      phone: '6543210987',
      address: '321 Manufacturing Hub',
      city: 'Ahmedabad',
      state: 'Gujarat',
      pincode: '380001',
      gstin: '24AADCX4567R1ZX',
      createdAt: new Date(),
      updatedAt: new Date()
    });

    console.log('Seeding completed successfully');
    hasSeeded = true;
    
    // Verify users were created
    const adminUsers = await db.users.where('role').equals(UserRole.ADMIN).toArray();
    const managerUsers = await db.users.where('role').equals(UserRole.MANAGER).toArray();
    console.log(`Verification: Found ${adminUsers.length} admin users and ${managerUsers.length} manager users`);
    
    // Seed test notifications for admin user
    if (adminUsers.length > 0 && adminUsers[0].id) {
      await seedTestNotifications(adminUsers[0].id, 10);
    }
    
    return true;
  } catch (error) {
    console.error('Error seeding database:', error);
    // Don't set hasSeeded flag if there was an error
    hasSeeded = false;
    // Throw the error to ensure it's visible
    throw error;
  }
}

// Add an event listener for database deletion to reset the seed flag
db.on('versionchange', function(event) {
  if (event.oldVersion === null && event.newVersion === null) {
    // Database was deleted
    console.log('Database was deleted, resetting seed flag');
    resetSeedFlag();
  }
});

// Function to seed test notifications
export async function seedTestNotifications(userId: number, count: number = 5) {
  try {
    console.log(`Seeding ${count} test notifications for user ${userId}`);
    
    const notificationTypes = [
      NotificationType.INFO,
      NotificationType.SUCCESS,
      NotificationType.WARNING,
      NotificationType.ERROR,
      NotificationType.MESSAGE
    ];
    
    const titles = [
      'New Order Received',
      'Inventory Alert',
      'Payment Processed',
      'Shipment Update',
      'Meeting Reminder',
      'Task Assigned',
      'System Maintenance',
      'Price Update',
      'Customer Feedback',
      'Document Shared'
    ];
    
    const messages = [
      'A new order #12345 has been placed by HydroTech.',
      'Inventory for item PVC-200 is below minimum stock level.',
      'Payment of ₹25,000 has been received for invoice #INV-2023-089.',
      'Order #12345 has been shipped. Tracking: TRK78901234.',
      'Reminder: Team meeting at 3:00 PM today in Conference Room A.',
      'You have been assigned a new task: "Update inventory prices".',
      'System will be down for maintenance from 10 PM to 11 PM today.',
      'Price updates for 15 items have been approved.',
      'New customer feedback received with rating: 4.5/5.',
      'Important document "Q2 Report" has been shared with you.'
    ];
    
    const entities = [
      { type: 'order', id: 1 },
      { type: 'inventory', id: 5 },
      { type: 'payment', id: 12 },
      { type: 'shipment', id: 8 },
      { type: 'meeting', id: 3 },
      { type: 'task', id: 15 },
      { type: 'system', id: null },
      { type: 'price', id: 7 },
      { type: 'feedback', id: 22 },
      { type: 'document', id: 14 }
    ];
    
    const now = new Date();
    const notifications = [];
    
    // Create random notifications
    for (let i = 0; i < count; i++) {
      const titleIndex = Math.floor(Math.random() * titles.length);
      const typeIndex = Math.floor(Math.random() * notificationTypes.length);
      const entityIndex = Math.floor(Math.random() * entities.length);
      
      // Create notification time between now and 7 days ago
      const createdAt = new Date(now);
      createdAt.setDate(createdAt.getDate() - Math.floor(Math.random() * 7));
      createdAt.setHours(createdAt.getHours() - Math.floor(Math.random() * 24));
      
      const status = Math.random() > 0.7 
        ? NotificationStatus.READ 
        : NotificationStatus.UNREAD;
      
      const notification: LocalNotification = {
        userId,
        title: titles[titleIndex],
        message: messages[titleIndex],
        type: notificationTypes[typeIndex],
        status,
        entityType: entities[entityIndex].type,
        linkedEntityId: entities[entityIndex].id,
        createdAt,
        updatedAt: createdAt
      };
      
      notifications.push(notification);
    }
    
    // Add notifications to the database
    await db.notifications.bulkAdd(notifications);
    console.log(`Successfully seeded ${count} test notifications`);
    return notifications.length;
  } catch (error) {
    console.error('Error seeding test notifications:', error);
    throw error;
  }
}

// Export a function to get database connection
export function getLocalDb() {
  // Ensure database is seeded
  try {
    seedDatabase().catch(err => {
      console.error('Database seeding failed:', err);
    });
  } catch (error) {
    console.error('Error in getLocalDb:', error);
  }
  return db;
} 