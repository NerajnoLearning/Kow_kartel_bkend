import { Payment } from '../models/payment.model';
import { Booking } from '../models/booking.model';
import { Equipment } from '../models/equipment.model';
import { User, UserRole } from '../models/user.model';
import { DatabaseError } from '../utils/errorHandler';

export interface RevenueReportFilters {
  startDate?: Date;
  endDate?: Date;
  equipmentId?: string;
  customerId?: string;
}

export interface UtilizationReportFilters {
  startDate: Date;
  endDate: Date;
  equipmentId?: string;
}

export class ReportRepository {
  /**
   * Get revenue statistics
   */
  async getRevenueStats(filters: RevenueReportFilters = {}): Promise<{
    totalRevenue: number;
    totalBookings: number;
    averageBookingValue: number;
    successfulPayments: number;
    failedPayments: number;
  }> {
    try {
      const { startDate, endDate, equipmentId, customerId } = filters;

      // Build match query
      const matchQuery: any = { status: 'succeeded' };

      if (startDate || endDate) {
        matchQuery.createdAt = {};
        if (startDate) matchQuery.createdAt.$gte = startDate;
        if (endDate) matchQuery.createdAt.$lte = endDate;
      }

      if (equipmentId) {
        matchQuery['metadata.equipmentId'] = equipmentId;
      }

      if (customerId) {
        matchQuery['metadata.customerId'] = customerId;
      }

      const [revenueStats, failedPayments] = await Promise.all([
        Payment.aggregate([
          { $match: matchQuery },
          {
            $group: {
              _id: null,
              totalRevenue: { $sum: '$amount' },
              totalBookings: { $sum: 1 },
              averageBookingValue: { $avg: '$amount' },
            },
          },
        ]),
        Payment.countDocuments({
          ...matchQuery,
          status: 'failed',
        }),
      ]);

      const stats = revenueStats[0] || {
        totalRevenue: 0,
        totalBookings: 0,
        averageBookingValue: 0,
      };

      return {
        totalRevenue: stats.totalRevenue || 0,
        totalBookings: stats.totalBookings || 0,
        averageBookingValue: stats.averageBookingValue || 0,
        successfulPayments: stats.totalBookings || 0,
        failedPayments: failedPayments || 0,
      };
    } catch (error) {
      throw new DatabaseError('Failed to get revenue statistics', error);
    }
  }

