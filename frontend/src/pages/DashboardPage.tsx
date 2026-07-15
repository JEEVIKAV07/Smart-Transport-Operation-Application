import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  Truck, Users, Route, AlertTriangle,
  TrendingUp, Fuel, Wrench, Activity,
  ArrowRight, Clock
} from 'lucide-react';
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import { dashboardService } from '@/services/api';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { PageLoader } from '@/components/shared/LoadingSpinner';
import { formatCurrency, formatDateTime } from '@/lib/utils';
import type { DashboardKPIs, MonthlyChartData, Trip } from '@/types';

const STATUS_COLORS: Record<string, string> = {
  AVAILABLE: '#10b981',
  ON_TRIP: '#3b82f6',
  IN_SHOP: '#f59e0b',
  RETIRED: '#f43f5e',
};

interface KPICardProps {
  label: string;
  value: string | number;
  icon: React.ElementType;
  color: string;
  sub?: string;
  href?: string;
}

function KPICard({ label, value, icon: Icon, color, sub, href }: KPICardProps) {
  const content = (
    <div className={`kpi-card group ${href ? 'cursor-pointer' : ''}`}>
      <div className="flex items-start justify-between">
        <div className={`p-2 rounded-lg ${color}`}>
          <Icon className="h-4 w-4" />
        </div>
        {href && <ArrowRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />}
      </div>
      <div className="mt-3">
        <p className="text-2xl font-bold text-foreground">{value}</p>
        <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
        {sub && <p className="text-xs text-amber-400 mt-1">{sub}</p>}
      </div>
    </div>
  );

  return href ? <Link to={href}>{content}</Link> : content;
}

