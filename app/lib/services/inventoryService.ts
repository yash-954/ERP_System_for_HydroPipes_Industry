import { db, LocalInventoryItem, LocalInventoryTransaction, LocalInventoryReservation, LocalInventoryAlert } from '../db/localDb';
import { InventoryStatus, InventoryType, InventoryTransactionType, InventoryAlertLevel, InventoryAdjustmentReason, InventoryMetrics } from '../../models/Inventory';

/**
 * Service for managing inventory operations
 */
export const inventoryService = {
  /**
   * Get all inventory items
   */
  getAllItems: async (): Promise<LocalInventoryItem[]> => {
    try {
      return await db.inventoryItems.toArray();
    } catch (error) {
      console.error('Error fetching inventory items:', error);
      throw error;
    }
  },

  /**
   * Get inventory item by ID
   */
  getItemById: async (id: number): Promise<LocalInventoryItem | undefined> => {
    try {
      return await db.inventoryItems.get(id);
    } catch (error) {
      console.error(`Error fetching inventory item ${id}:`, error);
      throw error;
    }
  },

  /**
   * Get inventory items by type
   */
  getItemsByType: async (type: InventoryType): Promise<LocalInventoryItem[]> => {
    try {
      return await db.inventoryItems.where('type').equals(type).toArray();
    } catch (error) {
      console.error(`Error fetching inventory items with type ${type}:`, error);
      throw error;
    }
  },

  /**
   * Get inventory items by status
   */
  getItemsByStatus: async (status: InventoryStatus): Promise<LocalInventoryItem[]> => {
    try {
      return await db.inventoryItems.where('status').equals(status).toArray();
    } catch (error) {
      console.error(`Error fetching inventory items with status ${status}:`, error);
      throw error;
    }
  },

  /**
   * Get inventory items by supplier
   */
  getItemsBySupplier: async (supplierId: number): Promise<LocalInventoryItem[]> => {
    try {
      return await db.inventoryItems.where('supplierId').equals(supplierId).toArray();
    } catch (error) {
      console.error(`Error fetching inventory items for supplier ${supplierId}:`, error);
      throw error;
    }
  },

  /**
   * Get flagged inventory items (needing attention)
   */
  getFlaggedItems: async (): Promise<LocalInventoryItem[]> => {
    try {
      return await db.inventoryItems.where('isFlagged').equals(true).toArray();
    } catch (error) {
      console.error('Error fetching flagged inventory items:', error);
      throw error;
    }
  },

  /**
   * Get low stock inventory items
   */
  getLowStockItems: async (): Promise<LocalInventoryItem[]> => {
    try {
      return await db.inventoryItems
        .filter(item => 
          item.currentQuantity > 0 && 
          item.currentQuantity <= item.minimumQuantity &&
          item.isActive
        )
        .toArray();
    } catch (error) {
      console.error('Error fetching low stock inventory items:', error);
      throw error;
    }
  },

  /**
   * Get out of stock inventory items
   */
  getOutOfStockItems: async (): Promise<LocalInventoryItem[]> => {
    try {
      return await db.inventoryItems
        .filter(item => 
          item.currentQuantity <= 0 &&
          item.isActive
        )
        .toArray();
    } catch (error) {
      console.error('Error fetching out of stock inventory items:', error);
      throw error;
    }
  },

  /**
   * Get excess stock inventory items
   */
  getExcessStockItems: async (): Promise<LocalInventoryItem[]> => {
    try {
      return await db.inventoryItems
        .filter(item => 
          item.currentQuantity > item.maximumQuantity &&
          item.isActive
        )
        .toArray();
    } catch (error) {
      console.error('Error fetching excess stock inventory items:', error);
      throw error;
    }
  },

  /**
   * Create a new inventory item
   */
  createItem: async (itemData: Partial<LocalInventoryItem>): Promise<LocalInventoryItem> => {
    try {
      // Calculate available quantity and total value
      const currentQty = itemData.currentQuantity || 0;
      const reservedQty = itemData.reservedQuantity || 0;
      const availableQty = currentQty - reservedQty;
      const unitPrice = itemData.unitPrice || 0;
      const totalValue = currentQty * unitPrice;
      
      // Set initial status based on stock levels
      let status = InventoryStatus.IN_STOCK;
      if (currentQty <= 0) {
        status = InventoryStatus.OUT_OF_STOCK;
      } else if (currentQty <= (itemData.minimumQuantity || 0)) {
        status = InventoryStatus.LOW_STOCK;
      }
      
      // Prepare item data
      const newItem: Partial<LocalInventoryItem> = {
        ...itemData,
        availableQuantity: availableQty,
        totalValue: totalValue,
        status: status,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      // Create the inventory item
      const id = await db.inventoryItems.add(newItem as LocalInventoryItem);

      // Record the initial inventory transaction
      await db.inventoryTransactions.add({
        inventoryItemId: id,
        type: InventoryTransactionType.ADJUSTMENT,
        quantity: currentQty,
        previousQuantity: 0,
        newQuantity: currentQty,
        unitPrice: unitPrice,
        totalValue: totalValue,
        reason: InventoryAdjustmentReason.SYSTEM_CORRECTION,
        notes: 'Initial inventory setup',
        performedBy: itemData.createdBy || 0,
        timestamp: new Date()
      });

      // Return the created item
      return await db.inventoryItems.get(id) as LocalInventoryItem;
    } catch (error) {
      console.error('Error creating inventory item:', error);
      throw error;
    }
  },

  /**
   * Update an inventory item
   */
  updateItem: async (item: LocalInventoryItem): Promise<LocalInventoryItem> => {
    try {
      // Check if id exists
      if (!item.id) {
        throw new Error('Inventory item ID is required for update');
      }
      
      // Get the current item
      const currentItem = await db.inventoryItems.get(item.id);
      if (!currentItem) {
        throw new Error(`Inventory item with ID ${item.id} not found`);
      }

      // Prepare update data
      const updateData: Partial<LocalInventoryItem> = {
        ...item,
        updatedAt: new Date()
      };

      // Recalculate derived values
      const newQuantity = item.currentQuantity;
      const newPrice = item.unitPrice;
      const reservedQty = item.reservedQuantity;
      
      updateData.totalValue = newQuantity * newPrice;
      updateData.availableQuantity = newQuantity - reservedQty;
      
      // Update status based on new quantity
      const minQuantity = item.minimumQuantity;
      if (newQuantity <= 0) {
        updateData.status = InventoryStatus.OUT_OF_STOCK;
      } else if (newQuantity <= minQuantity) {
        updateData.status = InventoryStatus.LOW_STOCK;
      } else {
        updateData.status = InventoryStatus.IN_STOCK;
      }

      // Record transaction if quantity changed
      if (newQuantity !== currentItem.currentQuantity) {
        const quantityChange = newQuantity - currentItem.currentQuantity;
        await db.inventoryTransactions.add({
          inventoryItemId: item.id,
          type: InventoryTransactionType.ADJUSTMENT,
          quantity: quantityChange,
          previousQuantity: currentItem.currentQuantity,
          newQuantity: newQuantity,
          unitPrice: newPrice,
          totalValue: Math.abs(quantityChange) * newPrice,
          reason: InventoryAdjustmentReason.SYSTEM_CORRECTION,
          notes: 'Updated via inventory form',
          performedBy: item.updatedBy,
          timestamp: new Date()
        });
      }

      // Update the item in the database
      await db.inventoryItems.update(item.id, updateData);
      
      // Return the updated item
      return await db.inventoryItems.get(item.id) as LocalInventoryItem;
    } catch (error) {
      console.error('Error updating inventory item:', error);
      throw error;
    }
  },

  /**
   * Delete an inventory item
   */
  deleteItem: async (id: number): Promise<void> => {
    try {
      // Start a transaction
      await db.transaction('rw', [
        db.inventoryItems, 
        db.inventoryTransactions, 
        db.inventoryReservations,
        db.inventoryAlerts
      ], async () => {
        // Delete related transactions
        await db.inventoryTransactions
          .where('inventoryItemId')
          .equals(id)
          .delete();
        
        // Delete related reservations
        await db.inventoryReservations
          .where('inventoryItemId')
          .equals(id)
          .delete();
        
        // Delete related alerts
        await db.inventoryAlerts
          .where('inventoryItemId')
          .equals(id)
          .delete();
        
        // Delete the inventory item
        await db.inventoryItems.delete(id);
      });
    } catch (error) {
      console.error(`Error deleting inventory item ${id}:`, error);
      throw error;
    }
  },

  /**
   * Adjust inventory quantity
   */
  adjustQuantity: async (
    id: number, 
    quantityChange: number, 
    reason: InventoryAdjustmentReason, 
    notes: string, 
    performedBy: number
  ): Promise<void> => {
    try {
      // Get the current item
      const item = await db.inventoryItems.get(id);
      if (!item) {
        throw new Error(`Inventory item with ID ${id} not found`);
      }

      // Calculate new quantity
      const newQuantity = item.currentQuantity + quantityChange;
      if (newQuantity < 0) {
        throw new Error('Inventory adjustment would result in negative quantity');
      }

      // Calculate new values
      const availableQty = newQuantity - item.reservedQuantity;
      const totalValue = newQuantity * item.unitPrice;
      
      // Determine new status
      let newStatus = InventoryStatus.IN_STOCK;
      if (newQuantity <= 0) {
        newStatus = InventoryStatus.OUT_OF_STOCK;
      } else if (newQuantity <= item.minimumQuantity) {
        newStatus = InventoryStatus.LOW_STOCK;
      }
      
      // Check if we need to flag the item
      const needsFlag = newQuantity <= item.minimumQuantity;
      
      // Update the inventory item
      await db.inventoryItems.update(id, {
        currentQuantity: newQuantity,
        availableQuantity: availableQty,
        totalValue: totalValue,
        status: newStatus,
        isFlagged: needsFlag,
        updatedBy: performedBy,
        updatedAt: new Date()
      });

      // Record the inventory transaction
      await db.inventoryTransactions.add({
        inventoryItemId: id,
        type: InventoryTransactionType.ADJUSTMENT,
        quantity: quantityChange,
        previousQuantity: item.currentQuantity,
        newQuantity: newQuantity,
        unitPrice: item.unitPrice,
        totalValue: Math.abs(quantityChange) * item.unitPrice,
        reason: reason,
        notes: notes,
        performedBy: performedBy,
        timestamp: new Date()
      });

      // Create alert if item is now out of stock or low stock
      if (newStatus === InventoryStatus.OUT_OF_STOCK || newStatus === InventoryStatus.LOW_STOCK) {
        const alertLevel = newStatus === InventoryStatus.OUT_OF_STOCK 
          ? InventoryAlertLevel.CRITICAL 
          : InventoryAlertLevel.WARNING;
        
        const message = newStatus === InventoryStatus.OUT_OF_STOCK
          ? `Item "${item.name}" is now out of stock`
          : `Item "${item.name}" is now below minimum stock level`;
        
        await db.inventoryAlerts.add({
          inventoryItemId: id,
          alertLevel: alertLevel,
          message: message,
          isResolved: false,
          createdAt: new Date()
        });
      }
    } catch (error) {
      console.error(`Error adjusting inventory for item ${id}:`, error);
      throw error;
    }
  },

  /**
   * Create inventory reservation
   */
  createReservation: async (reservationData: Omit<LocalInventoryReservation, 'id' | 'reservedAt'>): Promise<number> => {
    try {
      // Get the inventory item
      const item = await db.inventoryItems.get(reservationData.inventoryItemId);
      if (!item) {
        throw new Error(`Inventory item with ID ${reservationData.inventoryItemId} not found`);
      }

      // Check if there's enough available quantity
      if (item.availableQuantity < reservationData.quantity) {
        throw new Error('Not enough available quantity to make this reservation');
      }

      // Update the inventory item
      const newReservedQty = item.reservedQuantity + reservationData.quantity;
      const newAvailableQty = item.currentQuantity - newReservedQty;
      
      await db.inventoryItems.update(reservationData.inventoryItemId, {
        reservedQuantity: newReservedQty,
        availableQuantity: newAvailableQty,
        updatedAt: new Date()
      });

      // Create the reservation
      const id = await db.inventoryReservations.add({
        ...reservationData,
        reservedAt: new Date()
      });

      return id;
    } catch (error) {
      console.error('Error creating inventory reservation:', error);
      throw error;
    }
  },

  /**
   * Release (remove) inventory reservation
   */
  releaseReservation: async (id: number): Promise<void> => {
    try {
      // Get the reservation
      const reservation = await db.inventoryReservations.get(id);
      if (!reservation) {
        throw new Error(`Reservation with ID ${id} not found`);
      }

      // Get the inventory item
      const item = await db.inventoryItems.get(reservation.inventoryItemId);
      if (!item) {
        throw new Error(`Inventory item with ID ${reservation.inventoryItemId} not found`);
      }

      // Update the inventory item
      const newReservedQty = Math.max(0, item.reservedQuantity - reservation.quantity);
      const newAvailableQty = item.currentQuantity - newReservedQty;
      
      await db.inventoryItems.update(reservation.inventoryItemId, {
        reservedQuantity: newReservedQty,
        availableQuantity: newAvailableQty,
        updatedAt: new Date()
      });

      // Deactivate the reservation
      await db.inventoryReservations.update(id, {
        isActive: false
      });
    } catch (error) {
      console.error(`Error releasing reservation ${id}:`, error);
      throw error;
    }
  },

  /**
   * Get all inventory transactions for an item
   */
  getItemTransactions: async (itemId: number): Promise<LocalInventoryTransaction[]> => {
    try {
      return await db.inventoryTransactions
        .where('inventoryItemId')
        .equals(itemId)
        .reverse() // Most recent first
        .toArray();
    } catch (error) {
      console.error(`Error fetching transactions for item ${itemId}:`, error);
      throw error;
    }
  },

  /**
   * Get all reservations for an item
   */
  getItemReservations: async (itemId: number): Promise<LocalInventoryReservation[]> => {
    try {
      return await db.inventoryReservations
        .where('inventoryItemId')
        .equals(itemId)
        .filter(r => r.isActive) // Only active reservations
        .toArray();
    } catch (error) {
      console.error(`Error fetching reservations for item ${itemId}:`, error);
      throw error;
    }
  },

  /**
   * Get all alerts for an item
   */
  getItemAlerts: async (itemId: number): Promise<LocalInventoryAlert[]> => {
    try {
      return await db.inventoryAlerts
        .where('inventoryItemId')
        .equals(itemId)
        .filter(a => !a.isResolved) // Only unresolved alerts
        .toArray();
    } catch (error) {
      console.error(`Error fetching alerts for item ${itemId}:`, error);
      throw error;
    }
  },

  /**
   * Resolve an inventory alert
   */
  resolveAlert: async (id: number, resolvedBy: number): Promise<void> => {
    try {
      await db.inventoryAlerts.update(id, {
        isResolved: true,
        resolvedAt: new Date(),
        resolvedBy: resolvedBy
      });
    } catch (error) {
      console.error(`Error resolving alert ${id}:`, error);
      throw error;
    }
  },

  /**
   * Get inventory metrics for dashboard
   */
  getInventoryMetrics: async (): Promise<InventoryMetrics> => {
    try {
      // Get all active inventory items
      const allItems = await db.inventoryItems
        .where('isActive')
        .equals(true)
        .toArray();
      
      // Total inventory value
      const totalValue = allItems.reduce((sum, item) => sum + item.totalValue, 0);
      
      // Count items by status
      const lowStockCount = allItems.filter(
        item => item.currentQuantity > 0 && item.currentQuantity <= item.minimumQuantity
      ).length;
      
      const outOfStockCount = allItems.filter(
        item => item.currentQuantity <= 0
      ).length;
      
      const excessStockCount = allItems.filter(
        item => item.currentQuantity > item.maximumQuantity
      ).length;
      
      // Count items by category
      const categoryCounts = new Map<string, number>();
      allItems.forEach(item => {
        const category = item.type;
        categoryCounts.set(category, (categoryCounts.get(category) || 0) + 1);
      });
      
      // Get top categories
      const topCategories = Array.from(categoryCounts.entries())
        .map(([category, count]) => ({ category, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);
      
      // Count unresolved alerts
      const alertsCount = await db.inventoryAlerts
        .where('isResolved')
        .equals(false)
        .count();
      
      return {
        totalProducts: allItems.length,
        lowStockProducts: lowStockCount,
        outOfStockProducts: outOfStockCount,
        excessStockProducts: excessStockCount,
        totalInventoryValue: totalValue,
        topCategories: topCategories,
        alertsCount: alertsCount
      };
    } catch (error) {
      console.error('Error calculating inventory metrics:', error);
      throw error;
    }
  },

  /**
   * Search inventory items
   */
  searchItems: async (searchTerm: string): Promise<LocalInventoryItem[]> => {
    try {
      const term = searchTerm.toLowerCase();
      return await db.inventoryItems
        .filter(item => 
          item.name.toLowerCase().includes(term) ||
          item.sku.toLowerCase().includes(term) ||
          item.description.toLowerCase().includes(term) ||
          (item.supplierName && item.supplierName.toLowerCase().includes(term))
        )
        .toArray();
    } catch (error) {
      console.error(`Error searching inventory items for "${searchTerm}":`, error);
      throw error;
    }
  },

  /**
   * Get pending work order demand for inventory item
   * (This would normally query work orders to see what's needed)
   */
  getItemDemand: async (itemId: number): Promise<number> => {
    try {
      // This is a simplified implementation
      // In a real app, this would calculate demand based on pending work orders
      // that require this inventory item
      
      // For now, we'll just return the reserved quantity
      const item = await db.inventoryItems.get(itemId);
      return item ? item.reservedQuantity : 0;
    } catch (error) {
      console.error(`Error calculating demand for item ${itemId}:`, error);
      throw error;
    }
  }
};

export default inventoryService; 