  /**
   * Get revenue by date range
   */
  async getRevenueByDateRange(
    startDate: Date,
    endDate: Date,
    groupBy: 'day' | 'week' | 'month' = 'day'
  ): Promise<any[]> {
    try {
      let dateFormat: string;
      switch (groupBy) {
        case 'month':
          dateFormat = '%Y-%m';
          break;
        case 'week':
          dateFormat = '%Y-W%V';
          break;
        case 'day':
        default:
          dateFormat = '%Y-%m-%d';
          break;
      }

      const revenueByDate = await Payment.aggregate([
        {
          $match: {
            status: 'succeeded',
            createdAt: { $gte: startDate, $lte: endDate },
          },
        },
        {
          $group: {
            _id: { $dateToString: { format: dateFormat, date: '$createdAt' } },
            revenue: { $sum: '$amount' },
            bookings: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
        {
          $project: {
            date: '$_id',
            revenue: 1,
            bookings: 1,
            _id: 0,
          },
        },
      ]);

      return revenueByDate;
    } catch (error) {
      throw new DatabaseError('Failed to get revenue by date range', error);
    }
  }

  /**
   * Get equipment utilization statistics
   */
  async getEquipmentUtilization(filters: UtilizationReportFilters): Promise<any[]> {
    try {
      const { startDate, endDate, equipmentId } = filters;

      const matchQuery: any = {
        status: { $in: ['confirmed', 'active', 'completed'] },
        $or: [
          { startDate: { $gte: startDate, $lte: endDate } },
          { endDate: { $gte: startDate, $lte: endDate } },
          { startDate: { $lte: startDate }, endDate: { $gte: endDate } },
        ],
      };

      if (equipmentId) {
        matchQuery.equipmentId = equipmentId;
      }

      const utilization = await Booking.aggregate([
        { $match: matchQuery },
        {
          $group: {
            _id: '$equipmentId',
            totalBookings: { $sum: 1 },
            totalRevenue: { $sum: '$totalAmount' },
            avgBookingDuration: {
              $avg: {
                $divide: [
                  { $subtract: ['$endDate', '$startDate'] },
                  1000 * 60 * 60 * 24, // Convert to days
                ],
              },
            },
          },
        },
        {
          $lookup: {
            from: 'equipment',
            localField: '_id',
            foreignField: '_id',
            as: 'equipment',
          },
        },
        { $unwind: '$equipment' },
        {
          $project: {
            equipmentId: '$_id',
            equipmentName: '$equipment.name',
            category: '$equipment.category',
            dailyRate: '$equipment.dailyRate',
            totalBookings: 1,
            totalRevenue: 1,
            avgBookingDuration: { $round: ['$avgBookingDuration', 2] },
          },
        },
        { $sort: { totalRevenue: -1 } },
      ]);

      return utilization;
    } catch (error) {
      throw new DatabaseError('Failed to get equipment utilization', error);
    }
  }

  /**
   * Get booking statistics by status
   */
  async getBookingStatsByStatus(startDate?: Date, endDate?: Date): Promise<any[]> {
    try {
      const matchQuery: any = {};

      if (startDate || endDate) {
        matchQuery.createdAt = {};
        if (startDate) matchQuery.createdAt.$gte = startDate;
        if (endDate) matchQuery.createdAt.$lte = endDate;
      }

      const stats = await Booking.aggregate([
        { $match: matchQuery },
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 },
            totalAmount: { $sum: '$totalAmount' },
          },
        },
        {
          $project: {
            status: '$_id',
            count: 1,
            totalAmount: 1,
            _id: 0,
          },
        },
      ]);

      return stats;
    } catch (error) {
      throw new DatabaseError('Failed to get booking statistics by status', error);
    }
  }

  /**
   * Get customer analytics
   */
  async getCustomerAnalytics(): Promise<{
    totalCustomers: number;
    activeCustomers: number;
    newCustomersThisMonth: number;
    topCustomers: any[];
  }> {
    try {
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

      const [totalCustomers, newCustomers, activeCustomers, topCustomers] = await Promise.all([
        User.countDocuments({ role: UserRole.CUSTOMER }),
        User.countDocuments({
          role: UserRole.CUSTOMER,
          createdAt: { $gte: startOfMonth },
        }),
        Booking.distinct('customerId', {
          status: { $in: ['confirmed', 'active'] },
        }),
        Payment.aggregate([
          { $match: { status: 'succeeded' } },
          {
            $group: {
              _id: '$metadata.customerId',
              totalSpent: { $sum: '$amount' },
              bookingCount: { $sum: 1 },
            },
          },
          { $sort: { totalSpent: -1 } },
          { $limit: 10 },
          {
            $lookup: {
              from: 'users',
              let: { customerId: { $toObjectId: '$_id' } },
              pipeline: [
                { $match: { $expr: { $eq: ['$_id', '$$customerId'] } } },
                { $project: { name: 1, email: 1 } },
              ],
              as: 'customer',
            },
          },
          { $unwind: '$customer' },
          {
            $project: {
              customerId: '$_id',
              name: '$customer.name',
              email: '$customer.email',
              totalSpent: 1,
              bookingCount: 1,
              _id: 0,
            },
          },
        ]),
      ]);

      return {
        totalCustomers,
        activeCustomers: activeCustomers.length,
        newCustomersThisMonth: newCustomers,
        topCustomers,
      };
    } catch (error) {
      throw new DatabaseError('Failed to get customer analytics', error);
    }
  }

  /**
   * Get popular equipment
   */
  async getPopularEquipment(limit: number = 10): Promise<any[]> {
    try {
      const popular = await Booking.aggregate([
        { $match: { status: { $ne: 'cancelled' } } },
        {
          $group: {
            _id: '$equipmentId',
            bookingCount: { $sum: 1 },
            totalRevenue: { $sum: '$totalAmount' },
          },
        },
        { $sort: { bookingCount: -1 } },
        { $limit: limit },
        {
          $lookup: {
            from: 'equipment',
            localField: '_id',
            foreignField: '_id',
            as: 'equipment',
          },
        },
        { $unwind: '$equipment' },
        {
          $project: {
            equipmentId: '$_id',
            name: '$equipment.name',
            category: '$equipment.category',
            bookingCount: 1,
            totalRevenue: 1,
            _id: 0,
          },
        },
      ]);

      return popular;
    } catch (error) {
      throw new DatabaseError('Failed to get popular equipment', error);
    }
  }

  /**
   * Get dashboard summary
   */
  async getDashboardSummary(): Promise<{
    totalRevenue: number;
    totalBookings: number;
    activeBookings: number;
    totalEquipment: number;
    availableEquipment: number;
    totalCustomers: number;
    recentBookings: any[];
  }> {
    try {
      const [
        revenue,
        bookingCounts,
        equipmentCounts,
        customerCount,
        recentBookings,
      ] = await Promise.all([
        Payment.aggregate([
          { $match: { status: 'succeeded' } },
          { $group: { _id: null, total: { $sum: '$amount' } } },
        ]),
        Booking.aggregate([
          {
            $group: {
              _id: '$status',
              count: { $sum: 1 },
            },
          },
        ]),
        Equipment.aggregate([
          {
            $group: {
              _id: '$status',
              count: { $sum: 1 },
            },
          },
        ]),
        User.countDocuments({ role: UserRole.CUSTOMER }),
        Booking.find()
          .sort({ createdAt: -1 })
          .limit(5)
          .populate('customerId', 'name email')
          .populate('equipmentId', 'name category')
          .lean(),
      ]);

      const totalRevenue = revenue[0]?.total || 0;

      let totalBookings = 0;
      let activeBookings = 0;
      bookingCounts.forEach((stat: any) => {
        totalBookings += stat.count;
        if (stat._id === 'active' || stat._id === 'confirmed') {
          activeBookings += stat.count;
        }
      });

      let totalEquipment = 0;
      let availableEquipment = 0;
      equipmentCounts.forEach((stat: any) => {
        totalEquipment += stat.count;
        if (stat._id === 'available') {
          availableEquipment = stat.count;
        }
      });

      return {
        totalRevenue,
        totalBookings,
        activeBookings,
        totalEquipment,
        availableEquipment,
        totalCustomers: customerCount,
        recentBookings,
      };
    } catch (error) {
      throw new DatabaseError('Failed to get dashboard summary', error);
    }
  }
}

export default new ReportRepository();
