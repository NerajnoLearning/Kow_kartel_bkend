import { Router } from 'express';
import {
  getRevenueReport,
  getUtilizationReport,
  getBookingStats,
  getCustomerAnalytics,
  getPopularEquipment,
  getDashboardSummary,
  generateComprehensiveReport,
} from '../controllers/report.controller';
import { authenticate } from '../middlewares/auth.middleware';
import { authorize } from '../middlewares/role.middleware';
import { validate } from '../middlewares/validate.middleware';
import {
  revenueReportSchema,
  utilizationReportSchema,
  bookingStatsSchema,
  popularEquipmentSchema,
  comprehensiveReportSchema,
} from '../validators/report.schema';

const router = Router();

// All routes require authentication and admin/logistics role
router.use(authenticate);
router.use(authorize(['admin', 'logistics']));

/**
 * Report endpoints
 */

// GET /api/v1/reports/dashboard - Get dashboard summary
router.get('/dashboard', getDashboardSummary);

// GET /api/v1/reports/revenue - Get revenue report
router.get('/revenue', validate(revenueReportSchema), getRevenueReport);

// GET /api/v1/reports/utilization - Get equipment utilization report
router.get('/utilization', validate(utilizationReportSchema), getUtilizationReport);

// GET /api/v1/reports/bookings - Get booking statistics
router.get('/bookings', validate(bookingStatsSchema), getBookingStats);

// GET /api/v1/reports/customers - Get customer analytics
router.get('/customers', getCustomerAnalytics);

// GET /api/v1/reports/popular-equipment - Get popular equipment
router.get('/popular-equipment', validate(popularEquipmentSchema), getPopularEquipment);

// GET /api/v1/reports/comprehensive - Generate comprehensive report
router.get('/comprehensive', validate(comprehensiveReportSchema), generateComprehensiveReport);

export default router;
