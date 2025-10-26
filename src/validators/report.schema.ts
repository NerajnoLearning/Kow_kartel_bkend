import { z } from 'zod';

/**
 * Revenue report query schema
 */
export const revenueReportSchema = z.object({
  query: z.object({
    startDate: z.string().datetime().optional(),
    endDate: z.string().datetime().optional(),
    equipmentId: z.string().length(24, 'Invalid equipment ID').optional(),
    customerId: z.string().length(24, 'Invalid customer ID').optional(),
    groupBy: z.enum(['day', 'week', 'month']).optional(),
  }),
});

/**
 * Utilization report query schema
 */
export const utilizationReportSchema = z.object({
  query: z.object({
    startDate: z.string().datetime({ message: 'Start date is required and must be a valid date' }),
    endDate: z.string().datetime({ message: 'End date is required and must be a valid date' }),
    equipmentId: z.string().length(24, 'Invalid equipment ID').optional(),
  }),
});

/**
 * Booking stats query schema
 */
export const bookingStatsSchema = z.object({
  query: z.object({
    startDate: z.string().datetime().optional(),
    endDate: z.string().datetime().optional(),
  }),
});

/**
 * Popular equipment query schema
 */
export const popularEquipmentSchema = z.object({
  query: z.object({
    limit: z.string().regex(/^\d+$/, 'Limit must be a number').optional(),
  }),
});

/**
 * Comprehensive report query schema
 */
export const comprehensiveReportSchema = z.object({
  query: z.object({
    startDate: z.string().datetime().optional(),
    endDate: z.string().datetime().optional(),
  }),
});
