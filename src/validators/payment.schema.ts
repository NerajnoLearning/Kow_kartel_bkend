import { z } from 'zod';

export const createPaymentIntentSchema = z.object({
  body: z.object({
    bookingId: z.string().min(1, 'Booking ID is required'),
  }),
});

export const confirmPaymentSchema = z.object({
  body: z.object({
    paymentIntentId: z.string().min(1, 'Payment Intent ID is required'),
  }),
});

export const getPaymentSchema = z.object({
  params: z.object({
    bookingId: z.string().min(1, 'Booking ID is required'),
  }),
});

export const getPaymentByIdSchema = z.object({
  params: z.object({
    id: z.string().min(1, 'Payment ID is required'),
  }),
});

export const refundPaymentSchema = z.object({
  params: z.object({
    id: z.string().min(1, 'Payment ID is required'),
  }),
  body: z.object({
    amount: z.number().positive().optional(),
    reason: z.string().optional(),
  }),
});

export const webhookSchema = z.object({
  body: z.any(), // Stripe webhook payloads vary
});

export type CreatePaymentIntentInput = z.infer<typeof createPaymentIntentSchema>['body'];
export type ConfirmPaymentInput = z.infer<typeof confirmPaymentSchema>['body'];
export type RefundPaymentInput = z.infer<typeof refundPaymentSchema>['body'];
