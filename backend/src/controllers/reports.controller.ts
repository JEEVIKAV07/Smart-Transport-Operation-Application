import { Request, Response, NextFunction } from 'express';
import * as reportsService from '../services/reports.service';
import { successResponse } from '../utils/response';

export async function getFleetUtilization(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await reportsService.getFleetUtilizationReport();
    return successResponse(res, data);
  } catch (err) { return next(err); }
}

export async function getOperationalCost(req: Request, res: Response, next: NextFunction) {
  try {
    const { dateFrom, dateTo } = req.query as Record<string, string>;
    const data = await reportsService.getOperationalCostReport(dateFrom, dateTo);
    return successResponse(res, data);
  } catch (err) { return next(err); }
}

export async function exportCsv(req: Request, res: Response, next: NextFunction) {
  try {
    const { entity } = req.query as { entity: string };
    const data = await reportsService.exportCsvData(entity || 'vehicles');

    if (!data.length) {
      return res.status(200).json({ success: true, data: [] });
    }

    const headers = Object.keys(data[0]);
    const csvRows = [
      headers.join(','),
      ...data.map((row) =>
        headers.map((h) => {
          const val = (row as Record<string, unknown>)[h];
          if (val instanceof Date) return val.toISOString();
          if (typeof val === 'object' && val !== null) return JSON.stringify(val);
          return `"${String(val ?? '').replace(/"/g, '""')}"`;
        }).join(',')
      ),
    ];

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="${entity || 'data'}_${Date.now()}.csv"`);
    return res.status(200).send(csvRows.join('\n'));
  } catch (err) { return next(err); }
}
