import { Response, NextFunction } from 'express';
import { AuthRequest } from '../types/common.types';
import authService from '../services/auth.service';
import { HTTP_STATUS } from '../utils/constants';
import {
  RegisterInput,
  LoginInput,
  RefreshTokenInput,
  ChangePasswordInput,
} from '../validators/auth.schema';

export class AuthController {
  async register(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const data: RegisterInput = req.body;
      const result = await authService.register(data);

      res.status(HTTP_STATUS.CREATED).json({
        status: HTTP_STATUS.CREATED,
        message: 'User registered successfully. Please check your email for verification.',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  async login(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const data: LoginInput = req.body;
      const result = await authService.login(data);

      res.status(HTTP_STATUS.OK).json({
        status: HTTP_STATUS.OK,
        message: 'Login successful',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  async refreshToken(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { refreshToken }: RefreshTokenInput = req.body;
      const tokens = await authService.refreshTokens(refreshToken);

      res.status(HTTP_STATUS.OK).json({
        status: HTTP_STATUS.OK,
        message: 'Tokens refreshed successfully',
        data: tokens,
      });
    } catch (error) {
      next(error);
    }
  }

  async getProfile(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        throw new Error('User not authenticated');
      }

      const user = await authService.getProfile(req.user.userId);

      res.status(HTTP_STATUS.OK).json({
        status: HTTP_STATUS.OK,
        data: user,
      });
    } catch (error) {
      next(error);
    }
  }

  async logout(_req: AuthRequest, res: Response, next: NextFunction) {
    try {
      // TODO: Implement token blacklisting with Redis
      // const token = req.headers.authorization?.split(' ')[1];
      // if (token) {
      //   await redisClient.set(`blacklist:${token}`, 'true', 'EX', 3600);
      // }

      res.status(HTTP_STATUS.OK).json({
        status: HTTP_STATUS.OK,
        message: 'Logout successful',
      });
    } catch (error) {
      next(error);
    }
  }

  async changePassword(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        throw new Error('User not authenticated');
      }

      const { currentPassword, newPassword }: ChangePasswordInput = req.body;
      await authService.changePassword(req.user.userId, currentPassword, newPassword);

      res.status(HTTP_STATUS.OK).json({
        status: HTTP_STATUS.OK,
        message: 'Password changed successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  async requestPasswordReset(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { email } = req.body;
      await authService.requestPasswordReset(email);

      res.status(HTTP_STATUS.OK).json({
        status: HTTP_STATUS.OK,
        message: 'If the email exists, a password reset link has been sent',
      });
    } catch (error) {
      next(error);
    }
  }

  async resetPassword(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { token, password } = req.body;
      await authService.resetPassword(token, password);

      res.status(HTTP_STATUS.OK).json({
        status: HTTP_STATUS.OK,
        message: 'Password reset successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  async verifyEmail(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { token } = req.params;
      const user = await authService.verifyEmail(token);

      res.status(HTTP_STATUS.OK).json({
        status: HTTP_STATUS.OK,
        message: 'Email verified successfully',
        data: user,
      });
    } catch (error) {
      next(error);
    }
  }
}

export default new AuthController();
