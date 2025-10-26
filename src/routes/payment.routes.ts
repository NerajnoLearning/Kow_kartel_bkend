import { Router } from 'express';
import paymentController from '../controllers/payment.controller';
import { validate } from '../middlewares/validate.middleware';
import { authenticate } from '../middlewares/auth.middleware';
import { requireAdmin } from '../middlewares/role.middleware';
import {
  createPaymentIntentSchema,
  getPaymentSchema,
  getPaymentByIdSchema,
  refundPaymentSchema,
} from '../validators/payment.schema';
import express from 'express';

const router = Router();

/**
 * @route   POST /api/v1/payments/intent
 * @desc    Create payment intent for a booking
 * @access  Private (booking owner)
 */
router.post(
  '/intent',
  authenticate,
  validate(createPaymentIntentSchema),
  paymentController.createPaymentIntent
);

/**
 * @route   GET /api/v1/payments/booking/:bookingId
 * @desc    Get payment by booking ID
 * @access  Private (booking owner or admin)
 */
router.get(
  '/booking/:bookingId',
  authenticate,
  validate(getPaymentSchema),
  paymentController.getPaymentByBookingId
);

/**
 * @route   GET /api/v1/payments/:id
 * @desc    Get payment by payment ID
 * @access  Private (booking owner or admin)
 */
router.get(
  '/:id',
  authenticate,
  validate(getPaymentByIdSchema),
  paymentController.getPaymentById
);

/**
 * @route   POST /api/v1/payments/:id/refund
 * @desc    Refund a payment (admin only)
 * @access  Private/Admin
 */
router.post(
  '/:id/refund',
  authenticate,
  requireAdmin,
  validate(refundPaymentSchema),
  paymentController.refundPayment
);

/**
 * @route   GET /api/v1/payments
 * @desc    Get all payments (admin only)
 * @access  Private/Admin
 */
router.get('/', authenticate, requireAdmin, paymentController.getAllPayments);

/**
 * @route   GET /api/v1/payments/revenue/total
 * @desc    Get total revenue (admin only)
 * @access  Private/Admin
 */
router.get('/revenue/total', authenticate, requireAdmin, paymentController.getTotalRevenue);

/**
 * @route   POST /api/v1/payments/webhook
 * @desc    Handle Stripe webhook events
 * @access  Public (Stripe webhooks)
 * @note    This endpoint uses raw body parser for webhook signature verification
 */
router.post(
  '/webhook',
  express.raw({ type: 'application/json' }),
  paymentController.handleWebhook
);

export default router;
