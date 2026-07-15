import { prisma } from '../config/database';

export async function getFleetUtilizationReport() {
  const vehicles = await prisma.vehicle.findMany({
    include: {
      trips: {
        where: { status: 'COMPLETED' },
        select: { distance: true, revenue: true, fuelUsed: true, startTime: true, endTime: true },
      },
      fuelLogs: { select: { liters: true, cost: true } },
      maintenance: { select: { cost: true } },
    },
  });

  return vehicles.map((vehicle) => {
    const totalDistance = vehicle.trips.reduce((s, t) => s + t.distance, 0);
    const totalRevenue = vehicle.trips.reduce((s, t) => s + (t.revenue || 0), 0);
    const totalFuelLiters = vehicle.fuelLogs.reduce((s, f) => s + f.liters, 0);
    const totalFuelCost = vehicle.fuelLogs.reduce((s, f) => s + f.cost, 0);
    const totalMaintenanceCost = vehicle.maintenance.reduce((s, m) => s + m.cost, 0);
    const fuelEfficiency = totalFuelLiters > 0 ? totalDistance / totalFuelLiters : 0;
    const roi = vehicle.acquisitionCost > 0
      ? ((totalRevenue - (totalMaintenanceCost + totalFuelCost)) / vehicle.acquisitionCost) * 100
      : 0;

    return {
      vehicleId: vehicle.id,
      name: vehicle.name,
      registrationNumber: vehicle.registrationNumber,
      type: vehicle.type,
      status: vehicle.status,
      totalTrips: vehicle.trips.length,
      totalDistance,
      totalRevenue,
      totalFuelLiters,
      totalFuelCost,
      totalMaintenanceCost,
      totalOperationalCost: totalFuelCost + totalMaintenanceCost,
      fuelEfficiency: Math.round(fuelEfficiency * 100) / 100,
      roi: Math.round(roi * 100) / 100,
      acquisitionCost: vehicle.acquisitionCost,
    };
  });
}

export async function getOperationalCostReport(dateFrom?: string, dateTo?: string) {
  const dateFilter: Record<string, Date> = {};
  if (dateFrom) dateFilter.gte = new Date(dateFrom);
  if (dateTo) dateFilter.lte = new Date(dateTo);

  const [fuelLogs, expenses, maintenance] = await Promise.all([
    prisma.fuelLog.findMany({
      where: dateFilter.gte || dateFilter.lte ? { date: dateFilter } : undefined,
      include: { vehicle: { select: { name: true, registrationNumber: true } } },
    }),
    prisma.expense.findMany({
      where: dateFilter.gte || dateFilter.lte ? { date: dateFilter } : undefined,
      include: { vehicle: { select: { name: true, registrationNumber: true } } },
    }),
    prisma.maintenance.findMany({
      where: dateFilter.gte || dateFilter.lte ? { startDate: dateFilter } : undefined,
      include: { vehicle: { select: { name: true, registrationNumber: true } } },
    }),
  ]);

  const totalFuel = fuelLogs.reduce((s, f) => s + f.cost, 0);
  const totalExpense = expenses.reduce((s, e) => s + e.amount, 0);
  const totalMaintenance = maintenance.reduce((s, m) => s + m.cost, 0);

  return {
    summary: {
      totalFuelCost: totalFuel,
      totalExpenses: totalExpense,
      totalMaintenanceCost: totalMaintenance,
      grandTotal: totalFuel + totalExpense + totalMaintenance,
    },
    fuelLogs,
    expenses,
    maintenance,
  };
}

export async function exportCsvData(entity: string) {
  switch (entity) {
    case 'vehicles':
      return prisma.vehicle.findMany();
    case 'drivers':
      return prisma.driver.findMany();
    case 'trips':
      return prisma.trip.findMany({
        include: {
          vehicle: { select: { name: true, registrationNumber: true } },
          driver: { select: { name: true, licenseNumber: true } },
        },
      });
    case 'fuel':
      return prisma.fuelLog.findMany({
        include: { vehicle: { select: { name: true } } },
      });
    case 'expenses':
      return prisma.expense.findMany({
        include: { vehicle: { select: { name: true } } },
      });
    default:
      return [];
  }
}
