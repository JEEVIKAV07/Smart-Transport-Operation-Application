import { Prisma } from '@prisma/client';
import { prisma } from '../config/database';
import { AppError } from '../middleware/errorHandler';
import { buildPaginationMeta, parsePaginationParams, parseSortParams } from '../utils/response';

interface FuelFilters {
  page?: string;
  limit?: string;
  vehicleId?: string;
  tripId?: string;
  sortBy?: string;
  sortOrder?: string;
}

interface ExpenseFilters {
  page?: string;
  limit?: string;
  vehicleId?: string;
  category?: string;
  sortBy?: string;
  sortOrder?: string;
}

const FUEL_INCLUDE = {
  vehicle: { select: { id: true, name: true, registrationNumber: true } },
  trip: { select: { id: true, tripNumber: true } },
};

const EXPENSE_INCLUDE = {
  vehicle: { select: { id: true, name: true, registrationNumber: true } },
  trip: { select: { id: true, tripNumber: true } },
};

// ─── Fuel Logs ───────────────────────────────────────────────────────────────

export async function listFuelLogs(query: FuelFilters) {
  const { page, limit, skip } = parsePaginationParams(query as Record<string, unknown>);
  const { orderBy } = parseSortParams(query as Record<string, unknown>, ['date', 'liters', 'cost', 'createdAt'], 'date');

  const where: Prisma.FuelLogWhereInput = {};
  if (query.vehicleId) where.vehicleId = query.vehicleId;
  if (query.tripId) where.tripId = query.tripId;

  const [logs, total] = await Promise.all([
    prisma.fuelLog.findMany({ where, skip, take: limit, orderBy: { date: 'desc' }, include: FUEL_INCLUDE }),
    prisma.fuelLog.count({ where }),
  ]);

  return { logs, meta: buildPaginationMeta(page, limit, total) };
}

export async function createFuelLog(data: {
  vehicleId: string;
  tripId?: string | null;
  liters: number;
  cost: number;
  fuelStation?: string;
  date: Date;
}) {
  const vehicle = await prisma.vehicle.findUnique({ where: { id: data.vehicleId } });
  if (!vehicle) throw new AppError('Vehicle not found', 404);

  return prisma.fuelLog.create({ data, include: FUEL_INCLUDE });
}

export async function updateFuelLog(id: string, data: Partial<{
  liters: number;
  cost: number;
  fuelStation: string;
  date: Date;
}>) {
  const exists = await prisma.fuelLog.findUnique({ where: { id } });
  if (!exists) throw new AppError('Fuel log not found', 404);
  return prisma.fuelLog.update({ where: { id }, data, include: FUEL_INCLUDE });
}

export async function deleteFuelLog(id: string) {
  const exists = await prisma.fuelLog.findUnique({ where: { id } });
  if (!exists) throw new AppError('Fuel log not found', 404);
  return prisma.fuelLog.delete({ where: { id } });
}

// ─── Expenses ─────────────────────────────────────────────────────────────────

export async function listExpenses(query: ExpenseFilters) {
  const { page, limit, skip } = parsePaginationParams(query as Record<string, unknown>);

  const where: Prisma.ExpenseWhereInput = {};
  if (query.vehicleId) where.vehicleId = query.vehicleId;
  if (query.category) where.category = query.category as Prisma.EnumExpenseCategoryFilter;

  const [expenses, total] = await Promise.all([
    prisma.expense.findMany({ where, skip, take: limit, orderBy: { date: 'desc' }, include: EXPENSE_INCLUDE }),
    prisma.expense.count({ where }),
  ]);

  return { expenses, meta: buildPaginationMeta(page, limit, total) };
}

export async function createExpense(data: {
  vehicleId: string;
  tripId?: string | null;
  category: Prisma.EnumExpenseCategoryFilter;
  description: string;
  amount: number;
  date: Date;
}) {
  const vehicle = await prisma.vehicle.findUnique({ where: { id: data.vehicleId } });
  if (!vehicle) throw new AppError('Vehicle not found', 404);

  return prisma.expense.create({ data: data as any as Prisma.ExpenseUncheckedCreateInput, include: EXPENSE_INCLUDE });
}

export async function updateExpense(id: string, data: Partial<{
  category: string;
  description: string;
  amount: number;
  date: Date;
}>) {
  const exists = await prisma.expense.findUnique({ where: { id } });
  if (!exists) throw new AppError('Expense not found', 404);
  return prisma.expense.update({ where: { id }, data: data as any as Prisma.ExpenseUncheckedUpdateInput, include: EXPENSE_INCLUDE });
}

export async function deleteExpense(id: string) {
  const exists = await prisma.expense.findUnique({ where: { id } });
  if (!exists) throw new AppError('Expense not found', 404);
  return prisma.expense.delete({ where: { id } });
}

export async function getOperationalCostSummary() {
  const [fuelTotal, maintenanceTotal, expenseTotal] = await Promise.all([
    prisma.fuelLog.aggregate({ _sum: { cost: true } }),
    prisma.maintenance.aggregate({ _sum: { cost: true } }),
    prisma.expense.aggregate({ _sum: { amount: true } }),
  ]);

  return {
    fuelCost: fuelTotal._sum.cost || 0,
    maintenanceCost: maintenanceTotal._sum.cost || 0,
    otherExpenses: expenseTotal._sum.amount || 0,
    total: (fuelTotal._sum.cost || 0) + (maintenanceTotal._sum.cost || 0) + (expenseTotal._sum.amount || 0),
  };
}
