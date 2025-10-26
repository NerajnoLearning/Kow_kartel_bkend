import { User, IUser, UserRole } from '../models/user.model';
import { DatabaseError, NotFoundError } from '../utils/errorHandler';

export interface CustomerFilters {
  verified?: boolean;
  search?: string;
}

export interface PaginationOptions {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export class CustomerRepository {
  /**
   * Get all customers with filters and pagination
   */
  async findAll(
    filters: CustomerFilters = {},
    options: PaginationOptions = {}
  ): Promise<{ data: IUser[]; total: number; page: number; totalPages: number }> {
    try {
      const { verified, search } = filters;
      const { page = 1, limit = 20, sortBy = 'createdAt', sortOrder = 'desc' } = options;

      // Build query
      const query: any = { role: UserRole.CUSTOMER };

      if (verified !== undefined) {
        query.verified = verified;
      }

      if (search) {
        query.$or = [
          { name: { $regex: search, $options: 'i' } },
          { email: { $regex: search, $options: 'i' } },
        ];
      }

      // Calculate pagination
      const skip = (page - 1) * limit;
      const sortOptions: any = { [sortBy]: sortOrder === 'asc' ? 1 : -1 };

      // Execute query
      const [data, total] = await Promise.all([
        User.find(query)
          .select('-password')
          .sort(sortOptions)
          .skip(skip)
          .limit(limit)
          .lean(),
        User.countDocuments(query),
      ]);

      return {
        data: data as IUser[],
        total,
        page,
        totalPages: Math.ceil(total / limit),
      };
    } catch (error) {
      throw new DatabaseError('Failed to fetch customers', error);
    }
  }

  /**
   * Find customer by ID
   */
  async findById(id: string): Promise<IUser | null> {
    try {
      const customer = await User.findOne({
        _id: id,
        role: UserRole.CUSTOMER,
      }).select('-password');

      return customer;
    } catch (error) {
      throw new DatabaseError('Failed to find customer', error);
    }
  }

  /**
   * Update customer profile
   */
  async updateById(id: string, updateData: Partial<IUser>): Promise<IUser> {
    try {
      const customer = await User.findOneAndUpdate(
        { _id: id, role: UserRole.CUSTOMER },
        { $set: updateData },
        { new: true, runValidators: true }
      ).select('-password');

      if (!customer) {
        throw new NotFoundError('Customer not found');
      }

      return customer;
    } catch (error) {
      if (error instanceof NotFoundError) {
        throw error;
      }
      throw new DatabaseError('Failed to update customer', error);
    }
  }

  /**
   * Delete customer
   */
  async deleteById(id: string): Promise<void> {
    try {
      const result = await User.findOneAndDelete({
        _id: id,
        role: UserRole.CUSTOMER,
      });

      if (!result) {
        throw new NotFoundError('Customer not found');
      }
    } catch (error) {
      if (error instanceof NotFoundError) {
        throw error;
      }
      throw new DatabaseError('Failed to delete customer', error);
    }
  }

  /**
   * Get customer statistics
   */
  async getCustomerStats(customerId: string): Promise<{
    totalBookings: number;
    activeBookings: number;
    completedBookings: number;
    totalSpent: number;
  }> {
    try {
      const { Booking } = await import('../models/booking.model');
      const { Payment } = await import('../models/payment.model');

      const [bookingStats, paymentStats] = await Promise.all([
        Booking.aggregate([
          { $match: { customerId: customerId as any } },
          {
            $group: {
              _id: '$status',
              count: { $sum: 1 },
            },
          },
        ]),
        Payment.aggregate([
          { $match: { customerId: customerId as any } },
          {
            $group: {
              _id: null,
              totalSpent: { $sum: '$amount' },
            },
          },
        ]),
      ]);

      const stats = {
        totalBookings: 0,
        activeBookings: 0,
        completedBookings: 0,
        totalSpent: 0,
      };

      // Process booking stats
      bookingStats.forEach((stat: any) => {
        stats.totalBookings += stat.count;
        if (stat._id === 'active' || stat._id === 'confirmed') {
          stats.activeBookings += stat.count;
        }
        if (stat._id === 'completed') {
          stats.completedBookings = stat.count;
        }
      });

      // Process payment stats
      if (paymentStats.length > 0) {
        stats.totalSpent = paymentStats[0].totalSpent || 0;
      }

      return stats;
    } catch (error) {
      throw new DatabaseError('Failed to get customer statistics', error);
    }
  }

  /**
   * Get top customers by spending
   */
  async getTopCustomers(limit: number = 10): Promise<any[]> {
    try {
      const { Payment } = await import('../models/payment.model');

      const topCustomers = await Payment.aggregate([
        { $match: { status: 'succeeded' } },
        {
          $group: {
            _id: '$metadata.customerId',
            totalSpent: { $sum: '$amount' },
            bookingCount: { $sum: 1 },
          },
        },
        { $sort: { totalSpent: -1 } },
        { $limit: limit },
        {
          $lookup: {
            from: 'users',
            localField: '_id',
            foreignField: '_id',
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
          },
        },
      ]);

      return topCustomers;
    } catch (error) {
      throw new DatabaseError('Failed to get top customers', error);
    }
  }

  /**
   * Count total customers
   */
  async countAll(): Promise<number> {
    try {
      return await User.countDocuments({ role: UserRole.CUSTOMER });
    } catch (error) {
      throw new DatabaseError('Failed to count customers', error);
    }
  }

  /**
   * Count verified customers
   */
  async countVerified(): Promise<number> {
    try {
      return await User.countDocuments({
        role: UserRole.CUSTOMER,
        verified: true,
      });
    } catch (error) {
      throw new DatabaseError('Failed to count verified customers', error);
    }
  }
}

export default new CustomerRepository();
