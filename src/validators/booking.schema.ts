import { z } from 'zod';

export const createBookingSchema = z.object({
  body: z
    .object({
      equipmentId: z.string().min(1, 'Equipment ID is required'),
      startDate: z.string().datetime('Invalid start date format'),
      endDate: z.string().datetime('Invalid end date format'),
      deliveryAddress: z.string().min(5, 'Delivery address must be at least 5 characters'),
      notes: z.string().optional(),
    })
    .refine((data) => new Date(data.endDate) > new Date(data.startDate), {
      message: 'End date must be after start date',
      path: ['endDate'],
    }),
});

export const updateBookingSchema = z.object({
  params: z.object({
    id: z.string().min(1, 'Booking ID is required'),
  }),
  body: z.object({
    startDate: z.string().datetime('Invalid start date format').optional(),
    endDate: z.string().datetime('Invalid end date format').optional(),
    deliveryAddress: z.string().min(5, 'Delivery address must be at least 5 characters').optional(),
    notes: z.string().optional(),
    status: z.enum(['pending', 'confirmed', 'active', 'completed', 'cancelled']).optional(),
  }),
});

export const getBookingSchema = z.object({
  params: z.object({
    id: z.string().min(1, 'Booking ID is required'),
  }),
});

export const listBookingsSchema = z.object({
  query: z.object({
    page: z.string().optional(),
    limit: z.string().optional(),
    status: z.enum(['pending', 'confirmed', 'active', 'completed', 'cancelled']).optional(),
    customerId: z.string().optional(),
    equipmentId: z.string().optional(),
    startDate: z.string().optional(),
    endDate: z.string().optional(),
  }),
});

export const cancelBookingSchema = z.object({
  params: z.object({
    id: z.string().min(1, 'Booking ID is required'),
  }),
});

export const checkAvailabilitySchema = z.object({
  params: z.object({
    equipmentId: z.string().min(1, 'Equipment ID is required'),
  }),
  query: z.object({
    startDate: z.string().datetime('Invalid start date format'),
    endDate: z.string().datetime('Invalid end date format'),
  }),
});

export type CreateBookingInput = z.infer<typeof createBookingSchema>['body'];
export type UpdateBookingInput = z.infer<typeof updateBookingSchema>['body'];
export type ListBookingsQuery = z.infer<typeof listBookingsSchema>['query'];
