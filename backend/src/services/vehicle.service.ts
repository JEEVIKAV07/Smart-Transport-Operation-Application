import { Prisma, VehicleStatus } from '@prisma/client';
import { prisma } from '../config/database';
import { AppError } from '../middleware/errorHandler';
import { buildPaginationMeta, parsePaginationParams, parseSortParams } from '../utils/response';

interface VehicleFilters {
  page?: string;
  limit?: string;
  search?: string;
  status?: string;
  type?: string;
  region?: string;
  sortBy?: string;
  sortOrder?: string;
}

const ALLOWED_SORT_FIELDS = ['name', 'registrationNumber', 'status', 'type', 'odometer', 'createdAt'];

export async function listVehicles(query: VehicleFilters) {
  const { page, limit, skip } = parsePaginationParams(query as Record<string, unknown>);
  const { orderBy } = parseSortParams(query as Record<string, unknown>, ALLOWED_SORT_FIELDS);

  const where: Prisma.VehicleWhereInput = {};

  if (query.search) {
    where.OR = [
      { name: { contains: query.search, mode: 'insensitive' } },
      { registrationNumber: { contains: query.search, mode: 'insensitive' } },
      { model: { contains: query.search, mode: 'insensitive' } },
    ];
  }
  if (query.status) where.status = query.status as VehicleStatus;
  if (query.type) where.type = query.type as Prisma.EnumVehicleTypeFilter;
  if (query.region) where.region = { contains: query.region, mode: 'insensitive' };

  const [vehicles, total] = await Promise.all([
    prisma.vehicle.findMany({
      where,
      skip,
      take: limit,
      orderBy,
      include: {
        _count: { select: { trips: true, maintenance: true } },
      },
    }),
    prisma.vehicle.count({ where }),
  ]);

  return { vehicles, meta: buildPaginationMeta(page, limit, total) };
}

export async function getVehicleById(id: string) {
  const vehicle = await prisma.vehicle.findUnique({
    where: { id },
    include: {
      trips: { orderBy: { createdAt: 'desc' }, take: 5 },
      maintenance: { orderBy: { createdAt: 'desc' }, take: 5 },
      fuelLogs: { orderBy: { date: 'desc' }, take: 5 },
      documents: true,
      _count: { select: { trips: true } },
    },
  });

  if (!vehicle) throw new AppError('Vehicle not found', 404);
  return vehicle;
}

export async function createVehicle(data: Prisma.VehicleCreateInput) {
  return prisma.vehicle.create({ data });
}

export async function updateVehicle(id: string, data: Prisma.VehicleUpdateInput) {
  const exists = await prisma.vehicle.findUnique({ where: { id } });
  if (!exists) throw new AppError('Vehicle not found', 404);

  return prisma.vehicle.update({ where: { id }, data });
}

export async function deleteVehicle(id: string) {
  const exists = await prisma.vehicle.findUnique({ where: { id } });
  if (!exists) throw new AppError('Vehicle not found', 404);

  const activeTrip = await prisma.trip.findFirst({
    where: { vehicleId: id, status: { in: ['DISPATCHED'] } },
  });
  if (activeTrip) throw new AppError('Cannot delete vehicle with active trips', 400);

  return prisma.vehicle.delete({ where: { id } });
}

export async function getAvailableVehicles() {
  return prisma.vehicle.findMany({
    where: { status: VehicleStatus.AVAILABLE },
    orderBy: { name: 'asc' },
  });
}
