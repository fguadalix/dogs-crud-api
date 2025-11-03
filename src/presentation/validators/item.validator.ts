import { z } from 'zod';

export const createItemSchema = z.object({
  name: z.string().min(1).max(255),
  description: z.string().optional(),
});

export const updateItemSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  description: z.string().optional(),
});

export const idParamSchema = z.object({
  id: z.string().regex(/^\d+$/).transform(Number),
});

export const createMultipleItemsSchema = z.object({
  items: z.array(createItemSchema).min(1),
});
