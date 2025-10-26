import reportRepository from '../repositories/report.repository';
import { ValidationError } from '../utils/errorHandler';

export interface RevenueReportOptions {
  startDate?: Date;
  endDate?: Date;
  equipmentId?: string;
  customerId?: string;
  groupBy?: 'day' | 'week' | 'month';
}

export interface UtilizationReportOptions {
  startDate: Date;
  endDate: Date;
  equipmentId?: string;
}

export class ReportService {
  /**
   * Get revenue report
   */
  async getRevenueReport(options: RevenueReportOptions = {}) {
    const { startDate, endDate, equipmentId, customerId, groupBy } = options;

    // Validate date range
    if (startDate && endDate && startDate > endDate) {
      throw new ValidationError('Start date must be before end date');
    }

    // Get overall revenue stats
    const stats = await reportRepository.getRevenueStats({
      startDate,
      endDate,
      equipmentId,
      customerId,
    });

    // Get revenue breakdown by date if date range is provided
    let revenueByDate: any[] = [];
    if (startDate && endDate) {
      revenueByDate = await reportRepository.getRevenueByDateRange(
        startDate,
        endDate,
        groupBy || 'day'
      );
    }

    return {
      summary: stats,
      breakdown: revenueByDate,
    };
  }

  /**
   * Get equipment utilization report
   */
  async getUtilizationReport(options: UtilizationReportOptions) {
    const { startDate, endDate, equipmentId } = options;

    // Validate date range
    if (startDate > endDate) {
      throw new ValidationError('Start date must be before end date');
    }

    // Check if date range is not too large (e.g., max 1 year)
    const oneYear = 365 * 24 * 60 * 60 * 1000;
    if (endDate.getTime() - startDate.getTime() > oneYear) {
      throw new ValidationError('Date range cannot exceed 1 year');
    }

    const utilization = await reportRepository.getEquipmentUtilization({
      startDate,
      endDate,
      equipmentId,
    });

    return utilization;
  }

  /**
   * Get booking statistics
   */
  async getBookingStats(startDate?: Date, endDate?: Date) {
    // Validate date range
    if (startDate && endDate && startDate > endDate) {
      throw new ValidationError('Start date must be before end date');
    }

    const statsByStatus = await reportRepository.getBookingStatsByStatus(startDate, endDate);

    // Calculate totals
    const totals = statsByStatus.reduce(
      (acc, stat) => {
        acc.totalCount += stat.count;
        acc.totalAmount += stat.totalAmount;
        return acc;
      },
      { totalCount: 0, totalAmount: 0 }
    );

    return {
      byStatus: statsByStatus,
      totals,
    };
  }

  /**
   * Get customer analytics
   */
  async getCustomerAnalytics() {
    return await reportRepository.getCustomerAnalytics();
  }

  /**
   * Get popular equipment
   */
  async getPopularEquipment(limit: number = 10) {
    if (limit < 1 || limit > 50) {
      throw new ValidationError('Limit must be between 1 and 50');
    }

    return await reportRepository.getPopularEquipment(limit);
  }

  /**
   * Get dashboard summary for admin
   */
  async getDashboardSummary() {
    return await reportRepository.getDashboardSummary();
  }

  /**
   * Generate comprehensive report
   */
  async generateComprehensiveReport(startDate?: Date, endDate?: Date) {
    // Validate date range
    if (startDate && endDate && startDate > endDate) {
      throw new ValidationError('Start date must be before end date');
    }

    const [revenue, bookings, customers, popularEquipment] = await Promise.all([
      this.getRevenueReport({ startDate, endDate }),
      this.getBookingStats(startDate, endDate),
      this.getCustomerAnalytics(),
      this.getPopularEquipment(10),
    ]);

    return {
      dateRange: {
        startDate: startDate || null,
        endDate: endDate || null,
      },
      revenue,
      bookings,
      customers,
      popularEquipment,
      generatedAt: new Date(),
    };
  }
}

export default new ReportService();
