import { useState, useEffect, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Plus, X, CheckCircle, XCircle, Send, Search, AlertCircle } from 'lucide-react';
import { tripService, vehicleService, driverService } from '@/services/api';
import { DataTable } from '@/components/shared/DataTable';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { formatDateTime, formatCurrency } from '@/lib/utils';
import type { Trip, Vehicle, Driver } from '@/types';

const schema = z.object({
  source: z.string().min(1, 'Required'),
  destination: z.string().min(1, 'Required'),
  vehicleId: z.string().min(1, 'Required'),
  driverId: z.string().optional().nullable(),
  cargoWeight: z.coerce.number().positive('Must be positive'),
  distance: z.coerce.number().positive('Must be positive'),
  revenue: z.coerce.number().optional(),
  notes: z.string().optional(),
});

const completeSchema = z.object({
  fuelUsed: z.coerce.number().positive('Required'),
  endOdometer: z.coerce.number().positive('Required'),
  revenue: z.coerce.number().optional(),
  notes: z.string().optional(),
});

type FormData = z.infer<typeof schema>;
type CompleteData = z.infer<typeof completeSchema>;

const LIFECYCLE_STEPS = ['DRAFT', 'DISPATCHED', 'COMPLETED', 'CANCELLED'];

export default function TripsPage() {
  const [trips, setTrips] = useState<Trip[]>([]);
  const [meta, setMeta] = useState<{ page: number; totalPages: number; total: number; hasNext: boolean; hasPrev: boolean } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [completeModal, setCompleteModal] = useState<Trip | null>(null);
  const [availableVehicles, setAvailableVehicles] = useState<Vehicle[]>([]);
  const [availableDrivers, setAvailableDrivers] = useState<Driver[]>([]);
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
  const [serverError, setServerError] = useState('');
  const [params, setParams] = useState({ page: 1, limit: 15, search: '', status: '', sortBy: 'createdAt', sortOrder: 'desc' });

  const { register, handleSubmit, reset, watch, formState: { errors, isSubmitting } } = useForm<FormData>({ resolver: zodResolver(schema) });
  const { register: regComplete, handleSubmit: handleComplete, reset: resetComplete, formState: { errors: errComplete, isSubmitting: isCompleting } } = useForm<CompleteData>({ resolver: zodResolver(completeSchema) });

  const cargoWeight = watch('cargoWeight');
  const vehicleId = watch('vehicleId');

  const load = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await tripService.list(params as Record<string, unknown>);
      setTrips(res.data as Trip[]);
      setMeta(res.meta);
    } catch { } finally { setIsLoading(false); }
  }, [params]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    if (vehicleId && availableVehicles.length) {
      setSelectedVehicle(availableVehicles.find((v) => v.id === vehicleId) || null);
    } else {
      setSelectedVehicle(null);
    }
  }, [vehicleId, availableVehicles]);

  const openCreate = async () => {
    setServerError('');
    reset({});
    try {
      const [vRes, dRes] = await Promise.all([vehicleService.getAvailable(), driverService.getAvailable()]);
      setAvailableVehicles(vRes.data as Vehicle[]);
      setAvailableDrivers(dRes.data as Driver[]);
    } catch { }
    setShowModal(true);
  };

  const onSubmit = async (data: FormData) => {
    setServerError('');
    try {
      await tripService.create({ ...data, driverId: data.driverId || null });
      setShowModal(false);
      load();
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      setServerError(e.response?.data?.message || 'Error occurred');
    }
  };

  const handleDispatch = async (id: string) => {
    try { await tripService.dispatch(id); load(); } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      alert(e.response?.data?.message || 'Dispatch failed');
    }
  };

  const handleCancel = async (id: string) => {
    if (!confirm('Cancel this trip?')) return;
    try { await tripService.cancel(id); load(); } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      alert(e.response?.data?.message || 'Cancel failed');
    }
  };

  const onComplete = async (data: CompleteData) => {
    if (!completeModal) return;
    try { await tripService.complete(completeModal.id, data); setCompleteModal(null); load(); } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      alert(e.response?.data?.message || 'Complete failed');
    }
  };

  const capacityExceeded = selectedVehicle && cargoWeight > selectedVehicle.maxLoad;

  const columns = [
    { key: 'tripNumber', header: 'Trip', sortable: true, render: (r: Trip) => <span className="font-mono text-amber-400 font-medium">{r.tripNumber}</span> },
    {
      key: 'route', header: 'Route', render: (r: Trip) => (
        <div className="text-sm">
          <p className="font-medium">{r.source}</p>
          <p className="text-muted-foreground text-xs">→ {r.destination}</p>
        </div>
      )
    },
    { key: 'vehicle', header: 'Vehicle', render: (r: Trip) => (r.vehicle as { name?: string })?.name || '—' },
    { key: 'driver', header: 'Driver', render: (r: Trip) => (r.driver as { name?: string })?.name || '—' },
    { key: 'cargoWeight', header: 'Cargo', render: (r: Trip) => `${r.cargoWeight} kg` },
    { key: 'status', header: 'Status', render: (r: Trip) => <StatusBadge status={r.status} /> },
    { key: 'startTime', header: 'Start', sortable: true, render: (r: Trip) => <span className="text-xs text-muted-foreground">{formatDateTime(r.startTime)}</span> },
    {
      key: 'actions', header: 'Actions', render: (r: Trip) => (
        <div className="flex items-center gap-1">
          {r.status === 'DRAFT' && (
            <button onClick={() => handleDispatch(r.id)} className="p-1.5 rounded hover:bg-blue-500/20 text-blue-400 hover:text-blue-300" title="Dispatch">
              <Send className="h-3.5 w-3.5" />
            </button>
          )}
          {r.status === 'DISPATCHED' && (
            <button onClick={() => { setCompleteModal(r); resetComplete({}); }} className="p-1.5 rounded hover:bg-emerald-500/20 text-emerald-400" title="Complete">
              <CheckCircle className="h-3.5 w-3.5" />
            </button>
          )}
          {['DRAFT', 'DISPATCHED'].includes(r.status) && (
            <button onClick={() => handleCancel(r.id)} className="p-1.5 rounded hover:bg-red-500/20 text-red-400" title="Cancel">
              <XCircle className="h-3.5 w-3.5" />
            </button>
          )}
          {r.revenue && <span className="text-xs text-emerald-400">{formatCurrency(r.revenue)}</span>}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Trip Dispatcher</h1>
          <p className="text-sm text-muted-foreground">On Complete: odometer → fuel log → Vehicle & Driver Available</p>
        </div>
        <button onClick={openCreate} className="btn-amber flex items-center gap-2">
          <Plus className="h-4 w-4" /> Create Trip
        </button>
      </div>

      {/* Trip Lifecycle indicator */}
      <div className="glass-card p-4">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Trip Lifecycle</p>
        <div className="flex items-center gap-2">
          {LIFECYCLE_STEPS.map((step, i) => (
            <div key={step} className="flex items-center gap-2">
              <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${
                step === 'DRAFT' ? 'bg-slate-500/20 text-slate-400' :
                step === 'DISPATCHED' ? 'bg-blue-500/20 text-blue-400' :
                step === 'COMPLETED' ? 'bg-emerald-500/20 text-emerald-400' :
                'bg-red-500/20 text-red-400'
              }`}>
                {step}
              </div>
              {i < LIFECYCLE_STEPS.length - 1 && <span className="text-muted-foreground text-xs">→</span>}
            </div>
          ))}
        </div>
      </div>

      <div className="glass-card p-4 flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input placeholder="Search trip, route..." className="form-input pl-9" value={params.search} onChange={(e) => setParams((p) => ({ ...p, search: e.target.value, page: 1 }))} />
        </div>
        <select value={params.status} onChange={(e) => setParams((p) => ({ ...p, status: e.target.value, page: 1 }))} className="form-input w-40">
          {['', 'DRAFT', 'DISPATCHED', 'COMPLETED', 'CANCELLED'].map((s) => <option key={s} value={s}>{s || 'Status: All'}</option>)}
        </select>
      </div>

      <DataTable
        columns={columns as never[]}
        data={trips as unknown as Record<string, unknown>[]}
        isLoading={isLoading}
        emptyMessage="No trips found"
        meta={meta || undefined}
        onPageChange={(p) => setParams((prev) => ({ ...prev, page: p }))}
        onSort={(k, o) => setParams((prev) => ({ ...prev, sortBy: k, sortOrder: o }))}
      />

      {/* Create Trip Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-card border border-border rounded-2xl w-full max-w-xl max-h-[90vh] overflow-y-auto animate-fade-in">
            <div className="flex items-center justify-between p-5 border-b border-border/50">
              <h2 className="text-lg font-bold">Create Trip</h2>
              <button onClick={() => setShowModal(false)} className="p-1.5 rounded hover:bg-muted"><X className="h-4 w-4" /></button>
            </div>
            <form onSubmit={handleSubmit(onSubmit)} className="p-5 space-y-4">
              {serverError && (
                <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 flex items-start gap-2 text-sm text-red-400">
                  <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />{serverError}
                </div>
              )}
              <div className="grid grid-cols-2 gap-4">
                {[
                  { name: 'source', label: 'Source', placeholder: 'Gandhinagar Depot' },
                  { name: 'destination', label: 'Destination', placeholder: 'Ahmedabad Hub' },
                ].map((f) => (
                  <div key={f.name}>
                    <label className="block text-xs font-medium text-muted-foreground mb-1">{f.label}</label>
                    <input {...register(f.name as keyof FormData)} placeholder={f.placeholder} className="form-input" />
                    {errors[f.name as keyof FormData] && <p className="text-xs text-red-400 mt-1">{errors[f.name as keyof FormData]?.message}</p>}
                  </div>
                ))}
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1">Vehicle (Available Only)</label>
                  <select {...register('vehicleId')} className="form-input">
                    <option value="">Select vehicle...</option>
                    {availableVehicles.map((v) => (
                      <option key={v.id} value={v.id}>{v.name} - {v.maxLoad}kg cap.</option>
                    ))}
                  </select>
                  {errors.vehicleId && <p className="text-xs text-red-400 mt-1">{errors.vehicleId.message}</p>}
                </div>
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1">Driver (Available Only)</label>
                  <select {...register('driverId')} className="form-input">
                    <option value="">Select driver (optional)...</option>
                    {availableDrivers.map((d) => (
                      <option key={d.id} value={d.id}>{d.name} - {d.licenseCategory}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1">Cargo Weight (kg)</label>
                  <input type="number" {...register('cargoWeight')} placeholder="450" className={`form-input ${capacityExceeded ? 'border-red-500/50' : ''}`} />
                  {errors.cargoWeight && <p className="text-xs text-red-400 mt-1">{errors.cargoWeight.message}</p>}
                </div>
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1">Planned Distance (km)</label>
                  <input type="number" {...register('distance')} placeholder="38" className="form-input" />
                  {errors.distance && <p className="text-xs text-red-400 mt-1">{errors.distance.message}</p>}
                </div>
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1">Revenue (₹)</label>
                  <input type="number" {...register('revenue')} placeholder="5000" className="form-input" />
                </div>
              </div>

              {/* Capacity Warning */}
              {selectedVehicle && (
                <div className={`p-3 rounded-lg text-sm ${capacityExceeded ? 'bg-red-500/10 border border-red-500/30 text-red-400' : 'bg-muted/50 border border-border text-muted-foreground'}`}>
                  <p>Vehicle Capacity: <strong>{selectedVehicle.maxLoad} kg</strong></p>
                  {cargoWeight && <p>Cargo Weight: <strong>{cargoWeight} kg</strong></p>}
                  {capacityExceeded && (
                    <p className="mt-1 flex items-center gap-1.5">
                      <XCircle className="h-4 w-4" />
                      Capacity exceeded by {Number(cargoWeight) - selectedVehicle.maxLoad} kg — dispatch will be blocked
                    </p>
                  )}
                </div>
              )}

              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 text-sm rounded-lg border border-border hover:bg-muted">Cancel</button>
                <button type="submit" disabled={isSubmitting} className="btn-amber">
                  {isSubmitting ? 'Creating...' : 'Create Trip'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Complete Trip Modal */}
      {completeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-card border border-border rounded-2xl w-full max-w-md animate-fade-in">
            <div className="flex items-center justify-between p-5 border-b border-border/50">
              <div>
                <h2 className="text-lg font-bold">Complete Trip</h2>
                <p className="text-sm text-muted-foreground">{completeModal.tripNumber}: {completeModal.source} → {completeModal.destination}</p>
              </div>
              <button onClick={() => setCompleteModal(null)} className="p-1.5 rounded hover:bg-muted"><X className="h-4 w-4" /></button>
            </div>
            <form onSubmit={handleComplete(onComplete)} className="p-5 space-y-4">
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1">Fuel Used (Liters)</label>
                  <input type="number" step="0.1" {...regComplete('fuelUsed')} placeholder="42" className="form-input" />
                  {errComplete.fuelUsed && <p className="text-xs text-red-400 mt-1">{errComplete.fuelUsed.message}</p>}
                </div>
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1">End Odometer (km)</label>
                  <input type="number" {...regComplete('endOdometer')} placeholder="74038" className="form-input" />
                  {errComplete.endOdometer && <p className="text-xs text-red-400 mt-1">{errComplete.endOdometer.message}</p>}
                </div>
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1">Final Revenue (₹)</label>
                  <input type="number" {...regComplete('revenue')} placeholder="5000" className="form-input" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1">Notes</label>
                  <textarea {...regComplete('notes')} placeholder="Delivery notes..." className="form-input h-20 resize-none" />
                </div>
              </div>
              <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-xs text-emerald-400">
                ✓ Vehicle & Driver will be set back to Available automatically.
              </div>
              <div className="flex justify-end gap-2">
                <button type="button" onClick={() => setCompleteModal(null)} className="px-4 py-2 text-sm rounded-lg border border-border hover:bg-muted">Cancel</button>
                <button type="submit" disabled={isCompleting} className="btn-amber">
                  {isCompleting ? 'Completing...' : 'Complete Trip'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
