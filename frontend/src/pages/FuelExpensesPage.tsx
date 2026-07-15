import { useState, useEffect, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Plus, X, Trash2, Search } from 'lucide-react';
import { fuelService, expenseService, vehicleService } from '@/services/api';
import { DataTable } from '@/components/shared/DataTable';
import { formatDate, formatCurrency } from '@/lib/utils';
import type { FuelLog, Expense, Vehicle } from '@/types';

const fuelSchema = z.object({
  vehicleId: z.string().min(1, 'Required'),
  liters: z.coerce.number().positive('Required'),
  cost: z.coerce.number().positive('Required'),
  fuelStation: z.string().optional(),
  date: z.string().min(1, 'Required'),
});

const expenseSchema = z.object({
  vehicleId: z.string().min(1, 'Required'),
  category: z.enum(['TOLL', 'MAINTENANCE', 'FINE', 'PERMIT', 'INSURANCE', 'OTHER']),
  description: z.string().min(1, 'Required'),
  amount: z.coerce.number().positive('Required'),
  date: z.string().min(1, 'Required'),
});

type FuelData = z.infer<typeof fuelSchema>;
type ExpenseData = z.infer<typeof expenseSchema>;

export default function FuelExpensesPage() {
  const [fuelLogs, setFuelLogs] = useState<FuelLog[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [fuelMeta, setFuelMeta] = useState<{ page: number; totalPages: number; total: number; hasNext: boolean; hasPrev: boolean } | null>(null);
  const [expenseMeta, setExpenseMeta] = useState<{ page: number; totalPages: number; total: number; hasNext: boolean; hasPrev: boolean } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showFuelModal, setShowFuelModal] = useState(false);
  const [showExpenseModal, setShowExpenseModal] = useState(false);
  const [fuelParams, setFuelParams] = useState({ page: 1, limit: 10 });
  const [expenseParams, setExpenseParams] = useState({ page: 1, limit: 10 });
  const [totalFuel, setTotalFuel] = useState(0);
  const [totalExpense, setTotalExpense] = useState(0);

  const { register: regFuel, handleSubmit: handleFuel, reset: resetFuel, formState: { errors: errFuel, isSubmitting: isSubmFuel } } = useForm<FuelData>({ resolver: zodResolver(fuelSchema) });
  const { register: regExp, handleSubmit: handleExp, reset: resetExp, formState: { errors: errExp, isSubmitting: isSubmExp } } = useForm<ExpenseData>({ resolver: zodResolver(expenseSchema) });

  const load = useCallback(async () => {
    setIsLoading(true);
    try {
      const [fRes, eRes, vRes] = await Promise.all([
        fuelService.list(fuelParams as Record<string, unknown>),
        expenseService.list(expenseParams as Record<string, unknown>),
        vehicleService.list({ limit: 100 } as Record<string, unknown>),
      ]);
      const fuelData = fRes.data as FuelLog[];
      const expData = eRes.data as Expense[];
      setFuelLogs(fuelData);
      setFuelMeta(fRes.meta);
      setExpenses(expData);
      setExpenseMeta(eRes.meta);
      setVehicles(vRes.data as Vehicle[]);
      setTotalFuel(fuelData.reduce((s, f) => s + f.cost, 0));
      setTotalExpense(expData.reduce((s, e) => s + e.amount, 0));
    } catch { } finally { setIsLoading(false); }
  }, [fuelParams, expenseParams]);

  useEffect(() => { load(); }, [load]);

  const onFuelSubmit = async (data: FuelData) => {
    try { await fuelService.create(data); setShowFuelModal(false); resetFuel({}); load(); } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      alert(e.response?.data?.message || 'Error');
    }
  };

  const onExpenseSubmit = async (data: ExpenseData) => {
    try { await expenseService.create(data); setShowExpenseModal(false); resetExp({}); load(); } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      alert(e.response?.data?.message || 'Error');
    }
  };

  const deleteFuel = async (id: string) => {
    if (!confirm('Delete fuel log?')) return;
    try { await fuelService.delete(id); load(); } catch { }
  };

  const deleteExpense = async (id: string) => {
    if (!confirm('Delete expense?')) return;
    try { await expenseService.delete(id); load(); } catch { }
  };

  const fuelColumns = [
    { key: 'vehicle', header: 'Vehicle', render: (r: FuelLog) => (r.vehicle as { name?: string })?.name || '—' },
    { key: 'date', header: 'Date', render: (r: FuelLog) => formatDate(r.date) },
    { key: 'liters', header: 'Liters', render: (r: FuelLog) => <span>{r.liters} L</span> },
    { key: 'cost', header: 'Fuel Cost', render: (r: FuelLog) => <span className="text-amber-400 font-medium">{formatCurrency(r.cost)}</span> },
    { key: 'fuelStation', header: 'Station', render: (r: FuelLog) => <span className="text-sm text-muted-foreground">{r.fuelStation || '—'}</span> },
    { key: 'trip', header: 'Trip', render: (r: FuelLog) => (r.trip as { tripNumber?: string })?.tripNumber || '—' },
    { key: 'del', header: '', render: (r: FuelLog) => <button onClick={() => deleteFuel(r.id)} className="p-1.5 rounded hover:bg-red-500/20 text-muted-foreground hover:text-red-400"><Trash2 className="h-3.5 w-3.5" /></button> },
  ];

  const expenseColumns = [
    { key: 'vehicle', header: 'Vehicle', render: (r: Expense) => (r.vehicle as { name?: string })?.name || '—' },
    { key: 'date', header: 'Date', render: (r: Expense) => formatDate(r.date) },
    { key: 'category', header: 'Category', render: (r: Expense) => <span className="text-xs px-2 py-0.5 rounded bg-muted text-muted-foreground">{r.category}</span> },
    { key: 'description', header: 'Description', render: (r: Expense) => r.description },
    { key: 'amount', header: 'Amount', render: (r: Expense) => <span className="text-amber-400 font-medium">{formatCurrency(r.amount)}</span> },
    { key: 'trip', header: 'Trip', render: (r: Expense) => (r.trip as { tripNumber?: string })?.tripNumber || '—' },
    { key: 'del', header: '', render: (r: Expense) => <button onClick={() => deleteExpense(r.id)} className="p-1.5 rounded hover:bg-red-500/20 text-muted-foreground hover:text-red-400"><Trash2 className="h-3.5 w-3.5" /></button> },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Fuel & Expense Management</h1>
          <p className="text-sm text-muted-foreground">Total Operational Cost (Auto) = Fuel + Maintenance</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => { resetFuel({ date: new Date().toISOString().slice(0, 10) }); setShowFuelModal(true); }} className="btn-amber flex items-center gap-2">
            <Plus className="h-4 w-4" /> Log Fuel
          </button>
          <button onClick={() => { resetExp({ date: new Date().toISOString().slice(0, 10) }); setShowExpenseModal(true); }} className="flex items-center gap-2 px-4 py-2 text-sm rounded-lg border border-amber-500/30 text-amber-400 hover:bg-amber-500/10 transition-colors">
            <Plus className="h-4 w-4" /> Add Expense
          </button>
        </div>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { label: 'Total Fuel Cost', value: formatCurrency(totalFuel), color: 'text-amber-400' },
          { label: 'Total Expenses', value: formatCurrency(totalExpense), color: 'text-blue-400' },
          { label: 'Total Operational Cost', value: formatCurrency(totalFuel + totalExpense), color: 'text-emerald-400' },
        ].map((s) => (
          <div key={s.label} className="glass-card p-4">
            <p className="text-xs text-muted-foreground">{s.label}</p>
            <p className={`text-2xl font-bold mt-1 ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Fuel Logs */}
      <div className="space-y-3">
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Fuel Logs</h2>
        <DataTable
          columns={fuelColumns as never[]}
          data={fuelLogs as unknown as Record<string, unknown>[]}
          isLoading={isLoading}
          emptyMessage="No fuel logs"
          meta={fuelMeta || undefined}
          onPageChange={(p) => setFuelParams((prev) => ({ ...prev, page: p }))}
        />
      </div>

      {/* Expenses */}
      <div className="space-y-3">
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Other Expenses (Toll / Misc)</h2>
        <DataTable
          columns={expenseColumns as never[]}
          data={expenses as unknown as Record<string, unknown>[]}
          isLoading={isLoading}
          emptyMessage="No expenses"
          meta={expenseMeta || undefined}
          onPageChange={(p) => setExpenseParams((prev) => ({ ...prev, page: p }))}
        />
      </div>

      {/* Fuel Modal */}
      {showFuelModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-card border border-border rounded-2xl w-full max-w-md animate-fade-in">
            <div className="flex items-center justify-between p-5 border-b border-border/50">
              <h2 className="text-lg font-bold">Log Fuel</h2>
              <button onClick={() => setShowFuelModal(false)} className="p-1.5 rounded hover:bg-muted"><X className="h-4 w-4" /></button>
            </div>
            <form onSubmit={handleFuel(onFuelSubmit)} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">Vehicle</label>
                <select {...regFuel('vehicleId')} className="form-input">
                  <option value="">Select vehicle...</option>
                  {vehicles.map((v) => <option key={v.id} value={v.id}>{v.name}</option>)}
                </select>
                {errFuel.vehicleId && <p className="text-xs text-red-400 mt-1">{errFuel.vehicleId.message}</p>}
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1">Liters</label>
                  <input type="number" step="0.1" {...regFuel('liters')} placeholder="42" className="form-input" />
                  {errFuel.liters && <p className="text-xs text-red-400 mt-1">{errFuel.liters.message}</p>}
                </div>
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1">Cost (₹)</label>
                  <input type="number" {...regFuel('cost')} placeholder="3150" className="form-input" />
                  {errFuel.cost && <p className="text-xs text-red-400 mt-1">{errFuel.cost.message}</p>}
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">Fuel Station</label>
                <input {...regFuel('fuelStation')} placeholder="HP Fuel Station, Gandhinagar" className="form-input" />
              </div>
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">Date</label>
                <input type="date" {...regFuel('date')} className="form-input" />
              </div>
              <div className="flex justify-end gap-2">
                <button type="button" onClick={() => setShowFuelModal(false)} className="px-4 py-2 text-sm rounded-lg border border-border hover:bg-muted">Cancel</button>
                <button type="submit" disabled={isSubmFuel} className="btn-amber">{isSubmFuel ? 'Saving...' : 'Log Fuel'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Expense Modal */}
      {showExpenseModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-card border border-border rounded-2xl w-full max-w-md animate-fade-in">
            <div className="flex items-center justify-between p-5 border-b border-border/50">
              <h2 className="text-lg font-bold">Add Expense</h2>
              <button onClick={() => setShowExpenseModal(false)} className="p-1.5 rounded hover:bg-muted"><X className="h-4 w-4" /></button>
            </div>
            <form onSubmit={handleExp(onExpenseSubmit)} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">Vehicle</label>
                <select {...regExp('vehicleId')} className="form-input">
                  <option value="">Select vehicle...</option>
                  {vehicles.map((v) => <option key={v.id} value={v.id}>{v.name}</option>)}
                </select>
                {errExp.vehicleId && <p className="text-xs text-red-400 mt-1">{errExp.vehicleId.message}</p>}
              </div>
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">Category</label>
                <select {...regExp('category')} className="form-input">
                  {['TOLL', 'MAINTENANCE', 'FINE', 'PERMIT', 'INSURANCE', 'OTHER'].map((c) => <option key={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">Description</label>
                <input {...regExp('description')} placeholder="Expressway toll" className="form-input" />
                {errExp.description && <p className="text-xs text-red-400 mt-1">{errExp.description.message}</p>}
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1">Amount (₹)</label>
                  <input type="number" {...regExp('amount')} placeholder="120" className="form-input" />
                  {errExp.amount && <p className="text-xs text-red-400 mt-1">{errExp.amount.message}</p>}
                </div>
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1">Date</label>
                  <input type="date" {...regExp('date')} className="form-input" />
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <button type="button" onClick={() => setShowExpenseModal(false)} className="px-4 py-2 text-sm rounded-lg border border-border hover:bg-muted">Cancel</button>
                <button type="submit" disabled={isSubmExp} className="btn-amber">{isSubmExp ? 'Saving...' : 'Add Expense'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
