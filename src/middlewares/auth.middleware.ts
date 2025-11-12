import { Response, NextFunction } from 'express';
import { AuthRequest } from '../types/common.types';
import { verifyAccessToken } from '../utils/jwt';
import { AuthenticationError } from '../utils/errorHandler';
import { clerkClient } from '../config/clerk';
import logger from '../config/logger';

/**
 * Clerk-based authentication middleware
 * Verifies Clerk session token and attaches user data to request
 */
export const authenticate = async (req: AuthRequest, _res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      throw new AuthenticationError('No authorization header provided');
    }

    const [bearer, token] = authHeader.split(' ');

    if (bearer !== 'Bearer' || !token) {
      throw new AuthenticationError('Invalid authorization format. Use: Bearer <token>');
    }

    // Verify Clerk session token
    const sessionToken = token;

    try {
      // Verify the session token with Clerk
      const session = await clerkClient.sessions.verifySession(sessionToken, sessionToken);

      if (!session || !session.userId) {
        throw new AuthenticationError('Invalid or expired session');
      }

      // Get user details from Clerk
      const clerkUser = await clerkClient.users.getUser(session.userId);

      // Attach user info to request
      req.user = {
        userId: clerkUser.id,
        email: clerkUser.emailAddresses[0]?.emailAddress || '',
        role: (clerkUser.publicMetadata?.role as string) || 'customer',
      };

      next();
    } catch (clerkError) {
      logger.error('Clerk authentication error:', clerkError);
      throw new AuthenticationError('Authentication failed');
    }
  } catch (error) {
    next(error);
  }
};

/**
 * Optional authentication - doesn't fail if no token provided
 */
export const optionalAuthenticate = async (
  req: AuthRequest,
  _res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      return next();
    }

    const [bearer, token] = authHeader.split(' ');

    if (bearer !== 'Bearer' || !token) {
      return next();
    }

    try {
      const session = await clerkClient.sessions.verifySession(token, token);

      if (session && session.userId) {
        const clerkUser = await clerkClient.users.getUser(session.userId);

        req.user = {
          userId: clerkUser.id,
          email: clerkUser.emailAddresses[0]?.emailAddress || '',
          role: (clerkUser.publicMetadata?.role as string) || 'customer',
        };
      }
    } catch (clerkError) {
      logger.debug('Optional authentication failed, continuing without user');
    }

    next();
  } catch (error) {
    // Don't throw error for optional auth, just continue without user
    next();
  }
};

/**
 * Legacy JWT authentication (kept for backward compatibility)
 * TODO: Remove after full Clerk migration
 */
export const authenticateLegacy = (req: AuthRequest, _res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      throw new AuthenticationError('No authorization header provided');
    }

    const [bearer, token] = authHeader.split(' ');

    if (bearer !== 'Bearer' || !token) {
      throw new AuthenticationError('Invalid authorization format. Use: Bearer <token>');
    }

    const payload = verifyAccessToken(token);
    req.user = payload;

    next();
  } catch (error) {
    next(error);
  }
};
