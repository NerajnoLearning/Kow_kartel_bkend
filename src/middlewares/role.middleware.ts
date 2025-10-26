import { Response, NextFunction } from 'express';
import { AuthRequest } from '../types/common.types';
import { AuthorizationError } from '../utils/errorHandler';
import { USER_ROLES } from '../utils/constants';

export const requireRole = (...allowedRoles: string[]) => {
  return (req: AuthRequest, _res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw new AuthorizationError('Authentication required');
      }

      if (!allowedRoles.includes(req.user.role)) {
        throw new AuthorizationError(
          `Access denied. Required roles: ${allowedRoles.join(', ')}`
        );
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};

export const requireAdmin = requireRole(USER_ROLES.ADMIN);
export const requireAdminOrLogistics = requireRole(USER_ROLES.ADMIN, USER_ROLES.LOGISTICS);
