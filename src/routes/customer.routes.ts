import { Router } from 'express';
import {
  getAllCustomers,
  getCustomerById,
  updateCustomerProfile,
  deleteCustomer,
  getCustomerStats,
  getCustomerBookingHistory,
  getTopCustomers,
  getCustomerOverview,
} from '../controllers/customer.controller';
import { authenticate } from '../middlewares/auth.middleware';
import { authorize } from '../middlewares/role.middleware';
import { validate } from '../middlewares/validate.middleware';
import {
  updateCustomerProfileSchema,
  getAllCustomersSchema,
  getCustomerByIdSchema,
  getTopCustomersSchema,
} from '../validators/customer.schema';

const router = Router();

// All routes require authentication
router.use(authenticate);

/**
 * Admin-only routes
 */

// GET /api/v1/customers/overview - Get customer overview statistics
router.get(
  '/overview',
  authorize(['admin', 'logistics']),
  getCustomerOverview
);

// GET /api/v1/customers/top - Get top customers by spending
router.get(
  '/top',
  authorize(['admin', 'logistics']),
  validate(getTopCustomersSchema),
  getTopCustomers
);

// GET /api/v1/customers - Get all customers
router.get(
  '/',
  authorize(['admin', 'logistics']),
  validate(getAllCustomersSchema),
  getAllCustomers
);

// DELETE /api/v1/customers/:id - Delete customer
router.delete(
  '/:id',
  authorize(['admin']),
  validate(getCustomerByIdSchema),
  deleteCustomer
);

/**
 * Customer and Admin routes
 */

// GET /api/v1/customers/:id - Get customer by ID
router.get(
  '/:id',
  validate(getCustomerByIdSchema),
  getCustomerById
);

// PUT /api/v1/customers/:id - Update customer profile
router.put(
  '/:id',
  validate(updateCustomerProfileSchema),
  updateCustomerProfile
);

// GET /api/v1/customers/:id/stats - Get customer statistics
router.get(
  '/:id/stats',
  validate(getCustomerByIdSchema),
  getCustomerStats
);

// GET /api/v1/customers/:id/bookings - Get customer booking history
router.get(
  '/:id/bookings',
  validate(getCustomerByIdSchema),
  getCustomerBookingHistory
);

export default router;
