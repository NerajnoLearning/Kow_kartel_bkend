import { Response, NextFunction } from 'express';
import { AuthRequest } from '../types/common.types';
import { verifyAccessToken } from '../utils/jwt';
import { AuthenticationError } from '../utils/errorHandler';

export const authenticate = (req: AuthRequest, _res: Response, next: NextFunction) => {
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

export const optionalAuthenticate = (req: AuthRequest, _res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      return next();
    }

    const [bearer, token] = authHeader.split(' ');

    if (bearer !== 'Bearer' || !token) {
      return next();
    }

    const payload = verifyAccessToken(token);
    req.user = payload;

    next();
  } catch (error) {
    // Don't throw error for optional auth, just continue without user
    next();
  }
};
