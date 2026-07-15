import { prisma } from '../config/database';

export async function getDashboardKPIs(filters: { type?: string; status?: string; region?: string }) {
  const vehicleWhere: Record<string, unknown> = {};
  if (filters.type) vehicleWhere.type = filters.type;
  if (filters.region) vehicleWhere.region = filters.region;

  const [
    totalVehicles,
    availableVehicles,
    inShopVehicles,
    onTripVehicles,
    retiredVehicles,
    activeTrips,
    pendingTrips,
    driversOnDuty,
    totalDrivers,
    monthlyRevenue,
    totalFuelCost,
    totalMaintenanceCost,
  ] = await Promise.all([
    prisma.vehicle.count({ where: vehicleWhere }),
    prisma.vehicle.count({ where: { ...vehicleWhere, status: 'AVAILABLE' } }),
    prisma.vehicle.count({ where: { ...vehicleWhere, status: 'IN_SHOP' } }),
    prisma.vehicle.count({ where: { ...vehicleWhere, status: 'ON_TRIP' } }),
    prisma.vehicle.count({ where: { ...vehicleWhere, status: 'RETIRED' } }),
    prisma.trip.count({ where: { status: 'DISPATCHED' } }),
    prisma.trip.count({ where: { status: 'DRAFT' } }),
    prisma.driver.count({ where: { status: 'ON_TRIP' } }),
    prisma.driver.count({ where: { status: { not: 'SUSPENDED' } } }),
    prisma.trip.aggregate({
      _sum: { revenue: true },
      where: {
        status: 'COMPLETED',
        endTime: { gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1) },
      },
    }),
    prisma.fuelLog.aggregate({ _sum: { cost: true } }),
    prisma.maintenance.aggregate({ _sum: { cost: true } }),
  ]);

  const fleetUtilization = totalVehicles > 0
    ? Math.round(((onTripVehicles + availableVehicles) / totalVehicles) * 100)
    : 0;

  return {
    totalVehicles,
    availableVehicles,
    inShopVehicles,
    onTripVehicles,
    retiredVehicles,
    activeTrips,
    pendingTrips,
    driversOnDuty,
    fleetUtilization,
    monthlyRevenue: monthlyRevenue._sum.revenue || 0,
    totalFuelCost: totalFuelCost._sum.cost || 0,
    totalMaintenanceCost: totalMaintenanceCost._sum.cost || 0,
  };
}

export async function getRecentTrips() {
  return prisma.trip.findMany({
    take: 10,
    orderBy: { createdAt: 'desc' },
    include: {
      vehicle: { select: { name: true, registrationNumber: true } },
      driver: { select: { name: true } },
    },
  });
}

export async function getVehicleStatusChart() {
  const counts = await prisma.vehicle.groupBy({
    by: ['status'],
    _count: { status: true },
  });

  return counts.map((c) => ({ status: c.status, count: c._count.status }));
}

export async function getMonthlyCharts() {
  // Last 6 months of trips and revenue
  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

  const trips = await prisma.trip.findMany({
    where: { createdAt: { gte: sixMonthsAgo } },
    select: { createdAt: true, status: true, revenue: true, fuelUsed: true },
    orderBy: { createdAt: 'asc' },
  });

  const fuelLogs = await prisma.fuelLog.findMany({
    where: { date: { gte: sixMonthsAgo } },
    select: { date: true, liters: true, cost: true },
    orderBy: { date: 'asc' },
  });

  // Group by month
  const monthlyData: Record<string, { month: string; trips: number; revenue: number; fuelCost: number; fuelLiters: number }> = {};

  trips.forEach((trip) => {
    const key = trip.createdAt.toISOString().substring(0, 7); // YYYY-MM
    if (!monthlyData[key]) monthlyData[key] = { month: key, trips: 0, revenue: 0, fuelCost: 0, fuelLiters: 0 };
    monthlyData[key].trips += 1;
    monthlyData[key].revenue += trip.revenue || 0;
  });

  fuelLogs.forEach((log) => {
    const key = log.date.toISOString().substring(0, 7);
    if (!monthlyData[key]) monthlyData[key] = { month: key, trips: 0, revenue: 0, fuelCost: 0, fuelLiters: 0 };
    monthlyData[key].fuelCost += log.cost;
    monthlyData[key].fuelLiters += log.liters;
  });

  return Object.values(monthlyData).sort((a, b) => a.month.localeCompare(b.month));
}

export async function getDriverStatusChart() {
  const counts = await prisma.driver.groupBy({
    by: ['status'],
    _count: { status: true },
  });

  return counts.map((c) => ({ status: c.status, count: c._count.status }));
}
