// Vehicle Types
export type VehicleType = 'VAN' | 'TRUCK' | 'MINI' | 'BIKE' | 'BUS' | 'PICKUP' | 'CONTAINER';
export type VehicleStatus = 'AVAILABLE' | 'ON_TRIP' | 'IN_SHOP' | 'RETIRED';

// Driver Types
export type DriverStatus = 'AVAILABLE' | 'ON_TRIP' | 'OFF_DUTY' | 'SUSPENDED';
export type LicenseCategory = 'LMV' | 'HMV' | 'HPMV' | 'MGV' | 'PSV' | 'MC';

// Trip Types
export type TripStatus = 'DRAFT' | 'DISPATCHED' | 'COMPLETED' | 'CANCELLED';

// Maintenance Types
export type MaintenanceStatus = 'ACTIVE' | 'COMPLETED';

// Expense Types
export type ExpenseCategory = 'TOLL' | 'MAINTENANCE' | 'FINE' | 'PERMIT' | 'INSURANCE' | 'OTHER';

// Role Types
export type UserRole = 'ADMIN' | 'FLEET_MANAGER' | 'DRIVER' | 'SAFETY_OFFICER' | 'FINANCIAL_ANALYST';

// Entities
export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  isActive: boolean;
  createdAt: string;
}

export interface Vehicle {
  id: string;
  registrationNumber: string;
  name: string;
  model: string;
  type: VehicleType;
  maxLoad: number;
  odometer: number;
  acquisitionCost: number;
  purchaseDate: string;
  status: VehicleStatus;
  region?: string;
  createdAt: string;
  updatedAt: string;
  _count?: { trips: number; maintenance: number };
}

export interface Driver {
  id: string;
  name: string;
  licenseNumber: string;
  licenseCategory: LicenseCategory;
  licenseExpiry: string;
  phone: string;
  email?: string;
  address?: string;
  safetyScore: number;
  status: DriverStatus;
  emergencyContact?: string;
  createdAt: string;
  updatedAt: string;
  _count?: { trips: number };
}

export interface Trip {
  id: string;
  tripNumber: string;
  source: string;
  destination: string;
  vehicleId: string;
  driverId?: string;
  cargoWeight: number;
  distance: number;
  status: TripStatus;
  startTime?: string;
  endTime?: string;
  fuelUsed?: number;
  revenue?: number;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  vehicle?: { id: string; name: string; registrationNumber: string; maxLoad: number };
  driver?: { id: string; name: string; licenseNumber: string };
}

export interface Maintenance {
  id: string;
  vehicleId: string;
  description: string;
  serviceType: string;
  status: MaintenanceStatus;
  startDate: string;
  endDate?: string;
  cost: number;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  vehicle?: { id: string; name: string; registrationNumber: string; status: VehicleStatus };
}

export interface FuelLog {
  id: string;
  vehicleId: string;
  tripId?: string;
  liters: number;
  cost: number;
  fuelStation?: string;
  date: string;
  createdAt: string;
  vehicle?: { id: string; name: string; registrationNumber: string };
  trip?: { id: string; tripNumber: string };
}

export interface Expense {
  id: string;
  vehicleId: string;
  tripId?: string;
  category: ExpenseCategory;
  description: string;
  amount: number;
  date: string;
  createdAt: string;
  vehicle?: { id: string; name: string; registrationNumber: string };
  trip?: { id: string; tripNumber: string };
}

// API Response types
export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

export interface PaginatedResponse<T> {
  success: boolean;
  message: string;
  data: T[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

// Dashboard Types
export interface DashboardKPIs {
  totalVehicles: number;
  availableVehicles: number;
  inShopVehicles: number;
  onTripVehicles: number;
  retiredVehicles: number;
  activeTrips: number;
  pendingTrips: number;
  driversOnDuty: number;
  fleetUtilization: number;
  monthlyRevenue: number;
  totalFuelCost: number;
  totalMaintenanceCost: number;
}

export interface MonthlyChartData {
  month: string;
  trips: number;
  revenue: number;
  fuelCost: number;
  fuelLiters: number;
}
