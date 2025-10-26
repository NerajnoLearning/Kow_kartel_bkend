import { bookingRepository, equipmentRepository } from '../repositories';
import { IBooking, BookingStatus } from '../models/booking.model';
import {
  NotFoundError,
  ValidationError,
  ConflictError,
  AuthorizationError,
} from '../utils/errorHandler';
import { BookingFilters, PaginationOptions } from '../repositories/booking.repository';
import { bookingEmitters } from '../websockets/emitters';

export interface CreateBookingData {
  customerId: string;
  equipmentId: string;
  startDate: Date;
  endDate: Date;
  deliveryAddress: string;
  notes?: string;
}

export interface UpdateBookingData {
  startDate?: Date;
  endDate?: Date;
  deliveryAddress?: string;
  notes?: string;
  status?: BookingStatus;
  totalAmount?: number;
}

export class BookingService {
  /**
   * Calculate total amount for a booking
   */
  private async calculateTotalAmount(
    equipmentId: string,
    startDate: Date,
    endDate: Date
  ): Promise<number> {
    const equipment = await equipmentRepository.findById(equipmentId);
    if (!equipment) {
      throw new NotFoundError('Equipment not found');
    }

    // Calculate number of days
    const days = Math.ceil(
      (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)
    );

    if (days < 1) {
      throw new ValidationError('Booking must be at least 1 day');
    }

    return equipment.dailyRate * days;
  }

  /**
   * Validate booking dates
   */
  private validateBookingDates(startDate: Date, endDate: Date): void {
    const now = new Date();
    now.setHours(0, 0, 0, 0); // Set to start of day

    const start = new Date(startDate);
    start.setHours(0, 0, 0, 0);

    const end = new Date(endDate);
    end.setHours(0, 0, 0, 0);

    // Check if start date is in the past
    if (start < now) {
      throw new ValidationError('Start date cannot be in the past');
    }

    // Check if end date is after start date
    if (end <= start) {
      throw new ValidationError('End date must be after start date');
    }

    // Check if booking is too far in the future (e.g., max 1 year)
    const maxDate = new Date();
    maxDate.setFullYear(maxDate.getFullYear() + 1);
    if (start > maxDate) {
      throw new ValidationError('Start date cannot be more than 1 year in the future');
    }
  }

  /**
   * Create a new booking
   */
  async createBooking(data: CreateBookingData): Promise<IBooking> {
    // Validate dates
    this.validateBookingDates(data.startDate, data.endDate);

    // Check if equipment exists
    const equipment = await equipmentRepository.findById(data.equipmentId);
    if (!equipment) {
      throw new NotFoundError('Equipment not found');
    }

    // Check if equipment is available
    if (equipment.status !== 'available') {
      throw new ValidationError(`Equipment is currently ${equipment.status}`);
    }

    // Check for booking conflicts
    const hasConflict = await bookingRepository.checkConflict(
      data.equipmentId,
      data.startDate,
      data.endDate
    );

    if (hasConflict) {
      throw new ConflictError(
        'Equipment is already booked for the selected dates',
        {
          equipmentId: data.equipmentId,
          startDate: data.startDate,
          endDate: data.endDate,
        }
      );
    }

    // Calculate total amount
    const totalAmount = await this.calculateTotalAmount(
      data.equipmentId,
      data.startDate,
      data.endDate
    );

    // Create booking
    const booking = await bookingRepository.create({
      customerId: data.customerId as any,
      equipmentId: data.equipmentId as any,
      startDate: data.startDate,
      endDate: data.endDate,
      deliveryAddress: data.deliveryAddress,
      notes: data.notes,
      totalAmount,
      status: BookingStatus.PENDING,
    });

    // Emit WebSocket event
    bookingEmitters.emitBookingCreated(booking);

    return booking;
  }

  /**
   * Get booking by ID
   */
  async getBookingById(id: string, userId?: string, userRole?: string): Promise<IBooking> {
    const booking = await bookingRepository.findById(id);

    if (!booking) {
      throw new NotFoundError('Booking not found');
    }

    // Check authorization - only owner or admin can view
    if (userId && userRole !== 'admin' && userRole !== 'logistics') {
      const customerId = String(booking.customerId);
      if (customerId !== userId) {
        throw new AuthorizationError('You can only view your own bookings');
      }
    }

    return booking;
  }

  /**
   * Get all bookings with filters
   */
  async getAllBookings(
    filters: BookingFilters = {},
    options: PaginationOptions = {}
  ): Promise<{ data: IBooking[]; total: number; page: number; totalPages: number }> {
    return await bookingRepository.findAll(filters, options);
  }

  /**
   * Get customer's bookings
   */
  async getCustomerBookings(customerId: string): Promise<IBooking[]> {
    return await bookingRepository.findByCustomerId(customerId);
  }

