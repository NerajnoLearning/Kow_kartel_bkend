import { Request } from 'express';
import { TokenPayload } from '../utils/jwt';

/**
 * Clerk user data attached to request
 */
export interface ClerkUser {
  userId: string;
  email: string;
  role: string;
}

/**
 * Extended Express Request with Clerk user data
 */
export interface AuthRequest extends Request {
  user?: ClerkUser | TokenPayload; // Support both Clerk and legacy JWT
}

export interface QueryParams {
  page?: string;
  limit?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  search?: string;
}
