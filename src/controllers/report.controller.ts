import { Request, Response } from 'express';
import reportService from '../services/report.service';
import { AuthRequest } from '../middlewares/auth.middleware';
import logger from '../config/logger';

/**
 * Get revenue report
 * GET /api/v1/reports/revenue
 */
export const getRevenueReport = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { startDate, endDate, equipmentId, customerId, groupBy } = req.query;

    const options = {
      startDate: startDate ? new Date(startDate as string) : undefined,
      endDate: endDate ? new Date(endDate as string) : undefined,
      equipmentId: equipmentId as string,
      customerId: customerId as string,
      groupBy: (groupBy as 'day' | 'week' | 'month') || 'day',
    };

    const report = await reportService.getRevenueReport(options);

    res.status(200).json({
      status: 'success',
      data: report,
    });
    return;
  } catch (error) {
    logger.error('Get revenue report error:', error);
    throw error;
  }
};

/**
 * Get equipment utilization report
 * GET /api/v1/reports/utilization
 */
export const getUtilizationReport = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { startDate, endDate, equipmentId } = req.query;

    if (!startDate || !endDate) {
      res.status(400).json({
        status: 'error',
        message: 'Start date and end date are required',
      });
      return;
    }

    const options = {
      startDate: new Date(startDate as string),
      endDate: new Date(endDate as string),
      equipmentId: equipmentId as string,
    };

    const report = await reportService.getUtilizationReport(options);

    res.status(200).json({
      status: 'success',
      data: report,
    });
    return;
  } catch (error) {
    logger.error('Get utilization report error:', error);
    throw error;
  }
};

/**
 * Get booking statistics
 * GET /api/v1/reports/bookings
 */
export const getBookingStats = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { startDate, endDate } = req.query;

    const stats = await reportService.getBookingStats(
      startDate ? new Date(startDate as string) : undefined,
      endDate ? new Date(endDate as string) : undefined
    );

    res.status(200).json({
      status: 'success',
      data: stats,
    });
    return;
  } catch (error) {
    logger.error('Get booking stats error:', error);
    throw error;
  }
};

/**
 * Get customer analytics
 * GET /api/v1/reports/customers
 */
export const getCustomerAnalytics = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const analytics = await reportService.getCustomerAnalytics();

    res.status(200).json({
      status: 'success',
      data: analytics,
    });
    return;
  } catch (error) {
    logger.error('Get customer analytics error:', error);
    throw error;
  }
};

/**
 * Get popular equipment
 * GET /api/v1/reports/popular-equipment
 */
export const getPopularEquipment = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { limit } = req.query;
    const limitNumber = limit ? parseInt(limit as string, 10) : 10;

    const popular = await reportService.getPopularEquipment(limitNumber);

    res.status(200).json({
      status: 'success',
      data: popular,
    });
    return;
  } catch (error) {
    logger.error('Get popular equipment error:', error);
    throw error;
  }
};

/**
 * Get dashboard summary
 * GET /api/v1/reports/dashboard
 */
export const getDashboardSummary = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const summary = await reportService.getDashboardSummary();

    res.status(200).json({
      status: 'success',
      data: summary,
    });
    return;
  } catch (error) {
    logger.error('Get dashboard summary error:', error);
    throw error;
  }
};

/**
 * Generate comprehensive report
 * GET /api/v1/reports/comprehensive
 */
export const generateComprehensiveReport = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const { startDate, endDate } = req.query;

    const report = await reportService.generateComprehensiveReport(
      startDate ? new Date(startDate as string) : undefined,
      endDate ? new Date(endDate as string) : undefined
    );

    res.status(200).json({
      status: 'success',
      data: report,
    });
    return;
  } catch (error) {
    logger.error('Generate comprehensive report error:', error);
    throw error;
  }
};
