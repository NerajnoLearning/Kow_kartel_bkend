import { z } from 'zod';

/**
 * Update customer profile schema
 */
export const updateCustomerProfileSchema = z.object({
  body: z.object({
    name: z.string().min(2, 'Name must be at least 2 characters').optional(),
    phone: z.string().regex(/^\+?[\d\s\-()]+$/, 'Invalid phone number format').optional(),
    address: z.string().min(5, 'Address must be at least 5 characters').optional(),
  }),
});

/**
 * Get all customers query schema
 */
export const getAllCustomersSchema = z.object({
  query: z.object({
    verified: z.enum(['true', 'false']).optional(),
    search: z.string().optional(),
    page: z.string().regex(/^\d+$/, 'Page must be a number').optional(),
    limit: z.string().regex(/^\d+$/, 'Limit must be a number').optional(),
    sortBy: z.enum(['createdAt', 'name', 'email']).optional(),
    sortOrder: z.enum(['asc', 'desc']).optional(),
  }),
});

/**
 * Get customer by ID params schema
 */
export const getCustomerByIdSchema = z.object({
  params: z.object({
    id: z.string().length(24, 'Invalid customer ID'),
  }),
});

/**
 * Get top customers query schema
 */
export const getTopCustomersSchema = z.object({
  query: z.object({
    limit: z.string().regex(/^\d+$/, 'Limit must be a number').optional(),
  }),
});
