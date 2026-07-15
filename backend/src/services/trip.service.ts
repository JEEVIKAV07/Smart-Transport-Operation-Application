import { Prisma, TripStatus, VehicleStatus, DriverStatus } from '@prisma/client';
import { prisma } from '../config/database';
import { AppError } from '../middleware/errorHandler';
import { buildPaginationMeta, parsePaginationParams, parseSortParams } from '../utils/response';

interface TripFilters {
  page?: string;
  limit?: string;
  search?: string;
  status?: string;
  vehicleId?: string;
  driverId?: string;
  sortBy?: string;
  sortOrder?: string;
}

const ALLOWED_SORT_FIELDS = ['tripNumber', 'source', 'destination', 'status', 'createdAt', 'startTime'];
const TRIP_INCLUDE = {
  vehicle: { select: { id: true, name: true, registrationNumber: true, maxLoad: true } },
  driver: { select: { id: true, name: true, licenseNumber: true } },
};

async function generateTripNumber(): Promise<string> {
  const count = await prisma.trip.count();
  return `TR${String(count + 1).padStart(3, '0')}`;
}

export async function listTrips(query: TripFilters) {
  const { page, limit, skip } = parsePaginationParams(query as Record<string, unknown>);
  const { orderBy } = parseSortParams(query as Record<string, unknown>, ALLOWED_SORT_FIELDS);

  const where: Prisma.TripWhereInput = {};

  if (query.search) {
    where.OR = [
      { tripNumber: { contains: query.search, mode: 'insensitive' } },
      { source: { contains: query.search, mode: 'insensitive' } },
      { destination: { contains: query.search, mode: 'insensitive' } },
    ];
  }
  if (query.status) where.status = query.status as TripStatus;
  if (query.vehicleId) where.vehicleId = query.vehicleId;
  if (query.driverId) where.driverId = query.driverId;

  const [trips, total] = await Promise.all([
    prisma.trip.findMany({ where, skip, take: limit, orderBy, include: TRIP_INCLUDE }),
    prisma.trip.count({ where }),
  ]);

  return { trips, meta: buildPaginationMeta(page, limit, total) };
}

export async function getTripById(id: string) {
  const trip = await prisma.trip.findUnique({
    where: { id },
    include: {
      ...TRIP_INCLUDE,
      fuelLogs: true,
      expenses: true,
    },
  });

  if (!trip) throw new AppError('Trip not found', 404);
  return trip;
}

export async function createTrip(data: {
  source: string;
  destination: string;
  vehicleId: string;
  driverId?: string | null;
  cargoWeight: number;
  distance: number;
  revenue?: number;
  notes?: string;
}) {
  // Validate vehicle exists and is available
  const vehicle = await prisma.vehicle.findUnique({ where: { id: data.vehicleId } });
  if (!vehicle) throw new AppError('Vehicle not found', 404);
  if (vehicle.status !== VehicleStatus.AVAILABLE) {
    throw new AppError(`Vehicle is not available. Current status: ${vehicle.status}`, 400);
  }

  // Validate cargo weight
  if (data.cargoWeight > vehicle.maxLoad) {
    throw new AppError(
      `Cargo weight (${data.cargoWeight}kg) exceeds vehicle capacity (${vehicle.maxLoad}kg)`,
      400
    );
  }

  // Validate driver if provided
  if (data.driverId) {
    const driver = await prisma.driver.findUnique({ where: { id: data.driverId } });
    if (!driver) throw new AppError('Driver not found', 404);
    if (driver.status === DriverStatus.SUSPENDED) {
      throw new AppError('Driver is suspended and cannot be assigned', 400);
    }
    if (driver.status === DriverStatus.ON_TRIP) {
      throw new AppError('Driver is already on a trip', 400);
    }
    if (driver.licenseExpiry < new Date()) {
      throw new AppError('Driver license has expired', 400);
    }
  }

  const tripNumber = await generateTripNumber();
  return prisma.trip.create({
    data: { ...data, tripNumber },
    include: TRIP_INCLUDE,
  });
}

export async function updateTrip(id: string, data: Partial<{
  source: string;
  destination: string;
  vehicleId: string;
  driverId: string | null;
  cargoWeight: number;
  distance: number;
  revenue: number;
  notes: string;
}>) {
  const trip = await prisma.trip.findUnique({ where: { id } });
  if (!trip) throw new AppError('Trip not found', 404);
  if (trip.status !== TripStatus.DRAFT) {
    throw new AppError('Only draft trips can be edited', 400);
  }

  if (data.vehicleId) {
    const vehicle = await prisma.vehicle.findUnique({ where: { id: data.vehicleId } });
    if (!vehicle) throw new AppError('Vehicle not found', 404);
    if (vehicle.status !== VehicleStatus.AVAILABLE) {
      throw new AppError(`Vehicle is not available. Current status: ${vehicle.status}`, 400);
    }
    const cargoWeight = data.cargoWeight ?? trip.cargoWeight;
    if (cargoWeight > vehicle.maxLoad) {
      throw new AppError(`Cargo weight (${cargoWeight}kg) exceeds vehicle capacity (${vehicle.maxLoad}kg)`, 400);
    }
  }

  return prisma.trip.update({ where: { id }, data, include: TRIP_INCLUDE });
}

