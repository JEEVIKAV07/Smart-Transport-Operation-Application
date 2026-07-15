import { useState, useEffect, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Plus, X, CheckCircle, Search, ArrowRight } from 'lucide-react';
import { maintenanceService, vehicleService } from '@/services/api';
import { DataTable } from '@/components/shared/DataTable';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { formatDate, formatCurrency } from '@/lib/utils';
import type { Maintenance, Vehicle } from '@/types';

const schema = z.object({
  vehicleId: z.string().min(1, 'Required'),
  serviceType: z.string().min(1, 'Required'),
  description: z.string().min(1, 'Required'),
  startDate: z.string().min(1, 'Required'),
  cost: z.coerce.number().min(0).optional(),
  notes: z.string().optional(),
});

const closeSchema = z.object({
  endDate: z.string().min(1, 'Required'),
  cost: z.coerce.number().min(0),
  notes: z.string().optional(),
});

type FormData = z.infer<typeof schema>;
type CloseData = z.infer<typeof closeSchema>;

export default function MaintenancePage() {
  const [records, setRecords] = useState<Maintenance[]>([]);
  const [meta, setMeta] = useState<{ page: number; totalPages: number; total: number; hasNext: boolean; hasPrev: boolean } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [closeModal, setCloseModal] = useState<Maintenance | null>(null);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [serverError, setServerError] = useState('');
  const [params, setParams] = useState({ page: 1, limit: 15, search: '', status: '', sortBy: 'createdAt', sortOrder: 'desc' });

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<FormData>({ resolver: zodResolver(schema) });
  const { register: regClose, handleSubmit: handleClose, reset: resetClose, formState: { errors: errClose, isSubmitting: isClosing } } = useForm<CloseData>({ resolver: zodResolver(closeSchema) });

  const load = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await maintenanceService.list(params as Record<string, unknown>);
      setRecords(res.data as Maintenance[]);
      setMeta(res.meta);
    } catch { } finally { setIsLoading(false); }
  }, [params]);

  useEffect(() => { load(); }, [load]);

  const openCreate = async () => {
    setServerError('');
    reset({ startDate: new Date().toISOString().slice(0, 10) });
    try {
      const vRes = await vehicleService.list({ limit: 100, status: '' } as Record<string, unknown>);
      setVehicles((vRes.data as Vehicle[]).filter((v) => ['AVAILABLE', 'IN_SHOP'].includes(v.status)));
    } catch { }
    setShowModal(true);
  };

  const onSubmit = async (data: FormData) => {
    setServerError('');
    try {
      await maintenanceService.create(data);
      setShowModal(false);
      load();
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      setServerError(e.response?.data?.message || 'Error occurred');
    }
  };

  const onClose = async (data: CloseData) => {
    if (!closeModal) return;
    try { await maintenanceService.close(closeModal.id, data); setCloseModal(null); load(); } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      alert(e.response?.data?.message || 'Close failed');
    }
  };

  const columns = [
    { key: 'vehicle', header: 'Vehicle', render: (r: Maintenance) => <div><p className="font-medium">{(r.vehicle as { name?: string })?.name}</p><p className="text-xs text-muted-foreground font-mono">{(r.vehicle as { registrationNumber?: string })?.registrationNumber}</p></div> },
    { key: 'serviceType', header: 'Service', sortable: true, render: (r: Maintenance) => <span className="font-medium">{r.serviceType}</span> },
    { key: 'description', header: 'Description', render: (r: Maintenance) => <span className="text-sm text-muted-foreground truncate max-w-xs block">{r.description}</span> },
    { key: 'status', header: 'Status', render: (r: Maintenance) => <StatusBadge status={r.status} /> },
    { key: 'startDate', header: 'Start Date', sortable: true, render: (r: Maintenance) => formatDate(r.startDate) },
    { key: 'endDate', header: 'End Date', render: (r: Maintenance) => formatDate(r.endDate) },
    { key: 'cost', header: 'Cost', sortable: true, render: (r: Maintenance) => formatCurrency(r.cost) },
    {
      key: 'actions', header: 'Actions', render: (r: Maintenance) => r.status === 'ACTIVE' ? (
        <button onClick={() => { setCloseModal(r); resetClose({ endDate: new Date().toISOString().slice(0, 10), cost: r.cost }); }} className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-500/20 text-emerald-400 text-xs hover:bg-emerald-500/30 transition-colors">
          <CheckCircle className="h-3.5 w-3.5" /> Close
        </button>
      ) : <span className="text-xs text-muted-foreground">Completed</span>,
    },
  ];

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Maintenance</h1>
          <p className="text-sm text-muted-foreground">In Shop vehicles are removed from the dispatch pool.</p>
        </div>
        <button onClick={openCreate} className="btn-amber flex items-center gap-2">
          <Plus className="h-4 w-4" /> Log Service
        </button>
      </div>

      {/* Status flow diagram */}
      <div className="glass-card p-4">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Vehicle Status Transitions</p>
        <div className="flex flex-col gap-2 text-sm">
          <div className="flex items-center gap-2">
            <span className="text-emerald-400 font-medium">Available</span>
            <ArrowRight className="h-4 w-4 text-muted-foreground" />
            <span className="italic text-muted-foreground">Creating the record</span>
            <ArrowRight className="h-4 w-4 text-muted-foreground" />
            <span className="text-amber-400 font-medium">In Shop</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-amber-400 font-medium">In Shop</span>
            <ArrowRight className="h-4 w-4 text-muted-foreground" />
            <span className="italic text-muted-foreground">Closing record (not retired)</span>
            <ArrowRight className="h-4 w-4 text-muted-foreground" />
            <span className="text-emerald-400 font-medium">Available</span>
          </div>
        </div>
      </div>

      <div className="glass-card p-4 flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input placeholder="Search vehicle, service..." className="form-input pl-9" value={params.search} onChange={(e) => setParams((p) => ({ ...p, search: e.target.value, page: 1 }))} />
        </div>
        <select value={params.status} onChange={(e) => setParams((p) => ({ ...p, status: e.target.value, page: 1 }))} className="form-input w-40">
          {['', 'ACTIVE', 'COMPLETED'].map((s) => <option key={s} value={s}>{s || 'Status: All'}</option>)}
        </select>
      </div>

      <DataTable
        columns={columns as never[]}
        data={records as unknown as Record<string, unknown>[]}
        isLoading={isLoading}
        emptyMessage="No maintenance records"
        meta={meta || undefined}
        onPageChange={(p) => setParams((prev) => ({ ...prev, page: p }))}
        onSort={(k, o) => setParams((prev) => ({ ...prev, sortBy: k, sortOrder: o }))}
      />

      {/* Create Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-card border border-border rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto animate-fade-in">
            <div className="flex items-center justify-between p-5 border-b border-border/50">
              <h2 className="text-lg font-bold">Log Service Record</h2>
              <button onClick={() => setShowModal(false)} className="p-1.5 rounded hover:bg-muted"><X className="h-4 w-4" /></button>
            </div>
            <form onSubmit={handleSubmit(onSubmit)} className="p-5 space-y-4">
              {serverError && <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-sm text-red-400">{serverError}</div>}
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">Vehicle</label>
                <select {...register('vehicleId')} className="form-input">
                  <option value="">Select vehicle...</option>
                  {vehicles.map((v) => <option key={v.id} value={v.id}>{v.name} ({v.status})</option>)}
                </select>
                {errors.vehicleId && <p className="text-xs text-red-400 mt-1">{errors.vehicleId.message}</p>}
              </div>
              {[
                { name: 'serviceType', label: 'Service Type', placeholder: 'Oil Change' },
                { name: 'description', label: 'Description', placeholder: 'Routine oil change and filter replacement' },
              ].map((f) => (
                <div key={f.name}>
                  <label className="block text-xs font-medium text-muted-foreground mb-1">{f.label}</label>
                  <input {...register(f.name as keyof FormData)} placeholder={f.placeholder} className="form-input" />
                  {errors[f.name as keyof FormData] && <p className="text-xs text-red-400 mt-1">{errors[f.name as keyof FormData]?.message}</p>}
                </div>
              ))}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1">Start Date</label>
                  <input type="date" {...register('startDate')} className="form-input" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1">Estimated Cost (₹)</label>
                  <input type="number" {...register('cost')} placeholder="2500" className="form-input" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">Notes</label>
                <textarea {...register('notes')} placeholder="Additional notes..." className="form-input h-20 resize-none" />
              </div>
              <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/30 text-xs text-amber-400">
                ⚠ Creating this record will automatically set vehicle status to <strong>In Shop</strong>.
              </div>
              <div className="flex justify-end gap-2">
                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 text-sm rounded-lg border border-border hover:bg-muted">Cancel</button>
                <button type="submit" disabled={isSubmitting} className="btn-amber">{isSubmitting ? 'Saving...' : 'Log Service'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Close Modal */}
      {closeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-card border border-border rounded-2xl w-full max-w-md animate-fade-in">
            <div className="flex items-center justify-between p-5 border-b border-border/50">
              <div>
                <h2 className="text-lg font-bold">Close Maintenance</h2>
                <p className="text-sm text-muted-foreground">{(closeModal.vehicle as { name?: string })?.name} - {closeModal.serviceType}</p>
              </div>
              <button onClick={() => setCloseModal(null)} className="p-1.5 rounded hover:bg-muted"><X className="h-4 w-4" /></button>
            </div>
            <form onSubmit={handleClose(onClose)} className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1">End Date</label>
                  <input type="date" {...regClose('endDate')} className="form-input" />
                  {errClose.endDate && <p className="text-xs text-red-400 mt-1">{errClose.endDate.message}</p>}
                </div>
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1">Final Cost (₹)</label>
                  <input type="number" {...regClose('cost')} className="form-input" />
                  {errClose.cost && <p className="text-xs text-red-400 mt-1">{errClose.cost.message}</p>}
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">Closing Notes</label>
                <textarea {...regClose('notes')} placeholder="Work completed..." className="form-input h-20 resize-none" />
              </div>
              <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-xs text-emerald-400">
                ✓ Vehicle will be restored to <strong>Available</strong> status.
              </div>
              <div className="flex justify-end gap-2">
                <button type="button" onClick={() => setCloseModal(null)} className="px-4 py-2 text-sm rounded-lg border border-border hover:bg-muted">Cancel</button>
                <button type="submit" disabled={isClosing} className="btn-amber">{isClosing ? 'Closing...' : 'Close Maintenance'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
