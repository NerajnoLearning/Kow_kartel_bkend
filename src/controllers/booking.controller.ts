import { Response, NextFunction } from 'express';
import { AuthRequest } from '../types/common.types';
import bookingService from '../services/booking.service';
import { HTTP_STATUS } from '../utils/constants';
import { BookingStatus } from '../models/booking.model';

export class BookingController {
  async createBooking(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        throw new Error('User not authenticated');
      }

      const bookingData = {
        ...req.body,
        customerId: req.user.userId,
        startDate: new Date(req.body.startDate),
        endDate: new Date(req.body.endDate),
      };

      const booking = await bookingService.createBooking(bookingData);

      res.status(HTTP_STATUS.CREATED).json({
        status: HTTP_STATUS.CREATED,
        message: 'Booking created successfully',
        data: booking,
      });
    } catch (error) {
      next(error);
    }
  }

  async getAllBookings(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { customerId, equipmentId, status, page, limit, sortBy, sortOrder } = req.query;

      // If user is not admin/logistics, filter to their own bookings
      let filterCustomerId = customerId as string | undefined;
      if (req.user && req.user.role !== 'admin' && req.user.role !== 'logistics') {
        filterCustomerId = req.user.userId;
      }

      const filters = {
        customerId: filterCustomerId,
        equipmentId: equipmentId as string | undefined,
        status: status as BookingStatus | undefined,
      };

      const options = {
        page: page ? parseInt(page as string) : undefined,
        limit: limit ? parseInt(limit as string) : undefined,
        sortBy: sortBy as string | undefined,
        sortOrder: sortOrder as 'asc' | 'desc' | undefined,
      };

      const result = await bookingService.getAllBookings(filters, options);

      res.status(HTTP_STATUS.OK).json({
        status: HTTP_STATUS.OK,
        data: result.data,
        pagination: {
          page: result.page,
          totalPages: result.totalPages,
          total: result.total,
          limit: options.limit,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  async getBookingById(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const booking = await bookingService.getBookingById(
        id,
        req.user?.userId,
        req.user?.role
      );

      res.status(HTTP_STATUS.OK).json({
        status: HTTP_STATUS.OK,
        data: booking,
      });
    } catch (error) {
      next(error);
    }
  }

  async getMyBookings(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        throw new Error('User not authenticated');
      }

      const bookings = await bookingService.getCustomerBookings(req.user.userId);

      res.status(HTTP_STATUS.OK).json({
        status: HTTP_STATUS.OK,
        data: bookings,
      });
    } catch (error) {
      next(error);
    }
  }

  async updateBooking(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        throw new Error('User not authenticated');
      }

      const { id } = req.params;
      const updateData = { ...req.body };

      // Convert dates if provided
      if (updateData.startDate) {
        updateData.startDate = new Date(updateData.startDate);
      }
      if (updateData.endDate) {
        updateData.endDate = new Date(updateData.endDate);
      }

      const booking = await bookingService.updateBooking(
        id,
        updateData,
        req.user.userId,
        req.user.role
      );

      res.status(HTTP_STATUS.OK).json({
        status: HTTP_STATUS.OK,
        message: 'Booking updated successfully',
        data: booking,
      });
    } catch (error) {
      next(error);
    }
  }

  async cancelBooking(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        throw new Error('User not authenticated');
      }

      const { id } = req.params;
      const booking = await bookingService.cancelBooking(id, req.user.userId, req.user.role);

      res.status(HTTP_STATUS.OK).json({
        status: HTTP_STATUS.OK,
        message: 'Booking cancelled successfully',
        data: booking,
      });
    } catch (error) {
      next(error);
    }
  }

  async confirmBooking(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const booking = await bookingService.confirmBooking(id);

      res.status(HTTP_STATUS.OK).json({
        status: HTTP_STATUS.OK,
        message: 'Booking confirmed successfully',
        data: booking,
      });
    } catch (error) {
      next(error);
    }
  }

  async startBooking(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const booking = await bookingService.startBooking(id);

      res.status(HTTP_STATUS.OK).json({
        status: HTTP_STATUS.OK,
        message: 'Booking started successfully',
        data: booking,
      });
    } catch (error) {
      next(error);
    }
  }

  async completeBooking(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const booking = await bookingService.completeBooking(id);

      res.status(HTTP_STATUS.OK).json({
        status: HTTP_STATUS.OK,
        message: 'Booking completed successfully',
        data: booking,
      });
    } catch (error) {
      next(error);
    }
  }

  async deleteBooking(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      await bookingService.deleteBooking(id);

      res.status(HTTP_STATUS.OK).json({
        status: HTTP_STATUS.OK,
        message: 'Booking deleted successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  async checkAvailability(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { equipmentId } = req.params;
      const { startDate, endDate } = req.query;

      if (!startDate || !endDate) {
        res.status(HTTP_STATUS.BAD_REQUEST).json({
          status: HTTP_STATUS.BAD_REQUEST,
          error: 'startDate and endDate are required',
        });
        return;
      }

      const isAvailable = await bookingService.checkAvailability(
        equipmentId,
        new Date(startDate as string),
        new Date(endDate as string)
      );

      res.status(HTTP_STATUS.OK).json({
        status: HTTP_STATUS.OK,
        data: { available: isAvailable },
      });
    } catch (error) {
      next(error);
    }
  }
}

export default new BookingController();