  /**
   * Update booking
   */
  async updateBooking(
    id: string,
    data: UpdateBookingData,
    userId: string,
    userRole: string
  ): Promise<IBooking> {
    const booking = await bookingRepository.findById(id);

    if (!booking) {
      throw new NotFoundError('Booking not found');
    }

    // Check authorization
    const customerId = String(booking.customerId);
    if (userRole !== 'admin' && userRole !== 'logistics' && customerId !== userId) {
      throw new AuthorizationError('You can only update your own bookings');
    }

    // If booking is completed or cancelled, don't allow updates
    if (
      booking.status === BookingStatus.COMPLETED ||
      booking.status === BookingStatus.CANCELLED
    ) {
      throw new ValidationError(
        `Cannot update ${booking.status} booking. Contact support for assistance.`
      );
    }

    // If dates are being updated, validate and check conflicts
    const startDate = data.startDate || booking.startDate;
    const endDate = data.endDate || booking.endDate;

    if (data.startDate || data.endDate) {
      this.validateBookingDates(startDate, endDate);

      // Check for conflicts (exclude current booking)
      const hasConflict = await bookingRepository.checkConflict(
        String(booking.equipmentId),
        startDate,
        endDate,
        id
      );

      if (hasConflict) {
        throw new ConflictError('Equipment is already booked for the selected dates');
      }

      // Recalculate total if dates changed
      if (data.startDate || data.endDate) {
        const totalAmount = await this.calculateTotalAmount(
          String(booking.equipmentId),
          startDate,
          endDate
        );
        data.totalAmount = totalAmount;
      }
    }

    const updatedBooking = await bookingRepository.updateById(id, data as Partial<IBooking>);

    // Emit WebSocket event
    bookingEmitters.emitBookingUpdated(updatedBooking);

    return updatedBooking;
  }

  /**
   * Cancel booking
   */
  async cancelBooking(id: string, userId: string, userRole: string): Promise<IBooking> {
    const booking = await bookingRepository.findById(id);

    if (!booking) {
      throw new NotFoundError('Booking not found');
    }

    // Check authorization
    const customerId = String(booking.customerId);
    if (userRole !== 'admin' && customerId !== userId) {
      throw new AuthorizationError('You can only cancel your own bookings');
    }

    // Check if booking can be cancelled
    if (booking.status === BookingStatus.COMPLETED) {
      throw new ValidationError('Cannot cancel completed booking');
    }

    if (booking.status === BookingStatus.CANCELLED) {
      throw new ValidationError('Booking is already cancelled');
    }

    // Check cancellation policy (e.g., 24 hours before start date)
    const now = new Date();
    const startDate = new Date(booking.startDate);
    const hoursUntilStart = (startDate.getTime() - now.getTime()) / (1000 * 60 * 60);

    if (hoursUntilStart < 24 && userRole !== 'admin') {
      throw new ValidationError(
        'Bookings must be cancelled at least 24 hours before the start date'
      );
    }

    // Cancel booking
    const cancelledBooking = await bookingRepository.updateStatus(id, BookingStatus.CANCELLED);

    // Emit WebSocket event
    bookingEmitters.emitBookingCancelled(cancelledBooking);

    return cancelledBooking;
  }

  /**
   * Confirm booking (admin/logistics only)
   */
  async confirmBooking(id: string): Promise<IBooking> {
    const booking = await bookingRepository.findById(id);

    if (!booking) {
      throw new NotFoundError('Booking not found');
    }

    if (booking.status !== BookingStatus.PENDING) {
      throw new ValidationError(`Cannot confirm booking with status: ${booking.status}`);
    }

    const confirmedBooking = await bookingRepository.updateStatus(id, BookingStatus.CONFIRMED);

    // Emit WebSocket event
    bookingEmitters.emitBookingConfirmed(confirmedBooking);

    return confirmedBooking;
  }

  /**
   * Start booking (mark as active)
   */
  async startBooking(id: string): Promise<IBooking> {
    const booking = await bookingRepository.findById(id);

    if (!booking) {
      throw new NotFoundError('Booking not found');
    }

    if (booking.status !== BookingStatus.CONFIRMED) {
      throw new ValidationError('Only confirmed bookings can be started');
    }

    // Check if start date has arrived
    const now = new Date();
    const startDate = new Date(booking.startDate);
    if (now < startDate) {
      throw new ValidationError('Cannot start booking before the start date');
    }

    return await bookingRepository.updateStatus(id, BookingStatus.ACTIVE);
  }

  /**
   * Complete booking
   */
  async completeBooking(id: string): Promise<IBooking> {
    const booking = await bookingRepository.findById(id);

    if (!booking) {
      throw new NotFoundError('Booking not found');
    }

    if (booking.status !== BookingStatus.ACTIVE) {
      throw new ValidationError('Only active bookings can be completed');
    }

    return await bookingRepository.updateStatus(id, BookingStatus.COMPLETED);
  }

  /**
   * Delete booking (admin only)
   */
  async deleteBooking(id: string): Promise<void> {
    const booking = await bookingRepository.findById(id);

    if (!booking) {
      throw new NotFoundError('Booking not found');
    }

    // Only allow deletion of pending or cancelled bookings
    if (
      booking.status !== BookingStatus.PENDING &&
      booking.status !== BookingStatus.CANCELLED
    ) {
      throw new ValidationError(
        'Only pending or cancelled bookings can be deleted. Cancel the booking first.'
      );
    }

    await bookingRepository.deleteById(id);
  }

  /**
   * Check equipment availability for date range
   */
  async checkAvailability(
    equipmentId: string,
    startDate: Date,
    endDate: Date
  ): Promise<boolean> {
    // Validate dates
    this.validateBookingDates(startDate, endDate);

    // Check if equipment exists
    const equipment = await equipmentRepository.findById(equipmentId);
    if (!equipment) {
      throw new NotFoundError('Equipment not found');
    }

    // Check if equipment status is available
    if (equipment.status !== 'available') {
      return false;
    }

    // Check for booking conflicts
    const hasConflict = await bookingRepository.checkConflict(
      equipmentId,
      startDate,
      endDate
    );

    return !hasConflict;
  }
}

export default new BookingService();
