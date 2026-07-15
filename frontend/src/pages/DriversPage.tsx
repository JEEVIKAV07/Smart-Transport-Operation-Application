import { useState, useEffect, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Plus, Search, X, Edit2, Trash2, AlertTriangle } from 'lucide-react';
import { driverService } from '@/services/api';
import { DataTable } from '@/components/shared/DataTable';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { formatDate, isLicenseExpired, isLicenseExpiringSoon } from '@/lib/utils';
import type { Driver, DriverStatus } from '@/types';

const schema = z.object({
  name: z.string().min(1, 'Required'),
  licenseNumber: z.string().min(1, 'Required'),
  licenseCategory: z.enum(['LMV', 'HMV', 'HPMV', 'MGV', 'PSV', 'MC']),
  licenseExpiry: z.string().min(1, 'Required'),
  phone: z.string().min(10, 'Min 10 digits'),
  email: z.string().email('Invalid email').optional().or(z.literal('')),
  address: z.string().optional(),
  safetyScore: z.coerce.number().min(0).max(100).optional(),
  status: z.enum(['AVAILABLE', 'ON_TRIP', 'OFF_DUTY', 'SUSPENDED']).optional(),
  emergencyContact: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

export default function DriversPage() {
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [meta, setMeta] = useState<{ page: number; totalPages: number; total: number; hasNext: boolean; hasPrev: boolean } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editDriver, setEditDriver] = useState<Driver | null>(null);
  const [serverError, setServerError] = useState('');
  const [params, setParams] = useState({ page: 1, limit: 15, search: '', status: '', sortBy: 'createdAt', sortOrder: 'desc' });

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<FormData>({ resolver: zodResolver(schema) });

  const load = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await driverService.list(params as Record<string, unknown>);
      setDrivers(res.data as Driver[]);
      setMeta(res.meta);
    } catch { } finally { setIsLoading(false); }
  }, [params]);

  useEffect(() => { load(); }, [load]);

  const openCreate = () => { setEditDriver(null); reset({}); setServerError(''); setShowModal(true); };
  const openEdit = (d: Driver) => {
    setEditDriver(d);
    reset({ ...d, licenseExpiry: d.licenseExpiry?.slice(0, 10), email: d.email || '' });
    setServerError('');
    setShowModal(true);
  };

  const onSubmit = async (data: FormData) => {
    setServerError('');
    try {
      if (editDriver) { await driverService.update(editDriver.id, data); }
      else { await driverService.create(data); }
      setShowModal(false);
      load();
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      setServerError(e.response?.data?.message || 'Error occurred');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this driver?')) return;
    try { await driverService.delete(id); load(); } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      alert(e.response?.data?.message || 'Delete failed');
    }
  };

  const handleStatusChange = async (id: string, status: DriverStatus) => {
    try { await driverService.updateStatus(id, status); load(); } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      alert(e.response?.data?.message || 'Status update failed');
    }
  };

  const columns = [
    { key: 'name', header: 'Driver', sortable: true, render: (r: Driver) => <span className="font-medium">{r.name}</span> },
    { key: 'licenseNumber', header: 'License No.', render: (r: Driver) => <span className="font-mono text-xs text-amber-400">{r.licenseNumber}</span> },
    { key: 'licenseCategory', header: 'Category', render: (r: Driver) => <span className="text-xs px-2 py-0.5 rounded bg-muted text-muted-foreground">{r.licenseCategory}</span> },
    {
      key: 'licenseExpiry', header: 'Expiry', sortable: true, render: (r: Driver) => {
        const expired = isLicenseExpired(r.licenseExpiry);
        const expiring = isLicenseExpiringSoon(r.licenseExpiry);
        return (
          <div className="flex items-center gap-1.5">
            <span className={expired ? 'text-red-400' : expiring ? 'text-amber-400' : ''}>{formatDate(r.licenseExpiry)}</span>
            {expired && <AlertTriangle className="h-3.5 w-3.5 text-red-400" />}
            {!expired && expiring && <AlertTriangle className="h-3.5 w-3.5 text-amber-400" />}
          </div>
        );
      }
    },
    { key: 'phone', header: 'Contact', render: (r: Driver) => r.phone },
    {
      key: 'safetyScore', header: 'Safety', sortable: true, render: (r: Driver) => (
        <div className="flex items-center gap-2">
          <div className="w-16 h-1.5 bg-muted rounded-full overflow-hidden">
            <div className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-amber-500" style={{ width: `${r.safetyScore}%` }} />
          </div>
          <span className="text-xs text-muted-foreground">{r.safetyScore}%</span>
        </div>
      )
    },
    { key: 'status', header: 'Status', render: (r: Driver) => <StatusBadge status={r.status} /> },
    {
      key: 'actions', header: 'Actions', render: (r: Driver) => (
        <div className="flex items-center gap-1">
          <select
            value={r.status}
            onChange={(e) => handleStatusChange(r.id, e.target.value as DriverStatus)}
            className="text-xs bg-input border border-border rounded px-1 py-0.5 text-foreground"
          >
            {['AVAILABLE', 'ON_TRIP', 'OFF_DUTY', 'SUSPENDED'].map((s) => <option key={s}>{s}</option>)}
          </select>
          <button onClick={() => openEdit(r)} className="p-1.5 rounded hover:bg-muted text-muted-foreground hover:text-amber-400"><Edit2 className="h-3.5 w-3.5" /></button>
          <button onClick={() => handleDelete(r.id)} className="p-1.5 rounded hover:bg-muted text-muted-foreground hover:text-red-400"><Trash2 className="h-3.5 w-3.5" /></button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Drivers & Safety Profiles</h1>
          <p className="text-sm text-muted-foreground text-amber-400/80">Expired license or Suspended status → blocked from trip assignment</p>
        </div>
        <button onClick={openCreate} className="btn-amber flex items-center gap-2">
          <Plus className="h-4 w-4" /> Add Driver
        </button>
      </div>

      <div className="glass-card p-4 flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input placeholder="Search name, license..." className="form-input pl-9" value={params.search} onChange={(e) => setParams((p) => ({ ...p, search: e.target.value, page: 1 }))} />
        </div>
        <select value={params.status} onChange={(e) => setParams((p) => ({ ...p, status: e.target.value, page: 1 }))} className="form-input w-40">
          {['', 'AVAILABLE', 'ON_TRIP', 'OFF_DUTY', 'SUSPENDED'].map((s) => <option key={s} value={s}>{s || 'Status: All'}</option>)}
        </select>
      </div>

      <DataTable
        columns={columns as never[]}
        data={drivers as unknown as Record<string, unknown>[]}
        isLoading={isLoading}
        emptyMessage="No drivers found"
        meta={meta || undefined}
        onPageChange={(p) => setParams((prev) => ({ ...prev, page: p }))}
        onSort={(k, o) => setParams((prev) => ({ ...prev, sortBy: k, sortOrder: o }))}
      />

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-card border border-border rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto animate-fade-in">
            <div className="flex items-center justify-between p-5 border-b border-border/50">
              <h2 className="text-lg font-bold">{editDriver ? 'Edit Driver' : 'Add Driver'}</h2>
              <button onClick={() => setShowModal(false)} className="p-1.5 rounded hover:bg-muted"><X className="h-4 w-4" /></button>
            </div>
            <form onSubmit={handleSubmit(onSubmit)} className="p-5 space-y-4">
              {serverError && <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-sm text-red-400">{serverError}</div>}
              <div className="grid grid-cols-2 gap-4">
                {[
                  { name: 'name', label: 'Full Name', placeholder: 'Alex Kumar' },
                  { name: 'licenseNumber', label: 'License No.', placeholder: 'DL-88213' },
                  { name: 'phone', label: 'Phone', placeholder: '9876500001' },
                  { name: 'email', label: 'Email', placeholder: 'alex@example.com' },
                  { name: 'address', label: 'Address', placeholder: 'Gandhinagar, Gujarat' },
                  { name: 'emergencyContact', label: 'Emergency Contact', placeholder: '9876500010' },
                ].map((f) => (
                  <div key={f.name}>
                    <label className="block text-xs font-medium text-muted-foreground mb-1">{f.label}</label>
                    <input {...register(f.name as keyof FormData)} placeholder={f.placeholder} className="form-input" />
                    {errors[f.name as keyof FormData] && <p className="text-xs text-red-400 mt-1">{errors[f.name as keyof FormData]?.message}</p>}
                  </div>
                ))}
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1">License Category</label>
                  <select {...register('licenseCategory')} className="form-input">
                    {['LMV', 'HMV', 'HPMV', 'MGV', 'PSV', 'MC'].map((c) => <option key={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1">License Expiry</label>
                  <input type="date" {...register('licenseExpiry')} className="form-input" />
                  {errors.licenseExpiry && <p className="text-xs text-red-400 mt-1">{errors.licenseExpiry.message}</p>}
                </div>
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1">Safety Score (0-100)</label>
                  <input type="number" {...register('safetyScore')} placeholder="100" className="form-input" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1">Status</label>
                  <select {...register('status')} className="form-input">
                    {['AVAILABLE', 'OFF_DUTY', 'SUSPENDED'].map((s) => <option key={s}>{s}</option>)}
                  </select>
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 text-sm rounded-lg border border-border hover:bg-muted">Cancel</button>
                <button type="submit" disabled={isSubmitting} className="btn-amber">
                  {isSubmitting ? 'Saving...' : editDriver ? 'Update Driver' : 'Create Driver'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
