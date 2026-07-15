import { Prisma, DriverStatus } from '@prisma/client';
import { prisma } from '../config/database';
import { AppError } from '../middleware/errorHandler';
import { buildPaginationMeta, parsePaginationParams, parseSortParams } from '../utils/response';

interface DriverFilters {
  page?: string;
  limit?: string;
  search?: string;
  status?: string;
  licenseCategory?: string;
  sortBy?: string;
  sortOrder?: string;
}

const ALLOWED_SORT_FIELDS = ['name', 'licenseNumber', 'status', 'safetyScore', 'licenseExpiry', 'createdAt'];

export async function listDrivers(query: DriverFilters) {
  const { page, limit, skip } = parsePaginationParams(query as Record<string, unknown>);
  const { orderBy } = parseSortParams(query as Record<string, unknown>, ALLOWED_SORT_FIELDS);

  const where: Prisma.DriverWhereInput = {};

  if (query.search) {
    where.OR = [
      { name: { contains: query.search, mode: 'insensitive' } },
      { licenseNumber: { contains: query.search, mode: 'insensitive' } },
      { phone: { contains: query.search, mode: 'insensitive' } },
    ];
  }
  if (query.status) where.status = query.status as DriverStatus;
  if (query.licenseCategory) where.licenseCategory = query.licenseCategory as Prisma.EnumLicenseCategoryFilter;

  const [drivers, total] = await Promise.all([
    prisma.driver.findMany({
      where,
      skip,
      take: limit,
      orderBy,
      include: {
        _count: { select: { trips: true } },
      },
    }),
    prisma.driver.count({ where }),
  ]);

  return { drivers, meta: buildPaginationMeta(page, limit, total) };
}

export async function getDriverById(id: string) {
  const driver = await prisma.driver.findUnique({
    where: { id },
    include: {
      trips: {
        orderBy: { createdAt: 'desc' },
        take: 5,
        include: { vehicle: { select: { name: true, registrationNumber: true } } },
      },
      _count: { select: { trips: true } },
    },
  });

  if (!driver) throw new AppError('Driver not found', 404);
  return driver;
}

export async function createDriver(data: Prisma.DriverCreateInput) {
  return prisma.driver.create({ data });
}

export async function updateDriver(id: string, data: Prisma.DriverUpdateInput) {
  const exists = await prisma.driver.findUnique({ where: { id } });
  if (!exists) throw new AppError('Driver not found', 404);

  return prisma.driver.update({ where: { id }, data });
}

export async function deleteDriver(id: string) {
  const exists = await prisma.driver.findUnique({ where: { id } });
  if (!exists) throw new AppError('Driver not found', 404);

  const activeTrip = await prisma.trip.findFirst({
    where: { driverId: id, status: 'DISPATCHED' },
  });
  if (activeTrip) throw new AppError('Cannot delete driver with active trips', 400);

  return prisma.driver.delete({ where: { id } });
}

export async function updateDriverStatus(id: string, status: DriverStatus) {
  const driver = await prisma.driver.findUnique({ where: { id } });
  if (!driver) throw new AppError('Driver not found', 404);

  if (driver.status === 'ON_TRIP' && status !== 'ON_TRIP') {
    const activeTrip = await prisma.trip.findFirst({
      where: { driverId: id, status: 'DISPATCHED' },
    });
    if (activeTrip) throw new AppError('Cannot change status while driver is on an active trip', 400);
  }

  return prisma.driver.update({ where: { id }, data: { status } });
}

export async function getAvailableDrivers() {
  const now = new Date();
  return prisma.driver.findMany({
    where: {
      status: DriverStatus.AVAILABLE,
      licenseExpiry: { gt: now },
    },
    orderBy: { name: 'asc' },
  });
}
