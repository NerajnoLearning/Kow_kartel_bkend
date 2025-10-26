import Stripe from 'stripe';
import { paymentRepository, bookingRepository } from '../repositories';
import { IPayment, PaymentStatus } from '../models/payment.model';
import { BookingStatus } from '../models/booking.model';
import { env } from '../config/env';
import logger from '../config/logger';
import {
  NotFoundError,
  ValidationError,
  ExternalServiceError,
  AuthorizationError,
} from '../utils/errorHandler';
import { paymentEmitters, bookingEmitters } from '../websockets/emitters';

// Initialize Stripe
const stripe = new Stripe(env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2025-09-30.clover',
});

export interface CreatePaymentIntentData {
  bookingId: string;
  userId: string;
  userRole: string;
}

export interface ConfirmPaymentData {
  paymentIntentId: string;
}

export interface RefundPaymentData {
  paymentId: string;
  amount?: number;
  reason?: string;
}

export class PaymentService {
  /**
   * Create a Stripe Payment Intent for a booking
   */
  async createPaymentIntent(data: CreatePaymentIntentData): Promise<{
    payment: IPayment;
    clientSecret: string;
  }> {
    const { bookingId, userId, userRole } = data;

    // Get booking details
    const booking = await bookingRepository.findById(bookingId);
    if (!booking) {
      throw new NotFoundError('Booking not found');
    }

    // Check authorization - only booking owner can create payment
    const customerId = String(booking.customerId);
    if (userRole !== 'admin' && customerId !== userId) {
      throw new AuthorizationError('You can only pay for your own bookings');
    }

    // Check if booking is in correct status
    if (booking.status !== BookingStatus.PENDING && booking.status !== BookingStatus.CONFIRMED) {
      throw new ValidationError(
        `Cannot create payment for booking with status: ${booking.status}`
      );
    }

    // Check if payment already exists for this booking
    const existingPayment = await paymentRepository.findByBookingId(bookingId);
    if (existingPayment && existingPayment.status !== PaymentStatus.FAILED) {
      // Return existing payment intent if not failed
      if (existingPayment.status === PaymentStatus.PENDING) {
        try {
          const paymentIntent = await stripe.paymentIntents.retrieve(
            existingPayment.stripePaymentIntentId
          );
          return {
            payment: existingPayment,
            clientSecret: paymentIntent.client_secret!,
          };
        } catch (error) {
          logger.error('Error retrieving existing payment intent:', error);
          // Continue to create new payment intent if retrieval fails
        }
      } else {
        throw new ValidationError('Payment already processed for this booking');
      }
    }

    // Convert amount to cents (Stripe uses smallest currency unit)
    const amountInCents = Math.round(booking.totalAmount * 100);

    try {
      // Create Stripe Payment Intent
      const paymentIntent = await stripe.paymentIntents.create({
        amount: amountInCents,
        currency: 'usd',
        metadata: {
          bookingId: bookingId,
          customerId: customerId,
          equipmentId: String(booking.equipmentId),
        },
        automatic_payment_methods: {
          enabled: true,
        },
      });

      // Create payment record in database
      const payment = await paymentRepository.create({
        bookingId: bookingId as any,
        stripePaymentIntentId: paymentIntent.id,
        amount: booking.totalAmount,
        currency: 'usd',
        status: PaymentStatus.PENDING,
        metadata: {
          customerId,
          equipmentId: String(booking.equipmentId),
          startDate: booking.startDate,
          endDate: booking.endDate,
        },
      });

      logger.info(`Payment intent created: ${paymentIntent.id} for booking: ${bookingId}`);

      // Emit WebSocket event
      paymentEmitters.emitPaymentIntentCreated(payment, customerId);

      return {
        payment,
        clientSecret: paymentIntent.client_secret!,
      };
    } catch (error) {
      logger.error('Stripe payment intent creation error:', error);
      throw new ExternalServiceError('Failed to create payment intent', error);
    }
  }

  /**
   * Handle successful payment (called by webhook)
   */
  async handlePaymentSuccess(paymentIntentId: string): Promise<void> {
    try {
      // Find payment by Stripe Payment Intent ID
      const payment = await paymentRepository.findByStripePaymentIntentId(paymentIntentId);
      if (!payment) {
        logger.error(`Payment not found for intent: ${paymentIntentId}`);
        return;
      }

      // Update payment status
      const updatedPayment = await paymentRepository.updateStatus(String(payment._id), PaymentStatus.SUCCEEDED);

      // Update booking status to confirmed
      const updatedBooking = await bookingRepository.updateStatus(
        String(payment.bookingId),
        BookingStatus.CONFIRMED
      );

      logger.info(
        `Payment succeeded for intent: ${paymentIntentId}, booking: ${payment.bookingId}`
      );

      // Get customer ID from booking
      const customerId = String(updatedBooking.customerId);

      // Emit WebSocket events
      paymentEmitters.emitPaymentSucceeded(updatedPayment, customerId);
      bookingEmitters.emitBookingConfirmed(updatedBooking);

      // TODO: Queue email notification
      // await emailQueue.add('send-payment-receipt', {
      //   paymentId: payment._id,
      //   bookingId: payment.bookingId,
      // });
    } catch (error) {
      logger.error('Error handling payment success:', error);
      throw error;
    }
  }

