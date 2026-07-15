import api from '@/lib/axios';
import type { ApiResponse, PaginatedResponse, User } from '@/types';

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface AuthData {
  token: string;
  user: User;
}

export const authService = {
  async login(credentials: LoginCredentials): Promise<ApiResponse<AuthData>> {
    const res = await api.post('/auth/login', credentials);
    return res.data;
  },

  async logout(): Promise<void> {
    await api.post('/auth/logout');
  },

  async getMe(): Promise<ApiResponse<User>> {
    const res = await api.get('/auth/me');
    return res.data;
  },
};

export const vehicleService = {
  async list(params?: Record<string, unknown>): Promise<PaginatedResponse<unknown>> {
    const res = await api.get('/vehicles', { params });
    return res.data;
  },
  async getById(id: string): Promise<ApiResponse<unknown>> {
    const res = await api.get(`/vehicles/${id}`);
    return res.data;
  },
  async getAvailable(): Promise<ApiResponse<unknown[]>> {
    const res = await api.get('/vehicles/available');
    return res.data;
  },
  async create(data: unknown): Promise<ApiResponse<unknown>> {
    const res = await api.post('/vehicles', data);
    return res.data;
  },
  async update(id: string, data: unknown): Promise<ApiResponse<unknown>> {
    const res = await api.put(`/vehicles/${id}`, data);
    return res.data;
  },
  async delete(id: string): Promise<ApiResponse<null>> {
    const res = await api.delete(`/vehicles/${id}`);
    return res.data;
  },
};

export const driverService = {
  async list(params?: Record<string, unknown>): Promise<PaginatedResponse<unknown>> {
    const res = await api.get('/drivers', { params });
    return res.data;
  },
  async getById(id: string): Promise<ApiResponse<unknown>> {
    const res = await api.get(`/drivers/${id}`);
    return res.data;
  },
  async getAvailable(): Promise<ApiResponse<unknown[]>> {
    const res = await api.get('/drivers/available');
    return res.data;
  },
  async create(data: unknown): Promise<ApiResponse<unknown>> {
    const res = await api.post('/drivers', data);
    return res.data;
  },
  async update(id: string, data: unknown): Promise<ApiResponse<unknown>> {
    const res = await api.put(`/drivers/${id}`, data);
    return res.data;
  },
  async updateStatus(id: string, status: string): Promise<ApiResponse<unknown>> {
    const res = await api.patch(`/drivers/${id}/status`, { status });
    return res.data;
  },
  async delete(id: string): Promise<ApiResponse<null>> {
    const res = await api.delete(`/drivers/${id}`);
    return res.data;
  },
};

export const tripService = {
  async list(params?: Record<string, unknown>): Promise<PaginatedResponse<unknown>> {
    const res = await api.get('/trips', { params });
    return res.data;
  },
  async getById(id: string): Promise<ApiResponse<unknown>> {
    const res = await api.get(`/trips/${id}`);
    return res.data;
  },
  async create(data: unknown): Promise<ApiResponse<unknown>> {
    const res = await api.post('/trips', data);
    return res.data;
  },
  async update(id: string, data: unknown): Promise<ApiResponse<unknown>> {
    const res = await api.put(`/trips/${id}`, data);
    return res.data;
  },
  async dispatch(id: string): Promise<ApiResponse<unknown>> {
    const res = await api.patch(`/trips/${id}/dispatch`);
    return res.data;
  },
  async complete(id: string, data: unknown): Promise<ApiResponse<unknown>> {
    const res = await api.patch(`/trips/${id}/complete`, data);
    return res.data;
  },
  async cancel(id: string): Promise<ApiResponse<unknown>> {
    const res = await api.patch(`/trips/${id}/cancel`);
    return res.data;
  },
};

export const maintenanceService = {
  async list(params?: Record<string, unknown>): Promise<PaginatedResponse<unknown>> {
    const res = await api.get('/maintenance', { params });
    return res.data;
  },
  async getById(id: string): Promise<ApiResponse<unknown>> {
    const res = await api.get(`/maintenance/${id}`);
    return res.data;
  },
  async create(data: unknown): Promise<ApiResponse<unknown>> {
    const res = await api.post('/maintenance', data);
    return res.data;
  },
  async update(id: string, data: unknown): Promise<ApiResponse<unknown>> {
    const res = await api.put(`/maintenance/${id}`, data);
    return res.data;
  },
  async close(id: string, data: unknown): Promise<ApiResponse<unknown>> {
    const res = await api.patch(`/maintenance/${id}/close`, data);
    return res.data;
  },
};

export const fuelService = {
  async list(params?: Record<string, unknown>): Promise<PaginatedResponse<unknown>> {
    const res = await api.get('/fuel', { params });
    return res.data;
  },
  async create(data: unknown): Promise<ApiResponse<unknown>> {
    const res = await api.post('/fuel', data);
    return res.data;
  },
  async update(id: string, data: unknown): Promise<ApiResponse<unknown>> {
    const res = await api.put(`/fuel/${id}`, data);
    return res.data;
  },
  async delete(id: string): Promise<ApiResponse<null>> {
    const res = await api.delete(`/fuel/${id}`);
    return res.data;
  },
};

export const expenseService = {
  async list(params?: Record<string, unknown>): Promise<PaginatedResponse<unknown>> {
    const res = await api.get('/expenses', { params });
    return res.data;
  },
  async create(data: unknown): Promise<ApiResponse<unknown>> {
    const res = await api.post('/expenses', data);
    return res.data;
  },
  async update(id: string, data: unknown): Promise<ApiResponse<unknown>> {
    const res = await api.put(`/expenses/${id}`, data);
    return res.data;
  },
  async delete(id: string): Promise<ApiResponse<null>> {
    const res = await api.delete(`/expenses/${id}`);
    return res.data;
  },
  async getSummary(): Promise<ApiResponse<unknown>> {
    const res = await api.get('/summary');
    return res.data;
  },
};

export const dashboardService = {
  async getKPIs(params?: Record<string, unknown>): Promise<ApiResponse<unknown>> {
    const res = await api.get('/dashboard/kpis', { params });
    return res.data;
  },
  async getRecentTrips(): Promise<ApiResponse<unknown[]>> {
    const res = await api.get('/dashboard/recent-trips');
    return res.data;
  },
  async getVehicleStatus(): Promise<ApiResponse<unknown[]>> {
    const res = await api.get('/dashboard/vehicle-status');
    return res.data;
  },
  async getDriverStatus(): Promise<ApiResponse<unknown[]>> {
    const res = await api.get('/dashboard/driver-status');
    return res.data;
  },
  async getMonthlyCharts(): Promise<ApiResponse<unknown[]>> {
    const res = await api.get('/dashboard/monthly-charts');
    return res.data;
  },
};

export const reportsService = {
  async getFleetUtilization(): Promise<ApiResponse<unknown[]>> {
    const res = await api.get('/reports/fleet-utilization');
    return res.data;
  },
  async getOperationalCost(params?: Record<string, unknown>): Promise<ApiResponse<unknown>> {
    const res = await api.get('/reports/operational-cost', { params });
    return res.data;
  },
  async exportCsv(entity: string): Promise<string> {
    const res = await api.get('/reports/export/csv', {
      params: { entity },
      responseType: 'text',
    });
    return res.data as string;
  },
};
