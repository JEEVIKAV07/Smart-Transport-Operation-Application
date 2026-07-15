import { Prisma, MaintenanceStatus, VehicleStatus } from '@prisma/client';
import { prisma } from '../config/database';
import { AppError } from '../middleware/errorHandler';
import { buildPaginationMeta, parsePaginationParams, parseSortParams } from '../utils/response';

interface MaintenanceFilters {
  page?: string;
  limit?: string;
  search?: string;
  status?: string;
  vehicleId?: string;
  sortBy?: string;
  sortOrder?: string;
}

const ALLOWED_SORT_FIELDS = ['serviceType', 'status', 'startDate', 'cost', 'createdAt'];
const MAINTENANCE_INCLUDE = {
  vehicle: { select: { id: true, name: true, registrationNumber: true, status: true } },
};

export async function listMaintenance(query: MaintenanceFilters) {
  const { page, limit, skip } = parsePaginationParams(query as Record<string, unknown>);
  const { orderBy } = parseSortParams(query as Record<string, unknown>, ALLOWED_SORT_FIELDS);

  const where: Prisma.MaintenanceWhereInput = {};
  if (query.search) {
    where.OR = [
      { serviceType: { contains: query.search, mode: 'insensitive' } },
      { description: { contains: query.search, mode: 'insensitive' } },
      { vehicle: { name: { contains: query.search, mode: 'insensitive' } } },
    ];
  }
  if (query.status) where.status = query.status as MaintenanceStatus;
  if (query.vehicleId) where.vehicleId = query.vehicleId;

  const [records, total] = await Promise.all([
    prisma.maintenance.findMany({ where, skip, take: limit, orderBy, include: MAINTENANCE_INCLUDE }),
    prisma.maintenance.count({ where }),
  ]);

  return { records, meta: buildPaginationMeta(page, limit, total) };
}

export async function getMaintenanceById(id: string) {
  const record = await prisma.maintenance.findUnique({ where: { id }, include: MAINTENANCE_INCLUDE });
  if (!record) throw new AppError('Maintenance record not found', 404);
  return record;
}

export async function createMaintenance(data: {
  vehicleId: string;
  description: string;
  serviceType: string;
  startDate: Date;
  endDate?: Date;
  cost?: number;
  notes?: string;
}) {
  const vehicle = await prisma.vehicle.findUnique({ where: { id: data.vehicleId } });
  if (!vehicle) throw new AppError('Vehicle not found', 404);
  if (vehicle.status === VehicleStatus.ON_TRIP) {
    throw new AppError('Vehicle is currently on a trip and cannot be sent to maintenance', 400);
  }
  if (vehicle.status === VehicleStatus.RETIRED) {
    throw new AppError('Cannot create maintenance for a retired vehicle', 400);
  }

  return prisma.$transaction(async (tx) => {
    const maintenance = await tx.maintenance.create({
      data: { ...data, status: MaintenanceStatus.ACTIVE },
      include: MAINTENANCE_INCLUDE,
    });
    await tx.vehicle.update({
      where: { id: data.vehicleId },
      data: { status: VehicleStatus.IN_SHOP },
    });
    return maintenance;
  });
}

export async function updateMaintenance(id: string, data: Partial<{
  description: string;
  serviceType: string;
  cost: number;
  notes: string;
}>) {
  const record = await prisma.maintenance.findUnique({ where: { id } });
  if (!record) throw new AppError('Maintenance record not found', 404);
  if (record.status === MaintenanceStatus.COMPLETED) {
    throw new AppError('Cannot update a completed maintenance record', 400);
  }

  return prisma.maintenance.update({ where: { id }, data, include: MAINTENANCE_INCLUDE });
}

export async function closeMaintenance(id: string, data: { endDate: Date; cost: number; notes?: string }) {
  const record = await prisma.maintenance.findUnique({
    where: { id },
    include: { vehicle: true },
  });
  if (!record) throw new AppError('Maintenance record not found', 404);
  if (record.status === MaintenanceStatus.COMPLETED) {
    throw new AppError('Maintenance record is already completed', 400);
  }

  return prisma.$transaction(async (tx) => {
    const closed = await tx.maintenance.update({
      where: { id },
      data: { status: MaintenanceStatus.COMPLETED, ...data },
      include: MAINTENANCE_INCLUDE,
    });
    // Only restore to AVAILABLE if not RETIRED
    if (record.vehicle.status !== VehicleStatus.RETIRED) {
      await tx.vehicle.update({
        where: { id: record.vehicleId },
        data: { status: VehicleStatus.AVAILABLE },
      });
    }
    return closed;
  });
}
