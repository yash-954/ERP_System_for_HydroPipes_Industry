import { db } from '../db/localDb';
import { PurchaseOrderStatus, LocalPurchaseOrder, IPurchaseOrderItem } from '../../models/Purchase';

// Helper types for status counts
export type StatusCounts = Record<PurchaseOrderStatus, number>;

// Helper interface for dashboard stats
export interface PurchaseStats {
  counts: StatusCounts;
  totalOrders: number;
  totalAmount: number;
  averageOrderValue: number;
  pendingAmount: number;
}

// Service for handling purchase order operations
const purchaseService = {
  // Get all purchase orders
  getAll: async (): Promise<LocalPurchaseOrder[]> => {
    try {
      return await db.purchaseOrders.toArray();
    } catch (error) {
      console.error('Error fetching purchase orders:', error);
      throw error;
    }
  },

  // Get purchase order by ID
  getById: async (id: number): Promise<LocalPurchaseOrder | undefined> => {
    try {
      return await db.purchaseOrders.get(id);
    } catch (error) {
      console.error(`Error fetching purchase order ${id}:`, error);
      throw error;
    }
  },

  // Get purchase orders by status
  getByStatus: async (status: PurchaseOrderStatus): Promise<LocalPurchaseOrder[]> => {
    try {
      return await db.purchaseOrders.where('status').equals(status).toArray();
    } catch (error) {
      console.error(`Error fetching purchase orders with status ${status}:`, error);
      throw error;
    }
  },

  // Get purchase orders by supplier
  getBySupplier: async (supplierId: number): Promise<LocalPurchaseOrder[]> => {
    try {
      return await db.purchaseOrders.where('supplierId').equals(supplierId).toArray();
    } catch (error) {
      console.error(`Error fetching purchase orders for supplier ${supplierId}:`, error);
      throw error;
    }
  },

  // Get purchase orders by date range
  getByDateRange: async (startDate: Date, endDate: Date): Promise<LocalPurchaseOrder[]> => {
    try {
      const endOfDay = new Date(endDate);
      endOfDay.setHours(23, 59, 59, 999);
      
      return await db.purchaseOrders
        .where('orderDate')
        .between(startDate, endOfDay)
        .toArray();
    } catch (error) {
      console.error(`Error fetching purchase orders by date range:`, error);
      throw error;
    }
  },

  // Get counts by status
  getCountsByStatus: async (): Promise<StatusCounts> => {
    try {
      const allOrders = await db.purchaseOrders.toArray();
      
      const counts: StatusCounts = {
        [PurchaseOrderStatus.DRAFT]: 0,
        [PurchaseOrderStatus.PENDING_APPROVAL]: 0,
        [PurchaseOrderStatus.APPROVED]: 0,
        [PurchaseOrderStatus.ORDERED]: 0,
        [PurchaseOrderStatus.PARTIALLY_RECEIVED]: 0,
        [PurchaseOrderStatus.RECEIVED]: 0,
        [PurchaseOrderStatus.CANCELLED]: 0
      };
      
      allOrders.forEach(order => {
        counts[order.status]++;
      });
      
      return counts;
    } catch (error) {
      console.error('Error getting purchase order counts by status:', error);
      throw error;
    }
  },

  // Get purchase statistics
  getStats: async (): Promise<PurchaseStats> => {
    try {
      const allOrders = await db.purchaseOrders.toArray();
      const counts = await purchaseService.getCountsByStatus();
      
      // Calculate total amount
      const totalAmount = allOrders.reduce((sum, order) => sum + order.totalAmount, 0);
      
      // Calculate pending amount (orders not cancelled or received)
      const pendingAmount = allOrders
        .filter(order => 
          order.status !== PurchaseOrderStatus.CANCELLED && 
          order.status !== PurchaseOrderStatus.RECEIVED)
        .reduce((sum, order) => sum + order.totalAmount, 0);
      
      return {
        counts,
        totalOrders: allOrders.length,
        totalAmount,
        averageOrderValue: allOrders.length ? totalAmount / allOrders.length : 0,
        pendingAmount
      };
    } catch (error) {
      console.error('Error calculating purchase statistics:', error);
      throw error;
    }
  },

  // Generate unique purchase order number
  generateOrderNumber: async (): Promise<string> => {
    try {
      const count = await db.purchaseOrders.count();
      const date = new Date();
      const year = date.getFullYear().toString().substring(2); // Last 2 digits of year
      const month = (date.getMonth() + 1).toString().padStart(2, '0');
      
      // Format: PO-YY-MM-XXXX where XXXX is sequential number
      return `PO-${year}-${month}-${(count + 1).toString().padStart(4, '0')}`;
    } catch (error) {
      console.error('Error generating purchase order number:', error);
      throw error;
    }
  },

  // Calculate total amounts for a purchase order
  calculateTotals: (lineItems: IPurchaseOrderItem[]): { 
    subtotal: number;
    taxAmount: number;
    totalAmount: number;
  } => {
    // Calculate subtotal
    const subtotal = lineItems.reduce((sum, item) => sum + item.totalPrice, 0);
    
    // Calculate tax amount
    const taxAmount = lineItems.reduce((sum, item) => sum + item.taxAmount, 0);
    
    // Calculate total amount
    const totalAmount = subtotal + taxAmount;
    
    return {
      subtotal,
      taxAmount,
      totalAmount
    };
  },

  // Create a new purchase order
  create: async (
    purchaseOrderData: Omit<LocalPurchaseOrder, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<number> => {
    try {
      // Generate unique order number if not provided
      if (!purchaseOrderData.orderNumber) {
        purchaseOrderData.orderNumber = await purchaseService.generateOrderNumber();
      }

      // Create the purchase order
      const id = await db.purchaseOrders.add({
        ...purchaseOrderData,
        createdAt: new Date(),
        updatedAt: new Date()
      });

      // Record the initial status change
      await db.purchaseOrderStatusChanges.add({
        purchaseOrderId: id.toString(),
        previousStatus: PurchaseOrderStatus.DRAFT, // Assumed initial status
        newStatus: purchaseOrderData.status,
        changedBy: purchaseOrderData.createdBy,
        reason: 'Purchase order created',
        timestamp: new Date()
      });

      return id;
    } catch (error) {
      console.error('Error creating purchase order:', error);
      throw error;
    }
  },

  // Update a purchase order
  update: async (
    id: number,
    purchaseOrderData: Partial<Omit<LocalPurchaseOrder, 'id' | 'createdAt' | 'updatedAt'>>
  ): Promise<number> => {
    try {
      // Check if status is being updated
      if (purchaseOrderData.status) {
        const currentOrder = await db.purchaseOrders.get(id);
        
        if (currentOrder && currentOrder.status !== purchaseOrderData.status) {
          // Record the status change
          await db.purchaseOrderStatusChanges.add({
            purchaseOrderId: id.toString(),
            previousStatus: currentOrder.status,
            newStatus: purchaseOrderData.status,
            changedBy: purchaseOrderData.createdBy || 0, // Fallback if not provided
            reason: purchaseOrderData.notes || 'Status updated',
            timestamp: new Date()
          });
        }
      }
      
      // Update the purchase order
      await db.purchaseOrders.update(id, {
        ...purchaseOrderData,
        updatedAt: new Date()
      });

      return id;
    } catch (error) {
      console.error(`Error updating purchase order ${id}:`, error);
      throw error;
    }
  },

  // Update purchase order status
  updateStatus: async (
    id: number,
    newStatus: PurchaseOrderStatus,
    changedBy: number,
    reason?: string
  ): Promise<void> => {
    try {
      const currentOrder = await db.purchaseOrders.get(id);
      
      if (!currentOrder) {
        throw new Error(`Purchase order ${id} not found`);
      }
      
      // Record the status change
      await db.purchaseOrderStatusChanges.add({
        purchaseOrderId: id.toString(),
        previousStatus: currentOrder.status,
        newStatus: newStatus,
        changedBy: changedBy,
        reason: reason || 'Status updated',
        timestamp: new Date()
      });
      
      // Update the order status
      await db.purchaseOrders.update(id, {
        status: newStatus,
        updatedAt: new Date()
      });
    } catch (error) {
      console.error(`Error updating purchase order ${id} status:`, error);
      throw error;
    }
  },

  // Delete a purchase order
  delete: async (id: number): Promise<void> => {
    try {
      // Start a transaction to delete related data
      await db.transaction('rw', [
        db.purchaseOrders,
        db.purchaseOrderStatusChanges
      ], async () => {
        // Delete status changes
        await db.purchaseOrderStatusChanges
          .where('purchaseOrderId')
          .equals(id.toString())
          .delete();
        
        // Delete the purchase order
        await db.purchaseOrders.delete(id);
      });
    } catch (error) {
      console.error(`Error deleting purchase order ${id}:`, error);
      throw error;
    }
  },

  // Get recent purchase orders
  getRecent: async (limit: number = 5): Promise<LocalPurchaseOrder[]> => {
    try {
      return await db.purchaseOrders
        .orderBy('createdAt')
        .reverse()
        .limit(limit)
        .toArray();
    } catch (error) {
      console.error('Error fetching recent purchase orders:', error);
      throw error;
    }
  },

  // Get purchase order history (status changes)
  getStatusHistory: async (purchaseOrderId: number): Promise<any[]> => {
    try {
      return await db.purchaseOrderStatusChanges
        .where('purchaseOrderId')
        .equals(purchaseOrderId.toString())
        .toArray();
    } catch (error) {
      console.error(`Error fetching status history for purchase order ${purchaseOrderId}:`, error);
      throw error;
    }
  },

  // Mark items as received (all or partial)
  markItemsReceived: async (
    purchaseOrderId: number,
    receivedItems: { productId: number, receivedQuantity: number }[],
    changedBy: number
  ): Promise<void> => {
    try {
      const order = await db.purchaseOrders.get(purchaseOrderId);
      
      if (!order) {
        throw new Error(`Purchase order ${purchaseOrderId} not found`);
      }
      
      // Update received quantities for each line item
      const updatedLineItems = order.lineItems.map(item => {
        const receivedItem = receivedItems.find(ri => ri.productId === item.productId);
        
        if (receivedItem) {
          // Ensure received quantity doesn't exceed ordered quantity
          const newReceivedQty = Math.min(
            item.quantity, 
            item.receivedQuantity + receivedItem.receivedQuantity
          );
          
          return {
            ...item,
            receivedQuantity: newReceivedQty
          };
        }
        
        return item;
      });
      
      // Check if all items are fully received
      const isFullyReceived = updatedLineItems.every(
        item => item.receivedQuantity >= item.quantity
      );
      
      // Check if some items are received but not all
      const isPartiallyReceived = updatedLineItems.some(
        item => item.receivedQuantity > 0 && item.receivedQuantity < item.quantity
      );
      
      // Determine new status
      let newStatus = order.status;
      if (isFullyReceived) {
        newStatus = PurchaseOrderStatus.RECEIVED;
      } else if (isPartiallyReceived) {
        newStatus = PurchaseOrderStatus.PARTIALLY_RECEIVED;
      }
      
      // Update the order
      await db.purchaseOrders.update(purchaseOrderId, {
        lineItems: updatedLineItems,
        status: newStatus,
        updatedAt: new Date()
      });
      
      // Record status change if needed
      if (newStatus !== order.status) {
        await db.purchaseOrderStatusChanges.add({
          purchaseOrderId: purchaseOrderId.toString(),
          previousStatus: order.status,
          newStatus: newStatus,
          changedBy: changedBy,
          reason: 'Items received',
          timestamp: new Date()
        });
      }
    } catch (error) {
      console.error(`Error marking items received for purchase order ${purchaseOrderId}:`, error);
      throw error;
    }
  }
};

export default purchaseService; 