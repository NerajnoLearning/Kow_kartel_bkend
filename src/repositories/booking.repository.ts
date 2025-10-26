import { Booking, IBooking, BookingStatus } from '../models/booking.model';
import { DatabaseError, NotFoundError } from '../utils/errorHandler';
import { PAGINATION } from '../utils/constants';
import mongoose from 'mongoose';

export interface BookingFilters {
  customerId?: string;
  equipmentId?: string;
  status?: BookingStatus;
  startDate?: Date;
  endDate?: Date;
}

export interface PaginationOptions {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export class BookingRepository {
  async create(bookingData: Partial<IBooking>): Promise<IBooking> {
    try {
      const booking = new Booking(bookingData);
      return await booking.save();
    } catch (error) {
      throw new DatabaseError('Failed to create booking', error);
    }
  }

  async findById(id: string): Promise<IBooking | null> {
    try {
      return await Booking.findById(id)
        .populate('customerId', 'name email')
        .populate('equipmentId', 'name category dailyRate imageUrls');
    } catch (error) {
      throw new DatabaseError('Failed to find booking', error);
    }
  }

  async findAll(
    filters: BookingFilters = {},
    options: PaginationOptions = {}
  ): Promise<{ data: IBooking[]; total: number; page: number; totalPages: number }> {
    try {
      const page = options.page || PAGINATION.DEFAULT_PAGE;
      const limit = Math.min(
        options.limit || PAGINATION.DEFAULT_LIMIT,
        PAGINATION.MAX_LIMIT
      );
      const skip = (page - 1) * limit;
      const sortBy = options.sortBy || 'createdAt';
      const sortOrder = options.sortOrder === 'asc' ? 1 : -1;

      // Build query
      const query: Record<string, unknown> = {};

      if (filters.customerId) {
        query.customerId = new mongoose.Types.ObjectId(filters.customerId);
      }

      if (filters.equipmentId) {
        query.equipmentId = new mongoose.Types.ObjectId(filters.equipmentId);
      }

      if (filters.status) {
        query.status = filters.status;
      }

      if (filters.startDate || filters.endDate) {
        query.$or = [];
        if (filters.startDate) {
          (query.$or as Record<string, unknown>[]).push({
            startDate: { $gte: filters.startDate },
          });
        }
        if (filters.endDate) {
          (query.$or as Record<string, unknown>[]).push({
            endDate: { $lte: filters.endDate },
          });
        }
      }

      const [data, total] = await Promise.all([
        Booking.find(query)
          .populate('customerId', 'name email')
          .populate('equipmentId', 'name category dailyRate imageUrls')
          .sort({ [sortBy]: sortOrder })
          .skip(skip)
          .limit(limit),
        Booking.countDocuments(query),
      ]);

      return {
        data,
        total,
        page,
        totalPages: Math.ceil(total / limit),
      };
    } catch (error) {
      throw new DatabaseError('Failed to fetch bookings', error);
    }
  }

  async updateById(id: string, updateData: Partial<IBooking>): Promise<IBooking> {
    try {
      const booking = await Booking.findByIdAndUpdate(
        id,
        { $set: updateData },
        { new: true, runValidators: true }
      )
        .populate('customerId', 'name email')
        .populate('equipmentId', 'name category dailyRate imageUrls');

      if (!booking) {
        throw new NotFoundError('Booking not found');
      }

      return booking;
    } catch (error) {
      if (error instanceof NotFoundError) {
        throw error;
      }
      throw new DatabaseError('Failed to update booking', error);
    }
  }

  async deleteById(id: string): Promise<void> {
    try {
      const result = await Booking.findByIdAndDelete(id);
      if (!result) {
        throw new NotFoundError('Booking not found');
      }
    } catch (error) {
      if (error instanceof NotFoundError) {
        throw error;
      }
      throw new DatabaseError('Failed to delete booking', error);
    }
  }

  async checkConflict(
    equipmentId: string,
    startDate: Date,
    endDate: Date,
    excludeBookingId?: string
  ): Promise<boolean> {
    try {
      const query: Record<string, unknown> = {
        equipmentId: new mongoose.Types.ObjectId(equipmentId),
        status: { $in: [BookingStatus.PENDING, BookingStatus.CONFIRMED, BookingStatus.ACTIVE] },
        $or: [
          // New booking starts during existing booking
          {
            startDate: { $lte: startDate },
            endDate: { $gte: startDate },
          },
          // New booking ends during existing booking
          {
            startDate: { $lte: endDate },
            endDate: { $gte: endDate },
          },
          // New booking completely contains existing booking
          {
            startDate: { $gte: startDate },
            endDate: { $lte: endDate },
          },
        ],
      };

      if (excludeBookingId) {
        query._id = { $ne: new mongoose.Types.ObjectId(excludeBookingId) };
      }

      const count = await Booking.countDocuments(query);
      return count > 0;
    } catch (error) {
      throw new DatabaseError('Failed to check booking conflict', error);
    }
  }

  async findByCustomerId(customerId: string): Promise<IBooking[]> {
    try {
      return await Booking.find({ customerId: new mongoose.Types.ObjectId(customerId) })
        .populate('equipmentId', 'name category dailyRate imageUrls')
        .sort({ createdAt: -1 });
    } catch (error) {
      throw new DatabaseError('Failed to fetch customer bookings', error);
    }
  }

  async updateStatus(id: string, status: BookingStatus): Promise<IBooking> {
    try {
      const booking = await Booking.findByIdAndUpdate(
        id,
        { $set: { status } },
        { new: true }
      )
        .populate('customerId', 'name email')
        .populate('equipmentId', 'name category dailyRate imageUrls');

      if (!booking) {
        throw new NotFoundError('Booking not found');
      }

      return booking;
    } catch (error) {
      if (error instanceof NotFoundError) {
        throw error;
      }
      throw new DatabaseError('Failed to update booking status', error);
    }
  }
}

export default new BookingRepository();