export async function dispatchTrip(id: string) {
  const trip = await prisma.trip.findUnique({
    where: { id },
    include: { vehicle: true, driver: true },
  });
  if (!trip) throw new AppError('Trip not found', 404);
  if (trip.status !== TripStatus.DRAFT) {
    throw new AppError('Only draft trips can be dispatched', 400);
  }
  if (!trip.driverId) {
    throw new AppError('A driver must be assigned before dispatch', 400);
  }

  // Re-validate vehicle
  if (trip.vehicle.status !== VehicleStatus.AVAILABLE) {
    throw new AppError(`Vehicle is not available. Current status: ${trip.vehicle.status}`, 400);
  }

  // Re-validate driver
  if (trip.driver!.status === DriverStatus.SUSPENDED) {
    throw new AppError('Driver is suspended', 400);
  }
  if (trip.driver!.licenseExpiry < new Date()) {
    throw new AppError('Driver license has expired', 400);
  }
  if (trip.cargoWeight > trip.vehicle.maxLoad) {
    throw new AppError(`Cargo weight exceeds vehicle capacity`, 400);
  }

  // Atomic status update
  return prisma.$transaction(async (tx) => {
    const updatedTrip = await tx.trip.update({
      where: { id },
      data: { status: TripStatus.DISPATCHED, startTime: new Date() },
      include: TRIP_INCLUDE,
    });
    await tx.vehicle.update({
      where: { id: trip.vehicleId },
      data: { status: VehicleStatus.ON_TRIP },
    });
    await tx.driver.update({
      where: { id: trip.driverId! },
      data: { status: DriverStatus.ON_TRIP },
    });
    return updatedTrip;
  });
}

export async function completeTrip(id: string, data: { fuelUsed: number; endOdometer: number; revenue?: number; notes?: string }) {
  const trip = await prisma.trip.findUnique({ where: { id }, include: { vehicle: true } });
  if (!trip) throw new AppError('Trip not found', 404);
  if (trip.status !== TripStatus.DISPATCHED) {
    throw new AppError('Only dispatched trips can be completed', 400);
  }

  return prisma.$transaction(async (tx) => {
    const updatedTrip = await tx.trip.update({
      where: { id },
      data: {
        status: TripStatus.COMPLETED,
        endTime: new Date(),
        fuelUsed: data.fuelUsed,
        revenue: data.revenue,
        notes: data.notes,
      },
      include: TRIP_INCLUDE,
    });
    await tx.vehicle.update({
      where: { id: trip.vehicleId },
      data: {
        status: VehicleStatus.AVAILABLE,
        odometer: data.endOdometer,
      },
    });
    if (trip.driverId) {
      await tx.driver.update({
        where: { id: trip.driverId },
        data: { status: DriverStatus.AVAILABLE },
      });
    }
    // Auto-create fuel log
    if (data.fuelUsed > 0) {
      await tx.fuelLog.create({
        data: {
          vehicleId: trip.vehicleId,
          tripId: trip.id,
          liters: data.fuelUsed,
          cost: 0, // Cost entered separately if needed
          date: new Date(),
        },
      });
    }
    return updatedTrip;
  });
}

export async function cancelTrip(id: string) {
  const trip = await prisma.trip.findUnique({ where: { id } });
  if (!trip) throw new AppError('Trip not found', 404);
  if (!['DRAFT', 'DISPATCHED'].includes(trip.status)) {
    throw new AppError('Only draft or dispatched trips can be cancelled', 400);
  }

  return prisma.$transaction(async (tx) => {
    const updatedTrip = await tx.trip.update({
      where: { id },
      data: { status: TripStatus.CANCELLED },
      include: TRIP_INCLUDE,
    });
    // Restore statuses only if previously dispatched
    if (trip.status === TripStatus.DISPATCHED) {
      await tx.vehicle.update({
        where: { id: trip.vehicleId },
        data: { status: VehicleStatus.AVAILABLE },
      });
      if (trip.driverId) {
        await tx.driver.update({
          where: { id: trip.driverId },
          data: { status: DriverStatus.AVAILABLE },
        });
      }
    }
    return updatedTrip;
  });
}
