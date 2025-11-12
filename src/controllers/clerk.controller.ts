import { Request, Response, NextFunction } from 'express';
import clerkService from '../services/clerk.service';
import { verifyClerkWebhook } from '../config/clerk';
import logger from '../config/logger';
import { HTTP_STATUS } from '../utils/constants';

export class ClerkController {
  /**
   * Handle Clerk webhooks
   * POST /api/v1/webhooks/clerk
   */
  async handleWebhook(req: Request, res: Response, next: NextFunction) {
    try {
      // Get raw body as string for signature verification
      const payload = JSON.stringify(req.body);
      const headers = req.headers as Record<string, string>;

      // Verify webhook signature
      let event;
      try {
        event = await verifyClerkWebhook(payload, headers);
      } catch (error) {
        logger.error('Clerk webhook verification failed:', error);
        return res.status(HTTP_STATUS.UNAUTHORIZED).json({
          status: HTTP_STATUS.UNAUTHORIZED,
          error: 'Invalid webhook signature',
        });
      }

      // Process the webhook event
      await clerkService.processWebhookEvent(event as any);

      res.status(HTTP_STATUS.OK).json({
        status: HTTP_STATUS.OK,
        message: 'Webhook processed successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get current user profile (from Clerk)
   * GET /api/v1/auth/me
   */
  async getCurrentUser(req: Request, res: Response, next: NextFunction) {
    try {
      const user = (req as any).user;

      if (!user) {
        return res.status(HTTP_STATUS.UNAUTHORIZED).json({
          status: HTTP_STATUS.UNAUTHORIZED,
          error: 'Not authenticated',
        });
      }

      // Get user from database using Clerk ID
      const { User } = await import('../models/user.model');
      const dbUser = await User.findOne({ clerkId: user.userId });

      if (!dbUser) {
        // Sync user from Clerk if not found in database
        const syncedUser = await clerkService.syncUserFromClerk(user.userId);

        return res.status(HTTP_STATUS.OK).json({
          status: HTTP_STATUS.OK,
          data: {
            id: syncedUser._id,
            clerkId: syncedUser.clerkId,
            email: syncedUser.email,
            name: syncedUser.name,
            role: syncedUser.role,
            phone: syncedUser.phone,
            address: syncedUser.address,
          },
        });
      }

      res.status(HTTP_STATUS.OK).json({
        status: HTTP_STATUS.OK,
        data: {
          id: dbUser._id,
          clerkId: dbUser.clerkId,
          email: dbUser.email,
          name: dbUser.name,
          role: dbUser.role,
          phone: dbUser.phone,
          address: dbUser.address,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update user metadata in Clerk
   * PATCH /api/v1/auth/metadata
   */
  async updateMetadata(req: Request, res: Response, next: NextFunction) {
    try {
      const user = (req as any).user;
      const { role, phone, address } = req.body;

      if (!user) {
        return res.status(HTTP_STATUS.UNAUTHORIZED).json({
          status: HTTP_STATUS.UNAUTHORIZED,
          error: 'Not authenticated',
        });
      }

      // Update in Clerk
      const { clerkClient } = await import('../config/clerk');
      await clerkClient.users.updateUser(user.userId, {
        publicMetadata: { role: role || user.role },
        unsafeMetadata: { address },
      });

      // Update in database
      const { User } = await import('../models/user.model');
      const dbUser = await User.findOne({ clerkId: user.userId });

      if (dbUser) {
        if (role) dbUser.role = role;
        if (phone) dbUser.phone = phone;
        if (address) dbUser.address = address;
        await dbUser.save();
      }

      res.status(HTTP_STATUS.OK).json({
        status: HTTP_STATUS.OK,
        message: 'Metadata updated successfully',
        data: dbUser,
      });
    } catch (error) {
      next(error);
    }
  }
}

export default new ClerkController();
