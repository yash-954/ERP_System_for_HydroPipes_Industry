import { db } from './localDb';
import { WorkOrderStatus, PriorityLevel, ISpecification } from '../../models/WorkOrder';

// Function to seed work orders
export async function seedWorkOrders() {
  try {
    // Check if we already have work orders
    const workOrderCount = await db.workOrders.count();
    if (workOrderCount > 0) {
      console.log(`Found ${workOrderCount} existing work orders, skipping seed process`);
      return false;
    }

    console.log('Seeding work orders...');

    // Get customer IDs
    const customers = await db.customers.toArray();
    if (customers.length === 0) {
      console.error('No customers found. Please seed customers first.');
      return false;
    }

    // Get user IDs
    const users = await db.users.toArray();
    if (users.length === 0) {
      console.error('No users found. Please seed users first.');
      return false;
    }

    const adminUser = users.find(user => user.role === 'admin');
    const managerUser = users.find(user => user.role === 'manager');
    const basicUser = users.find(user => user.role === 'basic');

    if (!adminUser?.id || !managerUser?.id || !basicUser?.id) {
      console.error('Could not find all required user types.');
      return false;
    }

    // Create sample work orders
    const workOrders = [
      {
        orderNumber: 'WO2324-0001',
        customerId: customers[0].id!,
        customerName: customers[0].name,
        description: 'Manufacturing of custom hydraulic cylinders for industrial presses',
        priority: PriorityLevel.HIGH,
        status: WorkOrderStatus.IN_PROGRESS,
        startDate: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000), // 10 days ago
        dueDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000), // 5 days from now
        notes: 'Customer requires pressure testing certification before shipping',
        assignedUsers: [managerUser.id, basicUser.id],
        totalQuantity: 20,
        completedQuantity: 12,
        createdBy: adminUser.id,
        createdAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000), // 15 days ago
        updatedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000) // 2 days ago
      },
      {
        orderNumber: 'WO2324-0002',
        customerId: customers[1].id!,
        customerName: customers[1].name,
        description: 'Repair and maintenance of hydraulic power pack system',
        priority: PriorityLevel.URGENT,
        status: WorkOrderStatus.PENDING,
        startDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
        dueDate: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000), // 1 day from now
        notes: 'Customer's production line is down. Expedite this order.',
        assignedUsers: [adminUser.id, managerUser.id],
        totalQuantity: 1,
        completedQuantity: 0,
        createdBy: adminUser.id,
        createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
        updatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000) // 1 day ago
      },
      {
        orderNumber: 'WO2324-0003',
        customerId: customers[0].id!,
        customerName: customers[0].name,
        description: 'Assembly of standard hydraulic valve blocks',
        priority: PriorityLevel.MEDIUM,
        status: WorkOrderStatus.COMPLETED,
        startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
        dueDate: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000), // 15 days ago
        completedDate: new Date(Date.now() - 17 * 24 * 60 * 60 * 1000), // 17 days ago
        notes: 'Completed ahead of schedule. Ready for dispatch.',
        assignedUsers: [basicUser.id],
        totalQuantity: 50,
        completedQuantity: 50,
        createdBy: managerUser.id,
        createdAt: new Date(Date.now() - 35 * 24 * 60 * 60 * 1000), // 35 days ago
        updatedAt: new Date(Date.now() - 17 * 24 * 60 * 60 * 1000) // 17 days ago
      },
      {
        orderNumber: 'WO2324-0004',
        customerId: customers[1].id!,
        customerName: customers[1].name,
        description: 'Manufacturing of custom hydraulic manifold blocks',
        priority: PriorityLevel.LOW,
        status: WorkOrderStatus.DRAFT,
        startDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000), // 5 days from now
        dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
        notes: 'Awaiting final approval from customer on design specifications',
        assignedUsers: [],
        totalQuantity: 10,
        completedQuantity: 0,
        createdBy: managerUser.id,
        createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1 day ago
        updatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000) // 1 day ago
      },
      {
        orderNumber: 'WO2324-0005',
        customerId: customers[0].id!,
        customerName: customers[0].name,
        description: 'Testing and calibration of hydraulic test equipment',
        priority: PriorityLevel.MEDIUM,
        status: WorkOrderStatus.ON_HOLD,
        startDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // 5 days ago
        dueDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000), // 10 days from now
        notes: 'On hold pending receipt of calibration tools from supplier',
        assignedUsers: [basicUser.id],
        totalQuantity: 5,
        completedQuantity: 2,
        createdBy: adminUser.id,
        createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 days ago
        updatedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000) // 2 days ago
      },
      {
        orderNumber: 'WO2324-0006',
        customerId: customers[1].id!,
        customerName: customers[1].name,
        description: 'Machining of custom hydraulic fittings',
        priority: PriorityLevel.MEDIUM,
        status: WorkOrderStatus.IN_PROGRESS,
        startDate: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000), // 8 days ago
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
        notes: 'Special material requirements - using 316 stainless steel',
        assignedUsers: [basicUser.id, managerUser.id],
        totalQuantity: 100,
        completedQuantity: 35,
        createdBy: adminUser.id,
        createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000), // 10 days ago
        updatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000) // 1 day ago
      },
      {
        orderNumber: 'WO2324-0007',
        customerId: customers[0].id!,
        customerName: customers[0].name,
        description: 'Assembly and testing of hydraulic power units',
        priority: PriorityLevel.HIGH,
        status: WorkOrderStatus.DELIVERED,
        startDate: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000), // 45 days ago
        dueDate: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000), // 15 days ago
        completedDate: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000), // 20 days ago
        notes: 'Delivered to customer. Warranty period: 1 year from delivery date.',
        assignedUsers: [managerUser.id, basicUser.id],
        totalQuantity: 3,
        completedQuantity: 3,
        createdBy: adminUser.id,
        createdAt: new Date(Date.now() - 50 * 24 * 60 * 60 * 1000), // 50 days ago
        updatedAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000) // 15 days ago
      },
      {
        orderNumber: 'WO2324-0008',
        customerId: customers[1].id!,
        customerName: customers[1].name,
        description: 'Design and fabrication of custom hydraulic system for steel mill',
        priority: PriorityLevel.URGENT,
        status: WorkOrderStatus.IN_PROGRESS,
        startDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 days ago
        dueDate: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000), // 21 days from now
        notes: 'High-temperature application. Using special seals and fluids.',
        assignedUsers: [adminUser.id, managerUser.id, basicUser.id],
        totalQuantity: 1,
        completedQuantity: 0,
        createdBy: managerUser.id,
        createdAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000), // 14 days ago
        updatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000) // 1 day ago
      }
    ];

    // Add each work order and track the IDs
    const workOrderIds: number[] = [];
    for (const workOrder of workOrders) {
      const id = await db.workOrders.add(workOrder);
      workOrderIds.push(id);
      console.log(`Created work order with ID: ${id}`);

      // Add initial status change
      await db.statusChanges.add({
        workOrderId: id,
        previousStatus: WorkOrderStatus.DRAFT,
        newStatus: workOrder.status,
        changedBy: workOrder.createdBy,
        reason: 'Work order created',
        timestamp: workOrder.createdAt
      });

      // If the status is not DRAFT, add an additional status change
      if (workOrder.status !== WorkOrderStatus.DRAFT) {
        await db.statusChanges.add({
          workOrderId: id,
          previousStatus: WorkOrderStatus.DRAFT,
          newStatus: workOrder.status,
          changedBy: workOrder.createdBy,
          reason: `Status updated to ${workOrder.status}`,
          timestamp: workOrder.updatedAt
        });
      }
    }

    // Define assemblies for work orders
    const assemblies = [
      // For Work Order 1
      {
        workOrderId: workOrderIds[0],
        name: 'Hydraulic Cylinder A-Series',
        partCode: 'HC-A-50-200',
        quantity: 10,
        completedQuantity: 7
      },
      {
        workOrderId: workOrderIds[0],
        name: 'Hydraulic Cylinder B-Series',
        partCode: 'HC-B-50-200',
        quantity: 10,
        completedQuantity: 5
      },
      // For Work Order 2
      {
        workOrderId: workOrderIds[1],
        name: 'Power Pack Repair Unit',
        partCode: 'PP-REP-001',
        quantity: 1,
        completedQuantity: 0
      },
      // For Work Order 3
      {
        workOrderId: workOrderIds[2],
        name: 'Standard Valve Block',
        partCode: 'VB-STD-001',
        quantity: 50,
        completedQuantity: 50
      },
      // For Work Order 4
      {
        workOrderId: workOrderIds[3],
        name: 'Custom Manifold Block',
        partCode: 'MB-CUS-001',
        quantity: 10,
        completedQuantity: 0
      },
      // For Work Order 5
      {
        workOrderId: workOrderIds[4],
        name: 'Test Equipment Set',
        partCode: 'TE-001',
        quantity: 5,
        completedQuantity: 2
      },
      // For Work Order 6
      {
        workOrderId: workOrderIds[5],
        name: 'Stainless Steel Fitting Set A',
        partCode: 'SSF-A-001',
        quantity: 50,
        completedQuantity: 20
      },
      {
        workOrderId: workOrderIds[5],
        name: 'Stainless Steel Fitting Set B',
        partCode: 'SSF-B-001',
        quantity: 50,
        completedQuantity: 15
      },
      // For Work Order 7
      {
        workOrderId: workOrderIds[6],
        name: 'Hydraulic Power Unit 50HP',
        partCode: 'HPU-50-001',
        quantity: 2,
        completedQuantity: 2
      },
      {
        workOrderId: workOrderIds[6],
        name: 'Hydraulic Power Unit 75HP',
        partCode: 'HPU-75-001',
        quantity: 1,
        completedQuantity: 1
      },
      // For Work Order 8
      {
        workOrderId: workOrderIds[7],
        name: 'Custom Steel Mill System',
        partCode: 'SMS-CUS-001',
        quantity: 1,
        completedQuantity: 0
      }
    ];

    // Add assemblies and track their IDs
    const assemblyIds: number[] = [];
    for (const assembly of assemblies) {
      const id = await db.workOrderAssemblies.add(assembly);
      assemblyIds.push(id);
      console.log(`Created assembly with ID: ${id}`);
    }

    // Define specifications for assemblies
    const specifications: Array<ISpecification & { assemblyId: number }> = [
      // For Assembly 1 (Hydraulic Cylinder A-Series)
      {
        assemblyId: assemblyIds[0],
        name: 'Bore',
        value: '50',
        unit: 'mm'
      },
      {
        assemblyId: assemblyIds[0],
        name: 'Stroke',
        value: '200',
        unit: 'mm'
      },
      {
        assemblyId: assemblyIds[0],
        name: 'Operating Pressure',
        value: '210',
        unit: 'bar'
      },
      {
        assemblyId: assemblyIds[0],
        name: 'Material',
        value: 'ST52',
        unit: ''
      },
      // For Assembly 2 (Hydraulic Cylinder B-Series)
      {
        assemblyId: assemblyIds[1],
        name: 'Bore',
        value: '50',
        unit: 'mm'
      },
      {
        assemblyId: assemblyIds[1],
        name: 'Stroke',
        value: '200',
        unit: 'mm'
      },
      {
        assemblyId: assemblyIds[1],
        name: 'Operating Pressure',
        value: '250',
        unit: 'bar'
      },
      {
        assemblyId: assemblyIds[1],
        name: 'Material',
        value: 'Stainless Steel 304',
        unit: ''
      },
      // For Assembly 3 (Power Pack Repair Unit)
      {
        assemblyId: assemblyIds[2],
        name: 'Pump Flow',
        value: '50',
        unit: 'LPM'
      },
      {
        assemblyId: assemblyIds[2],
        name: 'Motor Power',
        value: '15',
        unit: 'kW'
      },
      {
        assemblyId: assemblyIds[2],
        name: 'Tank Capacity',
        value: '100',
        unit: 'L'
      },
      // For Assembly 4 (Standard Valve Block)
      {
        assemblyId: assemblyIds[3],
        name: 'Number of Stations',
        value: '4',
        unit: ''
      },
      {
        assemblyId: assemblyIds[3],
        name: 'Max Pressure',
        value: '350',
        unit: 'bar'
      },
      // For Assembly 5 (Custom Manifold Block)
      {
        assemblyId: assemblyIds[4],
        name: 'Dimensions',
        value: '250 x 150 x 100',
        unit: 'mm'
      },
      {
        assemblyId: assemblyIds[4],
        name: 'Material',
        value: 'Aluminum 6082-T6',
        unit: ''
      },
      {
        assemblyId: assemblyIds[4],
        name: 'Number of Ports',
        value: '12',
        unit: ''
      },
      // For Assembly 9 (Hydraulic Power Unit 50HP)
      {
        assemblyId: assemblyIds[8],
        name: 'Power',
        value: '50',
        unit: 'HP'
      },
      {
        assemblyId: assemblyIds[8],
        name: 'Flow Rate',
        value: '80',
        unit: 'LPM'
      },
      {
        assemblyId: assemblyIds[8],
        name: 'Pressure Rating',
        value: '280',
        unit: 'bar'
      },
      // For Assembly 10 (Hydraulic Power Unit 75HP)
      {
        assemblyId: assemblyIds[9],
        name: 'Power',
        value: '75',
        unit: 'HP'
      },
      {
        assemblyId: assemblyIds[9],
        name: 'Flow Rate',
        value: '120',
        unit: 'LPM'
      },
      {
        assemblyId: assemblyIds[9],
        name: 'Pressure Rating',
        value: '300',
        unit: 'bar'
      },
      // For Assembly 11 (Custom Steel Mill System)
      {
        assemblyId: assemblyIds[10],
        name: 'Operating Temperature',
        value: '60-120',
        unit: '°C'
      },
      {
        assemblyId: assemblyIds[10],
        name: 'System Pressure',
        value: '420',
        unit: 'bar'
      },
      {
        assemblyId: assemblyIds[10],
        name: 'Flow Capacity',
        value: '200',
        unit: 'LPM'
      },
      {
        assemblyId: assemblyIds[10],
        name: 'Cooling Capacity',
        value: '75',
        unit: 'kW'
      }
    ];

    // Add specifications
    for (const spec of specifications) {
      await db.specifications.add(spec);
    }

    console.log(`Successfully seeded ${workOrders.length} work orders with ${assemblies.length} assemblies and ${specifications.length} specifications`);
    return true;
  } catch (error) {
    console.error('Error seeding work orders:', error);
    return false;
  }
}

export default seedWorkOrders; 