  /**
   * Handle failed payment (called by webhook)
   */
  async handlePaymentFailure(paymentIntentId: string): Promise<void> {
    try {
      const payment = await paymentRepository.findByStripePaymentIntentId(paymentIntentId);
      if (!payment) {
        logger.error(`Payment not found for intent: ${paymentIntentId}`);
        return;
      }

      // Update payment status
      const updatedPayment = await paymentRepository.updateStatus(String(payment._id), PaymentStatus.FAILED);

      // Get booking details for customer ID
      const booking = await bookingRepository.findById(String(payment.bookingId));
      if (booking) {
        const customerId = String(booking.customerId);
        // Emit WebSocket event
        paymentEmitters.emitPaymentFailed(updatedPayment, customerId);
      }

      logger.info(`Payment failed for intent: ${paymentIntentId}`);

      // TODO: Notify customer of payment failure
    } catch (error) {
      logger.error('Error handling payment failure:', error);
      throw error;
    }
  }

  /**
   * Get payment by booking ID
   */
  async getPaymentByBookingId(bookingId: string, userId: string, userRole: string): Promise<IPayment> {
    const payment = await paymentRepository.findByBookingId(bookingId);
    if (!payment) {
      throw new NotFoundError('Payment not found for this booking');
    }

    // Check authorization
    const booking = await bookingRepository.findById(bookingId);
    if (booking) {
      const customerId = String(booking.customerId);
      if (userRole !== 'admin' && userRole !== 'logistics' && customerId !== userId) {
        throw new AuthorizationError('You can only view your own payments');
      }
    }

    return payment;
  }

  /**
   * Get payment by ID
   */
  async getPaymentById(paymentId: string, userId: string, userRole: string): Promise<IPayment> {
    const payment = await paymentRepository.findById(paymentId);
    if (!payment) {
      throw new NotFoundError('Payment not found');
    }

    // Check authorization
    const booking = await bookingRepository.findById(String(payment.bookingId));
    if (booking) {
      const customerId = String(booking.customerId);
      if (userRole !== 'admin' && userRole !== 'logistics' && customerId !== userId) {
        throw new AuthorizationError('You can only view your own payments');
      }
    }

    return payment;
  }

  /**
   * Refund a payment (admin only)
   */
  async refundPayment(data: RefundPaymentData): Promise<IPayment> {
    const { paymentId, amount, reason } = data;

    const payment = await paymentRepository.findById(paymentId);
    if (!payment) {
      throw new NotFoundError('Payment not found');
    }

    // Check if payment can be refunded
    if (payment.status !== PaymentStatus.SUCCEEDED && payment.status !== PaymentStatus.REFUNDED) {
      throw new ValidationError('Only successful payments can be refunded');
    }

    if (payment.status === PaymentStatus.REFUNDED) {
      throw new ValidationError('Payment has already been refunded');
    }

    try {
      // Calculate refund amount (full or partial)
      const refundAmount = amount || payment.amount;
      const refundAmountInCents = Math.round(refundAmount * 100);

      // Create refund in Stripe
      const refund = await stripe.refunds.create({
        payment_intent: payment.stripePaymentIntentId,
        amount: refundAmountInCents,
        reason: reason as Stripe.RefundCreateParams.Reason || 'requested_by_customer',
      });

      // Update payment record
      const updatedPayment = await paymentRepository.setRefund(paymentId, refundAmount);

      // Update booking status if full refund
      if (refundAmount >= payment.amount) {
        await bookingRepository.updateStatus(
          String(payment.bookingId),
          BookingStatus.CANCELLED
        );
      }

      logger.info(`Refund created: ${refund.id} for payment: ${paymentId}`);

      // Get booking details for customer ID
      const booking = await bookingRepository.findById(String(payment.bookingId));
      if (booking) {
        const customerId = String(booking.customerId);
        // Emit WebSocket event
        paymentEmitters.emitPaymentRefunded(updatedPayment, customerId);
      }

      // TODO: Queue refund notification email

      return updatedPayment;
    } catch (error) {
      logger.error('Stripe refund error:', error);
      throw new ExternalServiceError('Failed to process refund', error);
    }
  }

  /**
   * Get all payments (admin only)
   */
  async getAllPayments(): Promise<IPayment[]> {
    return await paymentRepository.findAll();
  }

  /**
   * Verify Stripe webhook signature
   */
  verifyWebhookSignature(payload: string | Buffer, signature: string): Stripe.Event {
    const webhookSecret = env.STRIPE_WEBHOOK_SECRET;
    if (!webhookSecret) {
      throw new Error('STRIPE_WEBHOOK_SECRET is not configured');
    }

    try {
      return stripe.webhooks.constructEvent(payload, signature, webhookSecret);
    } catch (error) {
      logger.error('Webhook signature verification failed:', error);
      throw new ValidationError('Invalid webhook signature');
    }
  }

  /**
   * Get total revenue (admin only)
   */
  async getTotalRevenue(): Promise<number> {
    return await paymentRepository.getTotalRevenue();
  }
}

export default new PaymentService();
