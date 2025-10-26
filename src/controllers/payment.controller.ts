import { Request, Response, NextFunction } from 'express';
import { AuthRequest } from '../types/common.types';
import paymentService from '../services/payment.service';
import { HTTP_STATUS } from '../utils/constants';
import logger from '../config/logger';

export class PaymentController {
  /**
   * Create payment intent for a booking
   */
  async createPaymentIntent(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        throw new Error('User not authenticated');
      }

      const { bookingId } = req.body;

      const result = await paymentService.createPaymentIntent({
        bookingId,
        userId: req.user.userId,
        userRole: req.user.role,
      });

      res.status(HTTP_STATUS.CREATED).json({
        status: HTTP_STATUS.CREATED,
        message: 'Payment intent created successfully',
        data: {
          paymentId: result.payment._id,
          clientSecret: result.clientSecret,
          amount: result.payment.amount,
          currency: result.payment.currency,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get payment by booking ID
   */
  async getPaymentByBookingId(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        throw new Error('User not authenticated');
      }

      const { bookingId } = req.params;

      const payment = await paymentService.getPaymentByBookingId(
        bookingId,
        req.user.userId,
        req.user.role
      );

      res.status(HTTP_STATUS.OK).json({
        status: HTTP_STATUS.OK,
        data: payment,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get payment by payment ID
   */
  async getPaymentById(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        throw new Error('User not authenticated');
      }

      const { id } = req.params;

      const payment = await paymentService.getPaymentById(
        id,
        req.user.userId,
        req.user.role
      );

      res.status(HTTP_STATUS.OK).json({
        status: HTTP_STATUS.OK,
        data: payment,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Refund a payment (admin only)
   */
  async refundPayment(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const { amount, reason } = req.body;

      const payment = await paymentService.refundPayment({
        paymentId: id,
        amount,
        reason,
      });

      res.status(HTTP_STATUS.OK).json({
        status: HTTP_STATUS.OK,
        message: 'Refund processed successfully',
        data: payment,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get all payments (admin only)
   */
  async getAllPayments(_req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const payments = await paymentService.getAllPayments();

      res.status(HTTP_STATUS.OK).json({
        status: HTTP_STATUS.OK,
        data: payments,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get total revenue (admin only)
   */
  async getTotalRevenue(_req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const revenue = await paymentService.getTotalRevenue();

      res.status(HTTP_STATUS.OK).json({
        status: HTTP_STATUS.OK,
        data: { totalRevenue: revenue },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Handle Stripe webhook events
   */
  async handleWebhook(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const signature = req.headers['stripe-signature'] as string;

      if (!signature) {
        res.status(HTTP_STATUS.BAD_REQUEST).json({
          status: HTTP_STATUS.BAD_REQUEST,
          error: 'Missing stripe-signature header',
        });
        return;
      }

      // Verify webhook signature
      const event = paymentService.verifyWebhookSignature(req.body, signature);

      logger.info(`Webhook received: ${event.type}`);

      // Handle different event types
      switch (event.type) {
        case 'payment_intent.succeeded':
          await paymentService.handlePaymentSuccess(event.data.object.id);
          break;

        case 'payment_intent.payment_failed':
          await paymentService.handlePaymentFailure(event.data.object.id);
          break;

        case 'charge.refunded':
          logger.info(`Refund processed: ${event.data.object.id}`);
          break;

        default:
          logger.info(`Unhandled event type: ${event.type}`);
      }

      res.status(HTTP_STATUS.OK).json({ received: true });
    } catch (error) {
      logger.error('Webhook handler error:', error);
      next(error);
    }
  }
}

export default new PaymentController();
