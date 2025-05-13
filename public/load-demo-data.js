// Simple script to inject demo work order data
// To use: Copy paste this code into the browser console while on the app

(async function() {
  // Define work order status types and priority levels
  const WorkOrderStatus = {
    DRAFT: "draft",
    PENDING: "pending",
    IN_PROGRESS: "in-progress",
    ON_HOLD: "on-hold", 
    COMPLETED: "completed",
    DELIVERED: "delivered",
    CANCELLED: "cancelled"
  };

  const PriorityLevel = {
    LOW: "low",
    MEDIUM: "medium",
    HIGH: "high",
    URGENT: "urgent"
  };

  // Check if Dexie is available in the app
  if (typeof Dexie === 'undefined') {
    console.error('Dexie not found. This script should be run in the ERP application.');
    return;
  }

  // Initialize the database connection
  const db = new Dexie('ERP_Database');

  // Define database schema
  db.version(1).stores({
    users: '++id, email, role, organizationId',
    organizations: '++id, name, code',
    customers: '++id, name, email, phone, address',
    workOrders: '++id, orderNumber, customerId, status, priority, dueDate, createdBy',
    workOrderAssemblies: '++id, workOrderId, name, partCode',
    specifications: '++id, assemblyId, name, value, unit',
    statusChanges: '++id, workOrderId, previousStatus, newStatus, changedBy'
  });

  try {
    // Check if we already have work orders
    const workOrderCount = await db.workOrders.count();
    if (workOrderCount > 0) {
      console.log(`Found ${workOrderCount} existing work orders, skipping seed process`);
      return false;
    }

    console.log('Seeding work orders...');

    // Get customer IDs or create sample customers if none exist
    let customers = await db.customers.toArray();
    if (customers.length === 0) {
      console.log('No customers found. Creating sample customers...');
      const customerIds = await db.customers.bulkAdd([
        { name: 'HydroTech Industries', email: 'contact@hydrotech.com', phone: '9876543210', address: 'Delhi, India' },
        { name: 'FluidPower Solutions', email: 'info@fluidpower.com', phone: '8765432109', address: 'Mumbai, India' }
      ], { allKeys: true });
      
      customers = await db.customers.bulkGet(customerIds);
      console.log('Created sample customers');
    }

    // Create some users if none exist
    let users = await db.users.toArray();
    if (users.length === 0) {
      console.log('No users found. Creating sample users...');
      const userIds = await db.users.bulkAdd([
        { name: 'Admin User', email: 'admin@example.com', role: 'admin', password: 'hashed_password' },
        { name: 'Manager User', email: 'manager@example.com', role: 'manager', password: 'hashed_password' },
        { name: 'Basic User', email: 'user@example.com', role: 'basic', password: 'hashed_password' }
      ], { allKeys: true });
      
      users = await db.users.bulkGet(userIds);
      console.log('Created sample users');
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
        customerId: customers[0].id,
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
        customerId: customers[1].id,
        customerName: customers[1].name,
        description: 'Repair and maintenance of hydraulic power pack system',
        priority: PriorityLevel.URGENT,
        status: WorkOrderStatus.PENDING,
        startDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
        dueDate: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000), // 1 day from now
        notes: 'Customer\'s production line is down. Expedite this order.',
        assignedUsers: [adminUser.id, managerUser.id],
        totalQuantity: 1,
        completedQuantity: 0,
        createdBy: adminUser.id,
        createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
        updatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000) // 1 day ago
      },
      {
        orderNumber: 'WO2324-0003',
        customerId: customers[0].id,
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
        customerId: customers[1].id,
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
        customerId: customers[0].id,
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
      }
    ];

    // Add each work order and track the IDs
    const workOrderIds = [];
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
      }
    ];

    // Add assemblies and track their IDs
    const assemblyIds = [];
    for (const assembly of assemblies) {
      const id = await db.workOrderAssemblies.add(assembly);
      assemblyIds.push(id);
      console.log(`Created assembly with ID: ${id}`);
    }

    // Define specifications for assemblies
    const specifications = [
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
      }
    ];

    // Add specifications
    for (const spec of specifications) {
      await db.specifications.add(spec);
    }

    console.log(`Successfully seeded ${workOrders.length} work orders with ${assemblies.length} assemblies and ${specifications.length} specifications`);
    console.log('Refresh the page to see the data!');
    return true;
  } catch (error) {
    console.error('Error seeding work orders:', error);
    return false;
  }
})(); 