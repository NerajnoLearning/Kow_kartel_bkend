import { userRepository } from '../repositories';
import { IUser } from '../models/user.model';
import {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
} from '../utils/jwt';
import {
  AuthenticationError,
  ConflictError,
  NotFoundError,
  ValidationError,
} from '../utils/errorHandler';
import crypto from 'crypto';

export interface RegisterData {
  email: string;
  password: string;
  name: string;
}

export interface LoginData {
  email: string;
  password: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface AuthResponse {
  user: Partial<IUser>;
  tokens: AuthTokens;
}

export class AuthService {
  async register(data: RegisterData): Promise<AuthResponse> {
    // Check if user already exists
    const existingUser = await userRepository.existsByEmail(data.email);
    if (existingUser) {
      throw new ConflictError('User with this email already exists');
    }

    // Create verification token
    const verificationToken = crypto.randomBytes(32).toString('hex');

    // Create user
    const user = await userRepository.create({
      ...data,
      verificationToken,
      verified: false,
    });

    // TODO: Queue verification email job
    // await emailQueue.add('send-verification-email', {
    //   email: user.email,
    //   name: user.name,
    //   token: verificationToken,
    // });

    // Generate tokens
    const tokens = this.generateTokens(user);

    return {
      user: this.sanitizeUser(user),
      tokens,
    };
  }

  async login(data: LoginData): Promise<AuthResponse> {
    // Find user by email
    const user = await userRepository.findByEmail(data.email);
    if (!user) {
      throw new AuthenticationError('Invalid credentials');
    }

    // Check password
    const isPasswordValid = await user.comparePassword(data.password);
    if (!isPasswordValid) {
      throw new AuthenticationError('Invalid credentials');
    }

    // Check if user is verified
    if (!user.verified) {
      throw new AuthenticationError('Please verify your email before logging in');
    }

    // Generate tokens
    const tokens = this.generateTokens(user);

    return {
      user: this.sanitizeUser(user),
      tokens,
    };
  }

  async refreshTokens(refreshToken: string): Promise<AuthTokens> {
    // Verify refresh token
    const payload = verifyRefreshToken(refreshToken);

    // Find user
    const user = await userRepository.findById(payload.userId);
    if (!user) {
      throw new AuthenticationError('User not found');
    }

    // Generate new tokens
    return this.generateTokens(user);
  }

  async getProfile(userId: string): Promise<Partial<IUser>> {
    const user = await userRepository.findById(userId);
    if (!user) {
      throw new NotFoundError('User not found');
    }

    return this.sanitizeUser(user);
  }

  async verifyEmail(token: string): Promise<Partial<IUser>> {
    // Find user by verification token
    const user = await userRepository.findByEmail(''); // TODO: Need to add method to find by verification token

    if (!user || user.verificationToken !== token) {
      throw new ValidationError('Invalid or expired verification token');
    }

    if (user.verified) {
      throw new ValidationError('Email already verified');
    }

    // Set user as verified
    const verifiedUser = await userRepository.setVerified(String(user._id));

    return this.sanitizeUser(verifiedUser);
  }

  async requestPasswordReset(email: string): Promise<void> {
    const user = await userRepository.findByEmail(email);
    if (!user) {
      // Don't reveal if user exists for security
      return;
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetExpires = new Date(Date.now() + 3600000); // 1 hour

    await userRepository.setResetToken(String(user._id), resetToken, resetExpires);

    // TODO: Queue password reset email job
    // await emailQueue.add('send-password-reset-email', {
    //   email: user.email,
    //   name: user.name,
    //   token: resetToken,
    // });
  }

  async resetPassword(token: string, newPassword: string): Promise<void> {
    const user = await userRepository.findByResetToken(token);
    if (!user) {
      throw new ValidationError('Invalid or expired reset token');
    }

    // Update password
    user.password = newPassword;
    await user.save();

    // Clear reset token
    await userRepository.clearResetToken(String(user._id));
  }

  async changePassword(
    userId: string,
    currentPassword: string,
    newPassword: string
  ): Promise<void> {
    const user = await userRepository.findByIdWithPassword(userId);
    if (!user) {
      throw new NotFoundError('User not found');
    }

    // Verify current password
    const isPasswordValid = await user.comparePassword(currentPassword);
    if (!isPasswordValid) {
      throw new AuthenticationError('Current password is incorrect');
    }

    // Update password
    user.password = newPassword;
    await user.save();
  }

  private generateTokens(user: IUser): AuthTokens {
    const payload = {
      userId: String(user._id),
      email: user.email,
      role: user.role,
    };

    return {
      accessToken: generateAccessToken(payload),
      refreshToken: generateRefreshToken(payload),
    };
  }

  private sanitizeUser(user: IUser): Partial<IUser> {
    return {
      _id: user._id,
      email: user.email,
      name: user.name,
      role: user.role,
      verified: user.verified,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }
}

export default new AuthService();
