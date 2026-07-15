import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { format, isAfter } from 'date-fns';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number, currency = 'INR'): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatDate(date: string | Date | undefined | null): string {
  if (!date) return '—';
  return format(new Date(date), 'dd MMM yyyy');
}

export function formatDateTime(date: string | Date | undefined | null): string {
  if (!date) return '—';
  return format(new Date(date), 'dd MMM yyyy, HH:mm');
}

export function isLicenseExpired(expiry: string): boolean {
  return !isAfter(new Date(expiry), new Date());
}

export function isLicenseExpiringSoon(expiry: string, days = 30): boolean {
  const expiryDate = new Date(expiry);
  const futureDate = new Date();
  futureDate.setDate(futureDate.getDate() + days);
  return isAfter(expiryDate, new Date()) && !isAfter(expiryDate, futureDate);
}

export function getStatusColor(status: string): string {
  const statusMap: Record<string, string> = {
    AVAILABLE: 'status-available',
    ON_TRIP: 'status-on-trip',
    IN_SHOP: 'status-in-shop',
    RETIRED: 'status-retired',
    OFF_DUTY: 'status-off-duty',
    SUSPENDED: 'status-suspended',
    DRAFT: 'status-draft',
    DISPATCHED: 'status-dispatched',
    COMPLETED: 'status-completed',
    CANCELLED: 'status-cancelled',
    ACTIVE: 'status-in-shop',
  };
  return statusMap[status] || 'status-draft';
}

export function getStatusLabel(status: string): string {
  const labelMap: Record<string, string> = {
    AVAILABLE: 'Available',
    ON_TRIP: 'On Trip',
    IN_SHOP: 'In Shop',
    RETIRED: 'Retired',
    OFF_DUTY: 'Off Duty',
    SUSPENDED: 'Suspended',
    DRAFT: 'Draft',
    DISPATCHED: 'Dispatched',
    COMPLETED: 'Completed',
    CANCELLED: 'Cancelled',
    ACTIVE: 'Active',
    FLEET_MANAGER: 'Fleet Manager',
    DRIVER: 'Driver',
    SAFETY_OFFICER: 'Safety Officer',
    FINANCIAL_ANALYST: 'Financial Analyst',
    ADMIN: 'Admin',
  };
  return labelMap[status] || status;
}

export function formatNumber(n: number, decimals = 0): string {
  return new Intl.NumberFormat('en-IN', {
    maximumFractionDigits: decimals,
  }).format(n);
}

export function downloadCsv(data: string, filename: string) {
  const blob = new Blob([data], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
