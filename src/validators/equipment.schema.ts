import { z } from 'zod';

export const createEquipmentSchema = z.object({
  body: z.object({
    name: z.string().min(2, 'Name must be at least 2 characters'),
    category: z.string().min(2, 'Category is required'),
    description: z.string().min(10, 'Description must be at least 10 characters'),
    dailyRate: z.number().positive('Daily rate must be a positive number'),
    imageUrls: z.array(z.string().url('Invalid image URL')).optional().default([]),
    specifications: z.record(z.string(), z.any()).optional(),
    status: z.enum(['available', 'maintenance', 'retired']).optional().default('available'),
  }),
});

export const updateEquipmentSchema = z.object({
  params: z.object({
    id: z.string().min(1, 'Equipment ID is required'),
  }),
  body: z.object({
    name: z.string().min(2, 'Name must be at least 2 characters').optional(),
    category: z.string().min(2, 'Category is required').optional(),
    description: z.string().min(10, 'Description must be at least 10 characters').optional(),
    dailyRate: z.number().positive('Daily rate must be a positive number').optional(),
    imageUrls: z.array(z.string().url('Invalid image URL')).optional(),
    specifications: z.record(z.string(), z.any()).optional(),
    status: z.enum(['available', 'maintenance', 'retired']).optional(),
  }),
});

export const getEquipmentSchema = z.object({
  params: z.object({
    id: z.string().min(1, 'Equipment ID is required'),
  }),
});

export const listEquipmentSchema = z.object({
  query: z.object({
    page: z.string().optional(),
    limit: z.string().optional(),
    category: z.string().optional(),
    status: z.enum(['available', 'maintenance', 'retired']).optional(),
    search: z.string().optional(),
    minRate: z.string().optional(),
    maxRate: z.string().optional(),
    available: z.string().optional(), // 'true' or 'false'
    startDate: z.string().optional(), // ISO date string
    endDate: z.string().optional(), // ISO date string
  }),
});

export const deleteEquipmentSchema = z.object({
  params: z.object({
    id: z.string().min(1, 'Equipment ID is required'),
  }),
});

export const updateEquipmentStatusSchema = z.object({
  params: z.object({
    id: z.string().min(1, 'Equipment ID is required'),
  }),
  body: z.object({
    status: z.enum(['available', 'maintenance', 'retired']),
  }),
});

export const addImagesSchema = z.object({
  params: z.object({
    id: z.string().min(1, 'Equipment ID is required'),
  }),
  body: z.object({
    imageUrls: z.array(z.string().url('Invalid image URL')).min(1, 'At least one image URL is required'),
  }),
});

export const removeImageSchema = z.object({
  params: z.object({
    id: z.string().min(1, 'Equipment ID is required'),
  }),
  body: z.object({
    imageUrl: z.string().url('Invalid image URL'),
  }),
});

export type CreateEquipmentInput = z.infer<typeof createEquipmentSchema>['body'];
export type UpdateEquipmentInput = z.infer<typeof updateEquipmentSchema>['body'];
export type ListEquipmentQuery = z.infer<typeof listEquipmentSchema>['query'];
