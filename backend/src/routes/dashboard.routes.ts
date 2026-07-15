import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import * as dashboardCtrl from '../controllers/dashboard.controller';
import * as reportsCtrl from '../controllers/reports.controller';

const dashboardRouter = Router();
const reportsRouter = Router();

// Dashboard
dashboardRouter.use(authenticate);
dashboardRouter.get('/kpis', dashboardCtrl.getKPIs);
dashboardRouter.get('/recent-trips', dashboardCtrl.getRecentTrips);
dashboardRouter.get('/vehicle-status', dashboardCtrl.getVehicleStatusChart);
dashboardRouter.get('/driver-status', dashboardCtrl.getDriverStatusChart);
dashboardRouter.get('/monthly-charts', dashboardCtrl.getMonthlyCharts);

// Reports
reportsRouter.use(authenticate);
reportsRouter.get('/fleet-utilization', reportsCtrl.getFleetUtilization);
reportsRouter.get('/operational-cost', reportsCtrl.getOperationalCost);
reportsRouter.get('/export/csv', reportsCtrl.exportCsv);

export { dashboardRouter, reportsRouter };
