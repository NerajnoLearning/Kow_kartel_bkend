import { emitToUser, emitToAdmins } from './index';
import { BOOKING_EVENTS, PAYMENT_EVENTS, EQUIPMENT_EVENTS } from './events';
import { IBooking } from '../models/booking.model';
import { IPayment } from '../models/payment.model';
import { IEquipment } from '../models/equipment.model';
import logger from '../config/logger';

/**
 * Booking Event Emitters
 */
export const bookingEmitters = {
  /**
   * Emit booking created event
   */
  emitBookingCreated(booking: IBooking): void {
    try {
      const customerId = String(booking.customerId);

      // Notify customer
      emitToUser(customerId, BOOKING_EVENTS.CREATED, {
        booking,
        message: 'Your booking has been created successfully',
        timestamp: new Date().toISOString(),
      });

      // Notify admins
      emitToAdmins(BOOKING_EVENTS.CREATED, {
        booking,
        message: `New booking created by customer ${customerId}`,
        timestamp: new Date().toISOString(),
      });

      logger.info(`Emitted booking created event for booking ${booking._id}`);
    } catch (error) {
      logger.error('Error emitting booking created event:', error);
    }
  },

  /**
   * Emit booking updated event
   */
  emitBookingUpdated(booking: IBooking): void {
    try {
      const customerId = String(booking.customerId);

      // Notify customer
      emitToUser(customerId, BOOKING_EVENTS.UPDATED, {
        booking,
        message: 'Your booking has been updated',
        timestamp: new Date().toISOString(),
      });

      // Notify admins
      emitToAdmins(BOOKING_EVENTS.UPDATED, {
        booking,
        message: `Booking ${booking._id} has been updated`,
        timestamp: new Date().toISOString(),
      });

      logger.info(`Emitted booking updated event for booking ${booking._id}`);
    } catch (error) {
      logger.error('Error emitting booking updated event:', error);
    }
  },

  /**
   * Emit booking status changed event
   */
  emitBookingStatusChanged(booking: IBooking, oldStatus: string): void {
    try {
      const customerId = String(booking.customerId);

      // Notify customer
      emitToUser(customerId, BOOKING_EVENTS.STATUS_CHANGED, {
        booking,
        oldStatus,
        newStatus: booking.status,
        message: `Your booking status has changed from ${oldStatus} to ${booking.status}`,
        timestamp: new Date().toISOString(),
      });

      // Notify admins
      emitToAdmins(BOOKING_EVENTS.STATUS_CHANGED, {
        booking,
        oldStatus,
        newStatus: booking.status,
        message: `Booking ${booking._id} status changed to ${booking.status}`,
        timestamp: new Date().toISOString(),
      });

      logger.info(`Emitted booking status changed event for booking ${booking._id}`);
    } catch (error) {
      logger.error('Error emitting booking status changed event:', error);
    }
  },

  /**
   * Emit booking confirmed event
   */
  emitBookingConfirmed(booking: IBooking): void {
    try {
      const customerId = String(booking.customerId);

      emitToUser(customerId, BOOKING_EVENTS.CONFIRMED, {
        booking,
        message: 'Your booking has been confirmed!',
        timestamp: new Date().toISOString(),
      });

      logger.info(`Emitted booking confirmed event for booking ${booking._id}`);
    } catch (error) {
      logger.error('Error emitting booking confirmed event:', error);
    }
  },

  /**
   * Emit booking cancelled event
   */
  emitBookingCancelled(booking: IBooking): void {
    try {
      const customerId = String(booking.customerId);

      emitToUser(customerId, BOOKING_EVENTS.CANCELLED, {
        booking,
        message: 'Your booking has been cancelled',
        timestamp: new Date().toISOString(),
      });

      emitToAdmins(BOOKING_EVENTS.CANCELLED, {
        booking,
        message: `Booking ${booking._id} has been cancelled`,
        timestamp: new Date().toISOString(),
      });

      logger.info(`Emitted booking cancelled event for booking ${booking._id}`);
    } catch (error) {
      logger.error('Error emitting booking cancelled event:', error);
    }
  },
};

/**
 * Payment Event Emitters
 */
export const paymentEmitters = {
  /**
   * Emit payment intent created event
   */
  emitPaymentIntentCreated(payment: IPayment, customerId: string): void {
    try {
      emitToUser(customerId, PAYMENT_EVENTS.INTENT_CREATED, {
        payment,
        message: 'Payment intent created successfully',
        timestamp: new Date().toISOString(),
      });

      logger.info(`Emitted payment intent created event for payment ${payment._id}`);
    } catch (error) {
      logger.error('Error emitting payment intent created event:', error);
    }
  },

  /**
   * Emit payment succeeded event
   */
  emitPaymentSucceeded(payment: IPayment, customerId: string): void {
    try {
      emitToUser(customerId, PAYMENT_EVENTS.SUCCEEDED, {
        payment,
        message: 'Payment successful! Your booking has been confirmed.',
        timestamp: new Date().toISOString(),
      });

      emitToAdmins(PAYMENT_EVENTS.SUCCEEDED, {
        payment,
        message: `Payment ${payment._id} succeeded for booking ${payment.bookingId}`,
        timestamp: new Date().toISOString(),
      });

      logger.info(`Emitted payment succeeded event for payment ${payment._id}`);
    } catch (error) {
      logger.error('Error emitting payment succeeded event:', error);
    }
  },

  /**
   * Emit payment failed event
   */
  emitPaymentFailed(payment: IPayment, customerId: string): void {
    try {
      emitToUser(customerId, PAYMENT_EVENTS.FAILED, {
        payment,
        message: 'Payment failed. Please try again or use a different payment method.',
        timestamp: new Date().toISOString(),
      });

      logger.info(`Emitted payment failed event for payment ${payment._id}`);
    } catch (error) {
      logger.error('Error emitting payment failed event:', error);
    }
  },

  /**
   * Emit payment refunded event
   */
  emitPaymentRefunded(payment: IPayment, customerId: string): void {
    try {
      emitToUser(customerId, PAYMENT_EVENTS.REFUNDED, {
        payment,
        refundAmount: payment.refundAmount,
        message: `Refund of $${payment.refundAmount} has been processed`,
        timestamp: new Date().toISOString(),
      });

      logger.info(`Emitted payment refunded event for payment ${payment._id}`);
    } catch (error) {
      logger.error('Error emitting payment refunded event:', error);
    }
  },
};

/**
 * Equipment Event Emitters
 */
export const equipmentEmitters = {
  /**
   * Emit equipment created event
   */
  emitEquipmentCreated(equipment: IEquipment): void {
    try {
      emitToAdmins(EQUIPMENT_EVENTS.CREATED, {
        equipment,
        message: `New equipment added: ${equipment.name}`,
        timestamp: new Date().toISOString(),
      });

      logger.info(`Emitted equipment created event for equipment ${equipment._id}`);
    } catch (error) {
      logger.error('Error emitting equipment created event:', error);
    }
  },

  /**
   * Emit equipment status changed event
   */
  emitEquipmentStatusChanged(equipment: IEquipment, oldStatus: string): void {
    try {
      emitToAdmins(EQUIPMENT_EVENTS.STATUS_CHANGED, {
        equipment,
        oldStatus,
        newStatus: equipment.status,
        message: `Equipment ${equipment.name} status changed to ${equipment.status}`,
        timestamp: new Date().toISOString(),
      });

      logger.info(`Emitted equipment status changed event for equipment ${equipment._id}`);
    } catch (error) {
      logger.error('Error emitting equipment status changed event:', error);
    }
  },
};
