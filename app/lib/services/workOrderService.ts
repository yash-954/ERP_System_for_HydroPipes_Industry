import { db, LocalWorkOrder, LocalWorkOrderAssembly, LocalSpecification, LocalStatusChange } from '../db/localDb';
import { WorkOrderStatus, PriorityLevel } from '../../models/WorkOrder';

// Service for handling work order operations
export const workOrderService = {
  // Get all work orders
  getAll: async (): Promise<LocalWorkOrder[]> => {
    try {
      return await db.workOrders.toArray();
    } catch (error) {
      console.error('Error fetching work orders:', error);
      throw error;
    }
  },

  // Get work order by ID
  getById: async (id: number): Promise<LocalWorkOrder | undefined> => {
    try {
      return await db.workOrders.get(id);
    } catch (error) {
      console.error(`Error fetching work order ${id}:`, error);
      throw error;
    }
  },

  // Get work orders by status
  getByStatus: async (status: WorkOrderStatus): Promise<LocalWorkOrder[]> => {
    try {
      return await db.workOrders.where('status').equals(status).toArray();
    } catch (error) {
      console.error(`Error fetching work orders with status ${status}:`, error);
      throw error;
    }
  },

  // Get work orders by customer
  getByCustomer: async (customerId: number): Promise<LocalWorkOrder[]> => {
    try {
      return await db.workOrders.where('customerId').equals(customerId).toArray();
    } catch (error) {
      console.error(`Error fetching work orders for customer ${customerId}:`, error);
      throw error;
    }
  },

  // Get work orders assigned to user
  getByAssignedUser: async (userId: number): Promise<LocalWorkOrder[]> => {
    try {
      // This is a more complex query as we need to check an array field
      const allWorkOrders = await db.workOrders.toArray();
      return allWorkOrders.filter(wo => 
        wo.assignedUsers && wo.assignedUsers.includes(userId)
      );
    } catch (error) {
      console.error(`Error fetching work orders assigned to user ${userId}:`, error);
      throw error;
    }
  },

  // Get work orders with due date in range
  getByDueDateRange: async (startDate: Date, endDate: Date): Promise<LocalWorkOrder[]> => {
    try {
      return await db.workOrders
        .where('dueDate')
        .between(startDate, endDate)
        .toArray();
    } catch (error) {
      console.error(`Error fetching work orders by due date range:`, error);
      throw error;
    }
  },

  // Get counts by status
  getCountsByStatus: async (): Promise<Record<WorkOrderStatus, number>> => {
    try {
      const allWorkOrders = await db.workOrders.toArray();
      
      const counts: Record<WorkOrderStatus, number> = {
        [WorkOrderStatus.DRAFT]: 0,
        [WorkOrderStatus.PENDING]: 0,
        [WorkOrderStatus.IN_PROGRESS]: 0,
        [WorkOrderStatus.ON_HOLD]: 0,
        [WorkOrderStatus.COMPLETED]: 0,
        [WorkOrderStatus.DELIVERED]: 0,
        [WorkOrderStatus.CANCELLED]: 0
      };
      
      allWorkOrders.forEach(wo => {
        counts[wo.status]++;
      });
      
      return counts;
    } catch (error) {
      console.error('Error getting work order counts by status:', error);
      throw error;
    }
  },

  // Create a new work order
  create: async (workOrderData: Omit<LocalWorkOrder, 'id' | 'createdAt' | 'updatedAt'> & { assignedToId?: number; assignedToName?: string; }, assemblies: any[] = []): Promise<number> => {
    try {
      // Generate unique order number if not provided
      if (!workOrderData.orderNumber) {
        workOrderData.orderNumber = await workOrderService.generateOrderNumber();
      }
      
      // Initialize totalQuantity and completedQuantity if not set
      let totalQty = workOrderData.totalQuantity || 0;
      
      // Calculate total quantity from assemblies if provided
      if (assemblies && assemblies.length > 0) {
        totalQty = assemblies.reduce((sum, assembly) => sum + assembly.quantity, 0);
      }
      
      // Create the work order with calculated values
      const workOrder = {
        ...workOrderData,
        totalQuantity: totalQty,
        completedQuantity: workOrderData.completedQuantity || 0,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      // Create the work order
      const id = await db.workOrders.add(workOrder);

      // Add assemblies if provided
      if (assemblies && assemblies.length > 0) {
        const assembliesToAdd = assemblies.map(assembly => ({
          workOrderId: id,
          name: assembly.name,
          partCode: assembly.partCode || '',
          description: assembly.description || '',
          quantity: assembly.quantity,
          completedQuantity: assembly.completed || 0
        }));
        
        // Add all assemblies
        await db.workOrderAssemblies.bulkAdd(assembliesToAdd);
      }

      // Record the initial status change
      await db.statusChanges.add({
        workOrderId: id,
        previousStatus: WorkOrderStatus.DRAFT, // Assumed initial status
        newStatus: workOrderData.status,
        changedBy: workOrderData.createdBy,
        reason: 'Work order created',
        timestamp: new Date()
      });

      return id;
    } catch (error) {
      console.error('Error creating work order:', error);
      throw error;
    }
  },

  // Update a work order
  update: async (id: number, workOrderData: Partial<Omit<LocalWorkOrder, 'id' | 'createdAt' | 'updatedAt'>>): Promise<number> => {
    try {
      // Check if status is being updated
      if (workOrderData.status) {
        const currentWorkOrder = await db.workOrders.get(id);
        
        if (currentWorkOrder && currentWorkOrder.status !== workOrderData.status) {
          // Record the status change
          await db.statusChanges.add({
            workOrderId: id,
            previousStatus: currentWorkOrder.status,
            newStatus: workOrderData.status,
            changedBy: workOrderData.createdBy || 0, // Fallback if not provided
            timestamp: new Date()
          });
        }
      }
      
      // Ensure we don't overwrite the createdAt date
      const { createdAt, ...dataToUpdate } = workOrderData as any;
      
      // Update the work order
      await db.workOrders.update(id, {
        ...dataToUpdate,
        updatedAt: new Date()
      });

      return id;
    } catch (error) {
      console.error(`Error updating work order ${id}:`, error);
      throw error;
    }
  },

  // Delete a work order
  delete: async (id: number): Promise<void> => {
    try {
      // Start a transaction to delete related data
      await db.transaction('rw', [
        db.workOrders, 
        db.workOrderAssemblies, 
        db.specifications, 
        db.statusChanges
      ], async () => {
        // Get all assemblies for this work order
        const assemblies = await db.workOrderAssemblies
          .where('workOrderId')
          .equals(id)
          .toArray();
        
        // Delete specifications for each assembly
        for (const assembly of assemblies) {
          if (assembly.id) {
            await db.specifications
              .where('assemblyId')
              .equals(assembly.id)
              .delete();
          }
        }
        
        // Delete assemblies
        await db.workOrderAssemblies
          .where('workOrderId')
          .equals(id)
          .delete();
        
        // Delete status changes
        await db.statusChanges
          .where('workOrderId')
          .equals(id)
          .delete();
        
        // Delete the work order
        await db.workOrders.delete(id);
      });
    } catch (error) {
      console.error(`Error deleting work order ${id}:`, error);
      throw error;
    }
  },

  // Create or update an assembly for a work order
  saveAssembly: async (
    workOrderId: number, 
    assemblyData: Omit<LocalWorkOrderAssembly, 'id'>,
    specifications?: Omit<LocalSpecification, 'id' | 'assemblyId'>[]
  ): Promise<number> => {
    try {
      // Check if the work order exists
      const workOrder = await db.workOrders.get(workOrderId);
      if (!workOrder) {
        throw new Error(`Work order with ID ${workOrderId} not found`);
      }
      
      // Create or update the assembly
      let assemblyId: number;
      
      if (assemblyData.id) {
        // Update existing assembly
        await db.workOrderAssemblies.update(assemblyData.id, assemblyData);
        assemblyId = assemblyData.id;
      } else {
        // Create new assembly
        assemblyId = await db.workOrderAssemblies.add({
          ...assemblyData,
          workOrderId
        });
      }
      
      // Add specifications if provided
      if (specifications && specifications.length > 0) {
        // Delete existing specifications
        await db.specifications
          .where('assemblyId')
          .equals(assemblyId)
          .delete();
        
        // Add new specifications
        for (const spec of specifications) {
          await db.specifications.add({
            ...spec,
            assemblyId
          });
        }
      }
      
      return assemblyId;
    } catch (error) {
      console.error(`Error saving assembly for work order ${workOrderId}:`, error);
      throw error;
    }
  },

  // Get assemblies for a work order
  getAssemblies: async (workOrderId: number): Promise<LocalWorkOrderAssembly[]> => {
    try {
      return await db.workOrderAssemblies
        .where('workOrderId')
        .equals(workOrderId)
        .toArray();
    } catch (error) {
      console.error(`Error fetching assemblies for work order ${workOrderId}:`, error);
      throw error;
    }
  },

  // Get specifications for an assembly
  getSpecifications: async (assemblyId: number): Promise<LocalSpecification[]> => {
    try {
      return await db.specifications
        .where('assemblyId')
        .equals(assemblyId)
        .toArray();
    } catch (error) {
      console.error(`Error fetching specifications for assembly ${assemblyId}:`, error);
      throw error;
    }
  },

  // Update work order progress
  updateProgress: async (
    workOrderId: number, 
    assemblyId: number, 
    completedQuantity: number
  ): Promise<void> => {
    try {
      // Update the assembly progress
      await db.workOrderAssemblies.update(assemblyId, { 
        completedQuantity 
      });
      
      // Recalculate the total progress for the work order
      const assemblies = await workOrderService.getAssemblies(workOrderId);
      
      let totalQuantity = 0;
      let totalCompleted = 0;
      
      assemblies.forEach(assembly => {
        totalQuantity += assembly.quantity;
        totalCompleted += assembly.completedQuantity;
      });
      
      // Update the work order with new progress
      await db.workOrders.update(workOrderId, {
        totalQuantity,
        completedQuantity: totalCompleted,
        updatedAt: new Date()
      });
      
      // Check if all assemblies are completed
      const allCompleted = assemblies.every(
        assembly => assembly.completedQuantity >= assembly.quantity
      );
      
      // If all completed, update the status if not already completed
      if (allCompleted) {
        const workOrder = await db.workOrders.get(workOrderId);
        
        if (workOrder && 
            workOrder.status !== WorkOrderStatus.COMPLETED && 
            workOrder.status !== WorkOrderStatus.DELIVERED &&
            workOrder.status !== WorkOrderStatus.CANCELLED) {
          
          await workOrderService.update(workOrderId, {
            status: WorkOrderStatus.COMPLETED,
            completedDate: new Date()
          });
        }
      }
    } catch (error) {
      console.error(`Error updating progress for work order ${workOrderId}:`, error);
      throw error;
    }
  },

  // Get status change history for a work order
  getStatusHistory: async (workOrderId: number): Promise<LocalStatusChange[]> => {
    try {
      return await db.statusChanges
        .where('workOrderId')
        .equals(workOrderId)
        .sortBy('timestamp');
    } catch (error) {
      console.error(`Error fetching status history for work order ${workOrderId}:`, error);
      throw error;
    }
  },

  // Search work orders by various criteria
  search: async (searchCriteria: {
    orderNumber?: string;
    customerName?: string;
    status?: WorkOrderStatus[];
    priority?: PriorityLevel[];
    startDateFrom?: Date;
    startDateTo?: Date;
    dueDateFrom?: Date;
    dueDateTo?: Date;
    assignedUser?: number;
  }): Promise<LocalWorkOrder[]> => {
    try {
      let results = await db.workOrders.toArray();
      
      // Filter by order number
      if (searchCriteria.orderNumber) {
        results = results.filter(wo => 
          wo.orderNumber.toLowerCase().includes(searchCriteria.orderNumber!.toLowerCase())
        );
      }
      
      // Filter by customer name
      if (searchCriteria.customerName) {
        results = results.filter(wo => 
          wo.customerName?.toLowerCase().includes(searchCriteria.customerName!.toLowerCase())
        );
      }
      
      // Filter by status
      if (searchCriteria.status && searchCriteria.status.length > 0) {
        results = results.filter(wo => 
          searchCriteria.status!.includes(wo.status)
        );
      }
      
      // Filter by priority
      if (searchCriteria.priority && searchCriteria.priority.length > 0) {
        results = results.filter(wo => 
          searchCriteria.priority!.includes(wo.priority)
        );
      }
      
      // Filter by start date range
      if (searchCriteria.startDateFrom || searchCriteria.startDateTo) {
        results = results.filter(wo => {
          if (searchCriteria.startDateFrom && wo.startDate < searchCriteria.startDateFrom) {
            return false;
          }
          if (searchCriteria.startDateTo && wo.startDate > searchCriteria.startDateTo) {
            return false;
          }
          return true;
        });
      }
      
      // Filter by due date range
      if (searchCriteria.dueDateFrom || searchCriteria.dueDateTo) {
        results = results.filter(wo => {
          if (searchCriteria.dueDateFrom && wo.dueDate < searchCriteria.dueDateFrom) {
            return false;
          }
          if (searchCriteria.dueDateTo && wo.dueDate > searchCriteria.dueDateTo) {
            return false;
          }
          return true;
        });
      }
      
      // Filter by assigned user
      if (searchCriteria.assignedUser) {
        results = results.filter(wo => 
          wo.assignedUsers && wo.assignedUsers.includes(searchCriteria.assignedUser!)
        );
      }
      
      return results;
    } catch (error) {
      console.error('Error searching work orders:', error);
      throw error;
    }
  },

  // Generate a unique order number
  generateOrderNumber: async (): Promise<string> => {
    try {
      const date = new Date();
      const year = date.getFullYear().toString().slice(-2);
      const month = (date.getMonth() + 1).toString().padStart(2, '0');
      
      // Get count of work orders to use as sequence
      const count = await db.workOrders.count();
      const sequence = (count + 1).toString().padStart(4, '0');
      
      return `WO${year}${month}-${sequence}`;
    } catch (error) {
      console.error('Error generating work order number:', error);
      throw error;
    }
  }
};

export default workOrderService; 