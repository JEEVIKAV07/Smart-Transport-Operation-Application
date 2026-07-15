import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

export const vehicleSchema = z.object({
  registrationNumber: z.string().min(1).max(20),
  name: z.string().min(1).max(100),
  model: z.string().min(1).max(100),
  type: z.enum(['VAN', 'TRUCK', 'MINI', 'BIKE', 'BUS', 'PICKUP', 'CONTAINER']),
  maxLoad: z.number().positive('Max load must be positive'),
  odometer: z.number().min(0).optional(),
  acquisitionCost: z.number().positive('Acquisition cost must be positive'),
  purchaseDate: z.string().transform((val) => new Date(val)),
  status: z.enum(['AVAILABLE', 'ON_TRIP', 'IN_SHOP', 'RETIRED']).optional(),
  region: z.string().optional(),
});

export const driverSchema = z.object({
  name: z.string().min(1).max(100),
  licenseNumber: z.string().min(1).max(50),
  licenseCategory: z.enum(['LMV', 'HMV', 'HPMV', 'MGV', 'PSV', 'MC']),
  licenseExpiry: z.string().transform((val) => new Date(val)),
  phone: z.string().min(10).max(15),
  email: z.string().email().optional().nullable(),
  address: z.string().optional(),
  safetyScore: z.number().min(0).max(100).optional(),
  status: z.enum(['AVAILABLE', 'ON_TRIP', 'OFF_DUTY', 'SUSPENDED']).optional(),
  emergencyContact: z.string().optional(),
});

export const tripSchema = z.object({
  source: z.string().min(1),
  destination: z.string().min(1),
  vehicleId: z.string().min(1),
  driverId: z.string().optional().nullable(),
  cargoWeight: z.number().positive(),
  distance: z.number().positive(),
  revenue: z.number().optional(),
  notes: z.string().optional(),
});

export const tripCompleteSchema = z.object({
  fuelUsed: z.number().positive('Fuel used must be positive'),
  endOdometer: z.number().positive(),
  revenue: z.number().optional(),
  notes: z.string().optional(),
});

export const maintenanceSchema = z.object({
  vehicleId: z.string().min(1),
  description: z.string().min(1),
  serviceType: z.string().min(1),
  startDate: z.string().transform((val) => new Date(val)),
  endDate: z.string().transform((val) => new Date(val)).optional(),
  cost: z.number().min(0).optional(),
  notes: z.string().optional(),
});

export const maintenanceCloseSchema = z.object({
  endDate: z.string().transform((val) => new Date(val)),
  cost: z.number().min(0),
  notes: z.string().optional(),
});

export const fuelLogSchema = z.object({
  vehicleId: z.string().min(1),
  tripId: z.string().optional().nullable(),
  liters: z.number().positive(),
  cost: z.number().positive(),
  fuelStation: z.string().optional(),
  date: z.string().transform((val) => new Date(val)),
});

export const expenseSchema = z.object({
  vehicleId: z.string().min(1),
  tripId: z.string().optional().nullable(),
  category: z.enum(['TOLL', 'MAINTENANCE', 'FINE', 'PERMIT', 'INSURANCE', 'OTHER']),
  description: z.string().min(1),
  amount: z.number().positive(),
  date: z.string().transform((val) => new Date(val)),
});
