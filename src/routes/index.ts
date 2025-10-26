import { Router } from 'express';
import authRoutes from './auth.routes';
import equipmentRoutes from './equipment.routes';
import bookingRoutes from './booking.routes';
import paymentRoutes from './payment.routes';
import customerRoutes from './customer.routes';
import reportRoutes from './report.routes';

const router = Router();

// Mount routes
router.use('/auth', authRoutes);
router.use('/equipment', equipmentRoutes);
router.use('/bookings', bookingRoutes);
router.use('/payments', paymentRoutes);
router.use('/customers', customerRoutes);
router.use('/reports', reportRoutes);

export default router;
