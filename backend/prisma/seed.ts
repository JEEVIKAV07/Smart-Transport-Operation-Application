import { PrismaClient, Role, VehicleType, VehicleStatus, DriverStatus, LicenseCategory, TripStatus } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding TransitOps database...');

  // ─── Users ───────────────────────────────────────────
  const hashedPassword = await bcrypt.hash('password123', 12);

  const admin = await prisma.user.upsert({
    where: { email: 'admin@transitops.in' },
    update: {},
    create: {
      name: 'Admin User',
      email: 'admin@transitops.in',
      password: hashedPassword,
      role: Role.ADMIN,
    },
  });

  const fleetManager = await prisma.user.upsert({
    where: { email: 'fleet@transitops.in' },
    update: {},
    create: {
      name: 'Raven K.',
      email: 'fleet@transitops.in',
      password: hashedPassword,
      role: Role.FLEET_MANAGER,
    },
  });

  await prisma.user.upsert({
    where: { email: 'driver@transitops.in' },
    update: {},
    create: {
      name: 'Driver User',
      email: 'driver@transitops.in',
      password: hashedPassword,
      role: Role.DRIVER,
    },
  });

  await prisma.user.upsert({
    where: { email: 'safety@transitops.in' },
    update: {},
    create: {
      name: 'Safety Officer',
      email: 'safety@transitops.in',
      password: hashedPassword,
      role: Role.SAFETY_OFFICER,
    },
  });

  await prisma.user.upsert({
    where: { email: 'finance@transitops.in' },
    update: {},
    create: {
      name: 'Financial Analyst',
      email: 'finance@transitops.in',
      password: hashedPassword,
      role: Role.FINANCIAL_ANALYST,
    },
  });

  console.log('✅ Users seeded');

  // ─── Vehicles ─────────────────────────────────────────
  const van05 = await prisma.vehicle.upsert({
    where: { registrationNumber: 'GJ01AB452' },
    update: {},
    create: {
      registrationNumber: 'GJ01AB452',
      name: 'VAN-05',
      model: 'Tata Ace',
      type: VehicleType.VAN,
      maxLoad: 500,
      odometer: 74000,
      acquisitionCost: 620000,
      purchaseDate: new Date('2021-03-15'),
      status: VehicleStatus.AVAILABLE,
      region: 'North',
    },
  });

  const truck11 = await prisma.vehicle.upsert({
    where: { registrationNumber: 'GJ01AB998' },
    update: {},
    create: {
      registrationNumber: 'GJ01AB998',
      name: 'TRUCK-11',
      model: 'Ashok Leyland Dost',
      type: VehicleType.TRUCK,
      maxLoad: 5000,
      odometer: 182000,
      acquisitionCost: 2450000,
      purchaseDate: new Date('2019-07-20'),
      status: VehicleStatus.AVAILABLE,
      region: 'South',
    },
  });

  const mini03 = await prisma.vehicle.upsert({
    where: { registrationNumber: 'GJ01AB120' },
    update: {},
    create: {
      registrationNumber: 'GJ01AB120',
      name: 'MINI-03',
      model: 'Mahindra Bolero Maxi',
      type: VehicleType.MINI,
      maxLoad: 1000,
      odometer: 66000,
      acquisitionCost: 410000,
      purchaseDate: new Date('2022-01-10'),
      status: VehicleStatus.IN_SHOP,
      region: 'East',
    },
  });

  await prisma.vehicle.upsert({
    where: { registrationNumber: 'GJ01AB008' },
    update: {},
    create: {
      registrationNumber: 'GJ01AB008',
      name: 'VAN-09',
      model: 'Force Traveller',
      type: VehicleType.VAN,
      maxLoad: 750,
      odometer: 241900,
      acquisitionCost: 590000,
      purchaseDate: new Date('2017-05-12'),
      status: VehicleStatus.RETIRED,
      region: 'West',
    },
  });

  await prisma.vehicle.upsert({
    where: { registrationNumber: 'GJ02BC301' },
    update: {},
    create: {
      registrationNumber: 'GJ02BC301',
      name: 'TRUCK-04',
      model: 'Eicher Pro 2049',
      type: VehicleType.TRUCK,
      maxLoad: 3000,
      odometer: 95000,
      acquisitionCost: 1800000,
      purchaseDate: new Date('2020-11-08'),
      status: VehicleStatus.AVAILABLE,
      region: 'North',
    },
  });

  console.log('✅ Vehicles seeded');

  // ─── Drivers ──────────────────────────────────────────
  const alex = await prisma.driver.upsert({
    where: { licenseNumber: 'DL-88213' },
    update: {},
    create: {
      name: 'Alex Kumar',
      licenseNumber: 'DL-88213',
      licenseCategory: LicenseCategory.LMV,
      licenseExpiry: new Date('2028-12-31'),
      phone: '9876500001',
      email: 'alex@transitops.in',
      address: 'Gandhinagar, Gujarat',
      safetyScore: 96,
      status: DriverStatus.AVAILABLE,
      emergencyContact: '9876500010',
    },
  });

  await prisma.driver.upsert({
    where: { licenseNumber: 'DL-44120' },
    update: {},
    create: {
      name: 'John Mathew',
      licenseNumber: 'DL-44120',
      licenseCategory: LicenseCategory.HMV,
      licenseExpiry: new Date('2025-03-31'),
      phone: '9822000002',
      email: 'john@transitops.in',
      address: 'Ahmedabad, Gujarat',
      safetyScore: 81,
      status: DriverStatus.SUSPENDED,
      emergencyContact: '9822000020',
    },
  });

  const priya = await prisma.driver.upsert({
    where: { licenseNumber: 'DL-77031' },
    update: {},
    create: {
      name: 'Priya Sharma',
      licenseNumber: 'DL-77031',
      licenseCategory: LicenseCategory.LMV,
      licenseExpiry: new Date('2027-08-15'),
      phone: '9911000003',
      email: 'priya@transitops.in',
      address: 'Surat, Gujarat',
      safetyScore: 99,
      status: DriverStatus.AVAILABLE,
      emergencyContact: '9911000030',
    },
  });

  await prisma.driver.upsert({
    where: { licenseNumber: 'DL-90045' },
    update: {},
    create: {
      name: 'Suresh Patel',
      licenseNumber: 'DL-90045',
      licenseCategory: LicenseCategory.HMV,
      licenseExpiry: new Date('2027-01-20'),
      phone: '9744000004',
      email: 'suresh@transitops.in',
      address: 'Vadodara, Gujarat',
      safetyScore: 88,
      status: DriverStatus.OFF_DUTY,
      emergencyContact: '9744000040',
    },
  });

  console.log('✅ Drivers seeded');

  // ─── Trips ────────────────────────────────────────────
  const trip1 = await prisma.trip.upsert({
    where: { tripNumber: 'TR001' },
    update: {},
    create: {
      tripNumber: 'TR001',
      source: 'Gandhinagar Depot',
      destination: 'Ahmedabad Hub',
      vehicleId: van05.id,
      driverId: alex.id,
      cargoWeight: 450,
      distance: 38,
      status: TripStatus.DISPATCHED,
      startTime: new Date(),
      revenue: 5000,
    },
  });

  await prisma.trip.upsert({
    where: { tripNumber: 'TR002' },
    update: {},
    create: {
      tripNumber: 'TR002',
      source: 'Vatva Industrial Area',
      destination: 'Sanand Warehouse',
      vehicleId: truck11.id,
      driverId: priya.id,
      cargoWeight: 2000,
      distance: 55,
      status: TripStatus.COMPLETED,
      startTime: new Date(Date.now() - 86400000 * 2),
      endTime: new Date(Date.now() - 86400000),
      fuelUsed: 110,
      revenue: 12000,
    },
  });

  await prisma.trip.upsert({
    where: { tripNumber: 'TR003' },
    update: {},
    create: {
      tripNumber: 'TR003',
      source: 'Mansa',
      destination: 'Kalol Depot',
      vehicleId: mini03.id,
      cargoWeight: 300,
      distance: 25,
      status: TripStatus.CANCELLED,
    },
  });

  await prisma.trip.upsert({
    where: { tripNumber: 'TR004' },
    update: {},
    create: {
      tripNumber: 'TR004',
      source: 'Naroda Depot',
      destination: 'Bavla Warehouse',
      vehicleId: van05.id,
      cargoWeight: 200,
      distance: 45,
      status: TripStatus.DRAFT,
    },
  });

  console.log('✅ Trips seeded');

  // ─── Maintenance ─────────────────────────────────────
  await prisma.maintenance.createMany({
    skipDuplicates: true,
    data: [
      {
        vehicleId: mini03.id,
        description: 'Routine oil change and filter replacement',
        serviceType: 'Oil Change',
        status: 'ACTIVE',
        startDate: new Date('2026-07-05'),
        cost: 2500,
      },
      {
        vehicleId: truck11.id,
        description: 'Engine repair and overhaul',
        serviceType: 'Engine Repair',
        status: 'COMPLETED',
        startDate: new Date('2026-06-01'),
        endDate: new Date('2026-06-15'),
        cost: 18000,
      },
    ],
  });

  console.log('✅ Maintenance seeded');

  // ─── Fuel Logs ───────────────────────────────────────
  await prisma.fuelLog.createMany({
    skipDuplicates: false,
    data: [
      {
        vehicleId: van05.id,
        tripId: trip1.id,
        liters: 42,
        cost: 3150,
        fuelStation: 'HP Fuel Station, Gandhinagar',
        date: new Date('2026-07-05'),
      },
      {
        vehicleId: truck11.id,
        liters: 110,
        cost: 8400,
        fuelStation: 'Indian Oil, Vatva',
        date: new Date('2026-07-06'),
      },
      {
        vehicleId: mini03.id,
        liters: 28,
        cost: 2050,
        fuelStation: 'BPCL, Mansa',
        date: new Date('2026-07-06'),
      },
    ],
  });

  console.log('✅ Fuel logs seeded');

  // ─── Expenses ─────────────────────────────────────────
  await prisma.expense.createMany({
    skipDuplicates: false,
    data: [
      {
        vehicleId: van05.id,
        tripId: trip1.id,
        category: 'TOLL',
        description: 'Expressway toll',
        amount: 120,
        date: new Date('2026-07-05'),
      },
      {
        vehicleId: truck11.id,
        category: 'TOLL',
        description: 'SH-17 toll charges',
        amount: 340,
        date: new Date('2026-07-06'),
      },
      {
        vehicleId: truck11.id,
        category: 'OTHER',
        description: 'Loading/unloading labour',
        amount: 150,
        date: new Date('2026-07-06'),
      },
    ],
  });

  console.log('✅ Expenses seeded');

  // ─── Notifications ────────────────────────────────────
  await prisma.notification.createMany({
    skipDuplicates: false,
    data: [
      {
        userId: fleetManager.id,
        title: 'License Expiry Warning',
        message: 'Driver John Mathew\'s license has expired (03/2025). Please take action.',
        type: 'LICENSE_EXPIRY',
        isRead: false,
      },
      {
        userId: fleetManager.id,
        title: 'Vehicle In Shop',
        message: 'MINI-03 has been moved to maintenance (Oil Change). It is now hidden from dispatch.',
        type: 'MAINTENANCE_DUE',
        isRead: false,
      },
      {
        userId: admin.id,
        title: 'System Ready',
        message: 'TransitOps has been initialized successfully.',
        type: 'SYSTEM',
        isRead: true,
      },
    ],
  });

  console.log('✅ Notifications seeded');
  console.log('\n🎉 Database seeded successfully!');
  console.log('\n📋 Login credentials:');
  console.log('   Admin:             admin@transitops.in / password123');
  console.log('   Fleet Manager:     fleet@transitops.in / password123');
  console.log('   Driver:            driver@transitops.in / password123');
  console.log('   Safety Officer:    safety@transitops.in / password123');
  console.log('   Financial Analyst: finance@transitops.in / password123');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
