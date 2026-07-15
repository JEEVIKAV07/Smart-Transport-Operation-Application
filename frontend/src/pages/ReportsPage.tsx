import { useState, useEffect, useCallback } from 'react';
import { Download, FileDown } from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, RadarChart, Radar, PolarGrid,
  PolarAngleAxis, PolarRadiusAxis, Legend
} from 'recharts';
import { reportsService } from '@/services/api';
import { PageLoader } from '@/components/shared/LoadingSpinner';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { formatCurrency, formatNumber, downloadCsv } from '@/lib/utils';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface VehicleReport {
  vehicleId: string;
  name: string;
  registrationNumber: string;
  type: string;
  status: string;
  totalTrips: number;
  totalDistance: number;
  totalRevenue: number;
  totalFuelLiters: number;
  totalFuelCost: number;
  totalMaintenanceCost: number;
  totalOperationalCost: number;
  fuelEfficiency: number;
  roi: number;
  acquisitionCost: number;
}

export default function ReportsPage() {
  const [data, setData] = useState<VehicleReport[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const load = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await reportsService.getFleetUtilization();
      setData(res.data as VehicleReport[]);
    } catch { } finally { setIsLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleCsvExport = async (entity: string) => {
    try {
      const csvData = await reportsService.exportCsv(entity);
      downloadCsv(csvData, `${entity}_${Date.now()}.csv`);
    } catch { alert('Export failed'); }
  };

  const handlePdfExport = () => {
    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.text('TransitOps — Fleet Utilization Report', 14, 20);
    doc.setFontSize(10);
    doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 28);

    autoTable(doc, {
      startY: 35,
      head: [['Vehicle', 'Type', 'Status', 'Trips', 'Distance', 'Revenue', 'Fuel Cost', 'Maint. Cost', 'ROI%']],
      body: data.map((r) => [
        r.name,
        r.type,
        r.status,
        r.totalTrips,
        `${formatNumber(r.totalDistance)} km`,
        formatCurrency(r.totalRevenue),
        formatCurrency(r.totalFuelCost),
        formatCurrency(r.totalMaintenanceCost),
        `${r.roi.toFixed(1)}%`,
      ]),
      styles: { fontSize: 8 },
      headStyles: { fillColor: [217, 119, 6] },
    });

    doc.save(`fleet_report_${Date.now()}.pdf`);
  };

  const totals = data.reduce((acc, r) => ({
    revenue: acc.revenue + r.totalRevenue,
    fuelCost: acc.fuelCost + r.totalFuelCost,
    maintenanceCost: acc.maintenanceCost + r.totalMaintenanceCost,
    trips: acc.trips + r.totalTrips,
    distance: acc.distance + r.totalDistance,
  }), { revenue: 0, fuelCost: 0, maintenanceCost: 0, trips: 0, distance: 0 });

  if (isLoading) return <PageLoader />;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Analytics & Reports</h1>
          <p className="text-sm text-muted-foreground">Fleet utilization, ROI, operational cost analysis</p>
        </div>
        <div className="flex gap-2">
          <div className="relative group">
            <button className="flex items-center gap-2 px-4 py-2 text-sm rounded-lg border border-amber-500/30 text-amber-400 hover:bg-amber-500/10 transition-colors">
              <Download className="h-4 w-4" /> Export CSV
            </button>
            <div className="absolute right-0 top-full mt-1 bg-card border border-border rounded-lg shadow-xl z-10 hidden group-hover:block min-w-36">
              {['vehicles', 'drivers', 'trips', 'fuel', 'expenses'].map((e) => (
                <button key={e} onClick={() => handleCsvExport(e)} className="block w-full text-left px-3 py-2 text-sm hover:bg-muted capitalize">{e}</button>
              ))}
            </div>
          </div>
          <button onClick={handlePdfExport} className="btn-amber flex items-center gap-2">
            <FileDown className="h-4 w-4" /> Export PDF
          </button>
        </div>
      </div>

      {/* Summary KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {[
          { label: 'Total Revenue', value: formatCurrency(totals.revenue), color: 'text-emerald-400' },
          { label: 'Fuel Cost', value: formatCurrency(totals.fuelCost), color: 'text-amber-400' },
          { label: 'Maintenance Cost', value: formatCurrency(totals.maintenanceCost), color: 'text-red-400' },
          { label: 'Total Trips', value: totals.trips, color: 'text-blue-400' },
          { label: 'Total Distance', value: `${formatNumber(totals.distance)} km`, color: 'text-purple-400' },
        ].map((s) => (
          <div key={s.label} className="glass-card p-4">
            <p className="text-xs text-muted-foreground">{s.label}</p>
            <p className={`text-xl font-bold mt-1 ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Revenue vs Cost Bar Chart */}
      <div className="glass-card p-5">
        <h3 className="text-sm font-semibold text-foreground mb-4">Revenue vs Operational Cost by Vehicle</h3>
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(222 47% 20%)" />
            <XAxis dataKey="name" tick={{ fill: 'hsl(215 20% 55%)', fontSize: 11 }} />
            <YAxis tick={{ fill: 'hsl(215 20% 55%)', fontSize: 11 }} />
            <Tooltip
              contentStyle={{ background: 'hsl(222 47% 14%)', border: '1px solid hsl(222 47% 20%)', borderRadius: 8 }}
            />
            <Legend />
            <Bar dataKey="totalRevenue" name="Revenue (₹)" fill="#10b981" radius={[4, 4, 0, 0]} />
            <Bar dataKey="totalFuelCost" name="Fuel Cost (₹)" fill="#f59e0b" radius={[4, 4, 0, 0]} />
            <Bar dataKey="totalMaintenanceCost" name="Maintenance (₹)" fill="#f43f5e" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Fuel Efficiency Radar */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="glass-card p-5">
          <h3 className="text-sm font-semibold text-foreground mb-4">Fuel Efficiency (km/L) by Vehicle</h3>
          <ResponsiveContainer width="100%" height={250}>
            <RadarChart data={data}>
              <PolarGrid stroke="hsl(222 47% 20%)" />
              <PolarAngleAxis dataKey="name" tick={{ fill: 'hsl(215 20% 55%)', fontSize: 11 }} />
              <PolarRadiusAxis tick={{ fill: 'hsl(215 20% 55%)', fontSize: 10 }} />
              <Radar name="Fuel Efficiency" dataKey="fuelEfficiency" stroke="#f59e0b" fill="#f59e0b" fillOpacity={0.3} />
            </RadarChart>
          </ResponsiveContainer>
        </div>

        {/* ROI Chart */}
        <div className="glass-card p-5">
          <h3 className="text-sm font-semibold text-foreground mb-4">Vehicle ROI (%) — (Revenue - Costs) / Acquisition Cost</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={data} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(222 47% 20%)" />
              <XAxis type="number" tick={{ fill: 'hsl(215 20% 55%)', fontSize: 11 }} unit="%" />
              <YAxis type="category" dataKey="name" tick={{ fill: 'hsl(215 20% 55%)', fontSize: 11 }} />
              <Tooltip
                contentStyle={{ background: 'hsl(222 47% 14%)', border: '1px solid hsl(222 47% 20%)', borderRadius: 8 }}
                formatter={(v: number) => [`${v.toFixed(2)}%`, 'ROI']}
              />
              <Bar dataKey="roi" name="ROI" fill="#10b981" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Detailed Table */}
      <div className="glass-card overflow-hidden">
        <div className="p-5 border-b border-border/50">
          <h3 className="text-sm font-semibold text-foreground">Fleet Performance Details</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="border-b border-border/50 bg-muted/30">
              <tr>
                {['Vehicle', 'Type', 'Status', 'Trips', 'Distance', 'Revenue', 'Fuel', 'Maint.', 'Total Cost', 'Efficiency', 'ROI'].map((h) => (
                  <th key={h} className="px-4 py-3 text-left data-table-header">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.map((r) => (
                <tr key={r.vehicleId} className="border-b border-border/20 hover:bg-muted/20 transition-colors">
                  <td className="px-4 py-3">
                    <div>
                      <p className="font-medium text-sm">{r.name}</p>
                      <p className="text-xs text-muted-foreground font-mono">{r.registrationNumber}</p>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">{r.type}</td>
                  <td className="px-4 py-3"><StatusBadge status={r.status} /></td>
                  <td className="px-4 py-3 text-sm">{r.totalTrips}</td>
                  <td className="px-4 py-3 text-sm">{formatNumber(r.totalDistance)} km</td>
                  <td className="px-4 py-3 text-sm text-emerald-400 font-medium">{formatCurrency(r.totalRevenue)}</td>
                  <td className="px-4 py-3 text-sm text-amber-400">{formatCurrency(r.totalFuelCost)}</td>
                  <td className="px-4 py-3 text-sm text-red-400">{formatCurrency(r.totalMaintenanceCost)}</td>
                  <td className="px-4 py-3 text-sm font-medium">{formatCurrency(r.totalOperationalCost)}</td>
                  <td className="px-4 py-3 text-sm">{r.fuelEfficiency} km/L</td>
                  <td className="px-4 py-3 text-sm">
                    <span className={r.roi >= 0 ? 'text-emerald-400' : 'text-red-400'}>{r.roi.toFixed(1)}%</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