export default function DashboardPage() {
  const [kpis, setKpis] = useState<DashboardKPIs | null>(null);
  const [recentTrips, setRecentTrips] = useState<Trip[]>([]);
  const [vehicleStatus, setVehicleStatus] = useState<{ status: string; count: number }[]>([]);
  const [monthlyData, setMonthlyData] = useState<MonthlyChartData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filters, setFilters] = useState({ type: '', status: '', region: '' });

  const load = useCallback(async () => {
    setIsLoading(true);
    try {
      const [kpiRes, tripsRes, statusRes, monthlyRes] = await Promise.all([
        dashboardService.getKPIs(filters),
        dashboardService.getRecentTrips(),
        dashboardService.getVehicleStatus(),
        dashboardService.getMonthlyCharts(),
      ]);
      setKpis(kpiRes.data as DashboardKPIs);
      setRecentTrips(tripsRes.data as Trip[]);
      setVehicleStatus(statusRes.data as { status: string; count: number }[]);
      setMonthlyData(monthlyRes.data as MonthlyChartData[]);
    } catch (err) {
      console.error('Dashboard load error:', err);
    } finally {
      setIsLoading(false);
    }
  }, [filters]);

  useEffect(() => { load(); }, [load]);

  if (isLoading) return <PageLoader />;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
          <p className="text-sm text-muted-foreground">Fleet operations overview</p>
        </div>
        {/* Filters */}
        <div className="flex gap-2 ml-auto flex-wrap">
          {[
            { key: 'type', label: 'Vehicle Type', options: ['', 'VAN', 'TRUCK', 'MINI', 'BUS', 'BIKE', 'PICKUP', 'CONTAINER'] },
            { key: 'status', label: 'Status', options: ['', 'AVAILABLE', 'ON_TRIP', 'IN_SHOP', 'RETIRED'] },
            { key: 'region', label: 'Region', options: ['', 'North', 'South', 'East', 'West'] },
          ].map((f) => (
            <select
              key={f.key}
              value={filters[f.key as keyof typeof filters]}
              onChange={(e) => setFilters((prev) => ({ ...prev, [f.key]: e.target.value }))}
              className="text-xs bg-input border border-border rounded-lg px-2 py-1.5 text-foreground focus:outline-none focus:ring-1 focus:ring-amber-500/50"
            >
              {f.options.map((opt) => (
                <option key={opt} value={opt}>{opt || `${f.label}: All`}</option>
              ))}
            </select>
          ))}
        </div>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
        <KPICard
          label="Active Vehicles"
          value={kpis?.totalVehicles || 0}
          icon={Truck}
          color="bg-amber-500/20 text-amber-400"
          href="/vehicles"
        />
        <KPICard
          label="Available"
          value={kpis?.availableVehicles || 0}
          icon={Truck}
          color="bg-emerald-500/20 text-emerald-400"
          sub={`${kpis?.fleetUtilization || 0}% utilization`}
        />
        <KPICard
          label="In Maintenance"
          value={kpis?.inShopVehicles || 0}
          icon={Wrench}
          color="bg-amber-500/20 text-amber-400"
          href="/maintenance"
        />
        <KPICard
          label="Active Trips"
          value={kpis?.activeTrips || 0}
          icon={Route}
          color="bg-blue-500/20 text-blue-400"
          href="/trips"
        />
        <KPICard
          label="Pending Trips"
          value={kpis?.pendingTrips || 0}
          icon={Clock}
          color="bg-slate-500/20 text-slate-400"
        />
        <KPICard
          label="Drivers On Duty"
          value={kpis?.driversOnDuty || 0}
          icon={Users}
          color="bg-purple-500/20 text-purple-400"
          href="/drivers"
        />
        <KPICard
          label="Fleet Utilization"
          value={`${kpis?.fleetUtilization || 0}%`}
          icon={Activity}
          color="bg-rose-500/20 text-rose-400"
        />
      </div>

      {/* Revenue & Cost KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <KPICard
          label="Monthly Revenue"
          value={formatCurrency(kpis?.monthlyRevenue || 0)}
          icon={TrendingUp}
          color="bg-emerald-500/20 text-emerald-400"
        />
        <KPICard
          label="Total Fuel Cost"
          value={formatCurrency(kpis?.totalFuelCost || 0)}
          icon={Fuel}
          color="bg-amber-500/20 text-amber-400"
          href="/fuel"
        />
        <KPICard
          label="Maintenance Cost"
          value={formatCurrency(kpis?.totalMaintenanceCost || 0)}
          icon={AlertTriangle}
          color="bg-red-500/20 text-red-400"
          href="/maintenance"
        />
      </div>

      {/* Charts + Recent Trips */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Monthly Trips & Revenue Chart */}
        <div className="lg:col-span-2 glass-card p-5">
          <h3 className="text-sm font-semibold text-foreground mb-4">Monthly Trips & Revenue</h3>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={monthlyData}>
              <defs>
                <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="tripsGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(222 47% 20%)" />
              <XAxis dataKey="month" tick={{ fill: 'hsl(215 20% 55%)', fontSize: 11 }} />
              <YAxis tick={{ fill: 'hsl(215 20% 55%)', fontSize: 11 }} />
              <Tooltip
                contentStyle={{ background: 'hsl(222 47% 14%)', border: '1px solid hsl(222 47% 20%)', borderRadius: 8 }}
                labelStyle={{ color: 'hsl(213 31% 91%)' }}
              />
              <Legend />
              <Area type="monotone" dataKey="revenue" stroke="#f59e0b" fill="url(#revenueGrad)" name="Revenue (₹)" />
              <Area type="monotone" dataKey="trips" stroke="#3b82f6" fill="url(#tripsGrad)" name="Trips" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Vehicle Status Pie */}
        <div className="glass-card p-5">
          <h3 className="text-sm font-semibold text-foreground mb-4">Vehicle Status</h3>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie
                data={vehicleStatus}
                cx="50%"
                cy="50%"
                innerRadius={55}
                outerRadius={80}
                dataKey="count"
                nameKey="status"
              >
                {vehicleStatus.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={STATUS_COLORS[entry.status] || '#6b7280'}
                  />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{ background: 'hsl(222 47% 14%)', border: '1px solid hsl(222 47% 20%)', borderRadius: 8 }}
              />
            </PieChart>
          </ResponsiveContainer>
          <div className="space-y-1.5 mt-2">
            {vehicleStatus.map((item) => (
              <div key={item.status} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-1.5">
                  <div className="h-2 w-2 rounded-full" style={{ backgroundColor: STATUS_COLORS[item.status] }} />
                  <span className="text-muted-foreground capitalize">{item.status.replace('_', ' ')}</span>
                </div>
                <span className="font-medium text-foreground">{item.count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Fuel Chart */}
      <div className="glass-card p-5">
        <h3 className="text-sm font-semibold text-foreground mb-4">Monthly Fuel Usage</h3>
        <ResponsiveContainer width="100%" height={180}>
          <BarChart data={monthlyData}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(222 47% 20%)" />
            <XAxis dataKey="month" tick={{ fill: 'hsl(215 20% 55%)', fontSize: 11 }} />
            <YAxis tick={{ fill: 'hsl(215 20% 55%)', fontSize: 11 }} />
            <Tooltip
              contentStyle={{ background: 'hsl(222 47% 14%)', border: '1px solid hsl(222 47% 20%)', borderRadius: 8 }}
            />
            <Bar dataKey="fuelLiters" fill="#f59e0b" name="Fuel (L)" radius={[4, 4, 0, 0]} />
            <Bar dataKey="fuelCost" fill="#d97706" name="Cost (₹)" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Recent Trips */}
      <div className="glass-card p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-foreground">Recent Trips</h3>
          <Link to="/trips" className="text-xs text-amber-400 hover:text-amber-300 flex items-center gap-1">
            View all <ArrowRight className="h-3 w-3" />
          </Link>
        </div>
        <div className="space-y-0 overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border/30">
                {['Trip', 'Vehicle', 'Driver', 'Status', 'Start Time'].map((h) => (
                  <th key={h} className="text-left px-3 py-2 data-table-header">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {recentTrips.slice(0, 8).map((trip) => (
                <tr key={trip.id} className="border-b border-border/20 hover:bg-muted/20 transition-colors">
                  <td className="px-3 py-2.5 text-sm font-medium text-amber-400">{trip.tripNumber}</td>
                  <td className="px-3 py-2.5 text-sm">{(trip.vehicle as { name?: string })?.name || '—'}</td>
                  <td className="px-3 py-2.5 text-sm">{(trip.driver as { name?: string })?.name || '—'}</td>
                  <td className="px-3 py-2.5"><StatusBadge status={trip.status} /></td>
                  <td className="px-3 py-2.5 text-sm text-muted-foreground">{formatDateTime(trip.startTime)}</td>
                </tr>
              ))}
              {recentTrips.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-3 py-8 text-center text-sm text-muted-foreground">
                    No trips yet
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
