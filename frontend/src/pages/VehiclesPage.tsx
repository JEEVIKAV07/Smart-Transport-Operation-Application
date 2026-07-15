import { useState, useEffect, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Plus, Search, X, Edit2, Trash2, Eye } from 'lucide-react';
import { vehicleService } from '@/services/api';
import { DataTable } from '@/components/shared/DataTable';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { formatCurrency, formatDate, formatNumber } from '@/lib/utils';
import type { Vehicle } from '@/types';

const schema = z.object({
  registrationNumber: z.string().min(1, 'Required').max(20),
  name: z.string().min(1, 'Required'),
  model: z.string().min(1, 'Required'),
  type: z.enum(['VAN', 'TRUCK', 'MINI', 'BIKE', 'BUS', 'PICKUP', 'CONTAINER']),
  maxLoad: z.coerce.number().positive('Must be positive'),
  odometer: z.coerce.number().min(0).optional(),
  acquisitionCost: z.coerce.number().positive('Must be positive'),
  purchaseDate: z.string().min(1, 'Required'),
  status: z.enum(['AVAILABLE', 'ON_TRIP', 'IN_SHOP', 'RETIRED']).optional(),
  region: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

export default function VehiclesPage() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [meta, setMeta] = useState<{ page: number; totalPages: number; total: number; hasNext: boolean; hasPrev: boolean } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editVehicle, setEditVehicle] = useState<Vehicle | null>(null);
  const [viewVehicle, setViewVehicle] = useState<Vehicle | null>(null);
  const [serverError, setServerError] = useState('');
  const [params, setParams] = useState({ page: 1, limit: 15, search: '', status: '', type: '', sortBy: 'createdAt', sortOrder: 'desc' });

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<FormData>({ resolver: zodResolver(schema) });

  const load = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await vehicleService.list(params as Record<string, unknown>);
      setVehicles(res.data as Vehicle[]);
      setMeta(res.meta);
    } catch { } finally { setIsLoading(false); }
  }, [params]);

  useEffect(() => { load(); }, [load]);

  const openCreate = () => { setEditVehicle(null); reset({}); setServerError(''); setShowModal(true); };
  const openEdit = (v: Vehicle) => {
    setEditVehicle(v);
    reset({ ...v, purchaseDate: v.purchaseDate?.slice(0, 10) });
    setServerError('');
    setShowModal(true);
  };

  const onSubmit = async (data: FormData) => {
    setServerError('');
    try {
      if (editVehicle) {
        await vehicleService.update(editVehicle.id, data);
      } else {
        await vehicleService.create(data);
      }
      setShowModal(false);
      load();
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      setServerError(e.response?.data?.message || 'An error occurred');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this vehicle?')) return;
    try { await vehicleService.delete(id); load(); } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      alert(e.response?.data?.message || 'Delete failed');
    }
  };

  const columns = [
    { key: 'registrationNumber', header: 'Reg. No.', sortable: true, render: (r: Vehicle) => <span className="font-mono text-amber-400 text-xs">{r.registrationNumber}</span> },
    { key: 'name', header: 'Name/Model', sortable: true, render: (r: Vehicle) => <div><p className="font-medium">{r.name}</p><p className="text-xs text-muted-foreground">{r.model}</p></div> },
    { key: 'type', header: 'Type', render: (r: Vehicle) => <span className="text-xs px-2 py-0.5 rounded bg-muted text-muted-foreground">{r.type}</span> },
    { key: 'maxLoad', header: 'Capacity', sortable: true, render: (r: Vehicle) => <span>{formatNumber(r.maxLoad)} kg</span> },
    { key: 'odometer', header: 'Odometer', sortable: true, render: (r: Vehicle) => <span>{formatNumber(r.odometer)} km</span> },
    { key: 'acquisitionCost', header: 'Acq. Cost', sortable: true, render: (r: Vehicle) => formatCurrency(r.acquisitionCost) },
    { key: 'status', header: 'Status', render: (r: Vehicle) => <StatusBadge status={r.status} /> },
    {
      key: 'actions', header: 'Actions',
      render: (r: Vehicle) => (
        <div className="flex items-center gap-1">
          <button onClick={() => setViewVehicle(r)} className="p-1.5 rounded hover:bg-muted text-muted-foreground hover:text-foreground"><Eye className="h-3.5 w-3.5" /></button>
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
          <h1 className="text-2xl font-bold text-foreground">Fleet Registry</h1>
          <p className="text-sm text-muted-foreground">Registration No. must be unique · Retired/In Shop hidden from dispatch</p>
        </div>
        <button onClick={openCreate} className="btn-amber flex items-center gap-2">
          <Plus className="h-4 w-4" /> Add Vehicle
        </button>
      </div>

      {/* Filters */}
      <div className="glass-card p-4 flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            placeholder="Search reg. no., name..."
            className="form-input pl-9"
            value={params.search}
            onChange={(e) => setParams((p) => ({ ...p, search: e.target.value, page: 1 }))}
          />
        </div>
        {[
          { key: 'type', opts: ['', 'VAN', 'TRUCK', 'MINI', 'BUS', 'BIKE', 'PICKUP', 'CONTAINER'], label: 'Type: All' },
          { key: 'status', opts: ['', 'AVAILABLE', 'ON_TRIP', 'IN_SHOP', 'RETIRED'], label: 'Status: All' },
        ].map((f) => (
          <select
            key={f.key}
            value={params[f.key as keyof typeof params]}
            onChange={(e) => setParams((p) => ({ ...p, [f.key]: e.target.value, page: 1 }))}
            className="form-input w-40"
          >
            {f.opts.map((o) => <option key={o} value={o}>{o || f.label}</option>)}
          </select>
        ))}
      </div>

      <DataTable
        columns={columns as never[]}
        data={vehicles as unknown as Record<string, unknown>[]}
        isLoading={isLoading}
        emptyMessage="No vehicles found"
        meta={meta || undefined}
        onPageChange={(p) => setParams((prev) => ({ ...prev, page: p }))}
        onSort={(k, o) => setParams((prev) => ({ ...prev, sortBy: k, sortOrder: o }))}
      />

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-card border border-border rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto animate-fade-in">
            <div className="flex items-center justify-between p-5 border-b border-border/50">
              <h2 className="text-lg font-bold">{editVehicle ? 'Edit Vehicle' : 'Add Vehicle'}</h2>
              <button onClick={() => setShowModal(false)} className="p-1.5 rounded hover:bg-muted"><X className="h-4 w-4" /></button>
            </div>
            <form onSubmit={handleSubmit(onSubmit)} className="p-5 space-y-4">
              {serverError && <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-sm text-red-400">{serverError}</div>}
              <div className="grid grid-cols-2 gap-4">
                {[
                  { name: 'registrationNumber', label: 'Registration No.', placeholder: 'GJ01AB452' },
                  { name: 'name', label: 'Vehicle Name', placeholder: 'VAN-05' },
                  { name: 'model', label: 'Model', placeholder: 'Tata Ace' },
                ].map((f) => (
                  <div key={f.name}>
                    <label className="block text-xs font-medium text-muted-foreground mb-1">{f.label}</label>
                    <input {...register(f.name as keyof FormData)} placeholder={f.placeholder} className="form-input" />
                    {errors[f.name as keyof FormData] && <p className="text-xs text-red-400 mt-1">{errors[f.name as keyof FormData]?.message}</p>}
                  </div>
                ))}
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1">Type</label>
                  <select {...register('type')} className="form-input">
                    {['VAN', 'TRUCK', 'MINI', 'BIKE', 'BUS', 'PICKUP', 'CONTAINER'].map((t) => <option key={t}>{t}</option>)}
                  </select>
                </div>
                {[
                  { name: 'maxLoad', label: 'Max Load (kg)', placeholder: '500' },
                  { name: 'odometer', label: 'Odometer (km)', placeholder: '0' },
                  { name: 'acquisitionCost', label: 'Acquisition Cost (₹)', placeholder: '620000' },
                ].map((f) => (
                  <div key={f.name}>
                    <label className="block text-xs font-medium text-muted-foreground mb-1">{f.label}</label>
                    <input type="number" {...register(f.name as keyof FormData)} placeholder={f.placeholder} className="form-input" />
                    {errors[f.name as keyof FormData] && <p className="text-xs text-red-400 mt-1">{errors[f.name as keyof FormData]?.message}</p>}
                  </div>
                ))}
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1">Purchase Date</label>
                  <input type="date" {...register('purchaseDate')} className="form-input" />
                  {errors.purchaseDate && <p className="text-xs text-red-400 mt-1">{errors.purchaseDate.message}</p>}
                </div>
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1">Status</label>
                  <select {...register('status')} className="form-input">
                    {['AVAILABLE', 'IN_SHOP', 'RETIRED'].map((s) => <option key={s}>{s}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1">Region</label>
                  <select {...register('region')} className="form-input">
                    {['', 'North', 'South', 'East', 'West'].map((r) => <option key={r} value={r}>{r || 'Select Region'}</option>)}
                  </select>
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 text-sm rounded-lg border border-border hover:bg-muted transition-colors">Cancel</button>
                <button type="submit" disabled={isSubmitting} className="btn-amber">
                  {isSubmitting ? 'Saving...' : editVehicle ? 'Update Vehicle' : 'Create Vehicle'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Modal */}
      {viewVehicle && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-card border border-border rounded-2xl w-full max-w-lg animate-fade-in">
            <div className="flex items-center justify-between p-5 border-b border-border/50">
              <h2 className="text-lg font-bold">{viewVehicle.name}</h2>
              <button onClick={() => setViewVehicle(null)} className="p-1.5 rounded hover:bg-muted"><X className="h-4 w-4" /></button>
            </div>
            <div className="p-5 grid grid-cols-2 gap-4">
              {[
                ['Reg. No.', viewVehicle.registrationNumber],
                ['Model', viewVehicle.model],
                ['Type', viewVehicle.type],
                ['Max Load', `${formatNumber(viewVehicle.maxLoad)} kg`],
                ['Odometer', `${formatNumber(viewVehicle.odometer)} km`],
                ['Acq. Cost', formatCurrency(viewVehicle.acquisitionCost)],
                ['Purchase Date', formatDate(viewVehicle.purchaseDate)],
                ['Region', viewVehicle.region || '—'],
              ].map(([label, value]) => (
                <div key={label}>
                  <p className="text-xs text-muted-foreground">{label}</p>
                  <p className="text-sm font-medium mt-0.5">{value}</p>
                </div>
              ))}
              <div className="col-span-2">
                <p className="text-xs text-muted-foreground">Status</p>
                <div className="mt-1"><StatusBadge status={viewVehicle.status} /></div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
