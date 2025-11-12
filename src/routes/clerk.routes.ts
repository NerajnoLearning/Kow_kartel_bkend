import { Router } from 'express';
import clerkController from '../controllers/clerk.controller';
import { authenticate } from '../middlewares/auth.middleware';

const router = Router();

/**
 * @route   POST /api/v1/webhooks/clerk
 * @desc    Handle Clerk webhooks (user.created, user.updated, user.deleted)
 * @access  Public (verified via webhook signature)
 */
router.post('/webhooks/clerk', clerkController.handleWebhook);

/**
 * @route   GET /api/v1/auth/me
 * @desc    Get current authenticated user
 * @access  Private
 */
router.get('/auth/me', authenticate, clerkController.getCurrentUser);

/**
 * @route   PATCH /api/v1/auth/metadata
 * @desc    Update user metadata (role, phone, address)
 * @access  Private
 */
router.patch('/auth/metadata', authenticate, clerkController.updateMetadata);

export default router;
