import { Router } from 'express';
import bookingController from '../controllers/booking.controller';
import { validate } from '../middlewares/validate.middleware';
import { authenticate } from '../middlewares/auth.middleware';
import { requireAdminOrLogistics } from '../middlewares/role.middleware';
import {
  createBookingSchema,
  updateBookingSchema,
  getBookingSchema,
  listBookingsSchema,
  cancelBookingSchema,
  checkAvailabilitySchema,
} from '../validators/booking.schema';

const router = Router();

/**
 * @route   GET /api/v1/bookings
 * @desc    Get all bookings (admin/logistics see all, customers see their own)
 * @access  Private
 */
router.get('/', authenticate, validate(listBookingsSchema), bookingController.getAllBookings);

/**
 * @route   GET /api/v1/bookings/my-bookings
 * @desc    Get current user's bookings
 * @access  Private
 */
router.get('/my-bookings', authenticate, bookingController.getMyBookings);

/**
 * @route   GET /api/v1/bookings/:id
 * @desc    Get booking by ID
 * @access  Private
 */
router.get('/:id', authenticate, validate(getBookingSchema), bookingController.getBookingById);

/**
 * @route   POST /api/v1/bookings
 * @desc    Create new booking
 * @access  Private
 */
router.post('/', authenticate, validate(createBookingSchema), bookingController.createBooking);

/**
 * @route   PUT /api/v1/bookings/:id
 * @desc    Update booking
 * @access  Private (owner or admin/logistics)
 */
router.put(
  '/:id',
  authenticate,
  validate(updateBookingSchema),
  bookingController.updateBooking
);

/**
 * @route   PATCH /api/v1/bookings/:id/cancel
 * @desc    Cancel booking
 * @access  Private (owner or admin)
 */
router.patch(
  '/:id/cancel',
  authenticate,
  validate(cancelBookingSchema),
  bookingController.cancelBooking
);

/**
 * @route   PATCH /api/v1/bookings/:id/confirm
 * @desc    Confirm booking (admin/logistics only)
 * @access  Private/Admin/Logistics
 */
router.patch(
  '/:id/confirm',
  authenticate,
  requireAdminOrLogistics,
  validate(getBookingSchema),
  bookingController.confirmBooking
);

/**
 * @route   PATCH /api/v1/bookings/:id/start
 * @desc    Start booking (mark as active)
 * @access  Private/Admin/Logistics
 */
router.patch(
  '/:id/start',
  authenticate,
  requireAdminOrLogistics,
  validate(getBookingSchema),
  bookingController.startBooking
);

/**
 * @route   PATCH /api/v1/bookings/:id/complete
 * @desc    Complete booking
 * @access  Private/Admin/Logistics
 */
router.patch(
  '/:id/complete',
  authenticate,
  requireAdminOrLogistics,
  validate(getBookingSchema),
  bookingController.completeBooking
);

/**
 * @route   DELETE /api/v1/bookings/:id
 * @desc    Delete booking (admin only, only pending/cancelled bookings)
 * @access  Private/Admin
 */
router.delete(
  '/:id',
  authenticate,
  requireAdminOrLogistics,
  validate(getBookingSchema),
  bookingController.deleteBooking
);

/**
 * @route   GET /api/v1/bookings/availability/:equipmentId
 * @desc    Check equipment availability for date range
 * @access  Public
 */
router.get(
  '/availability/:equipmentId',
  validate(checkAvailabilitySchema),
  bookingController.checkAvailability
);

export default router;
