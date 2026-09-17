import { z } from 'zod';

const httpMethods = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'HEAD'] as const;

export const createServiceSchema = z.object({
  body: z.object({
    name: z.string().trim().min(1, 'Name is required').max(100),
    url: z.string().url('Must be a valid URL'),
    method: z.enum(httpMethods).default('GET'),
    expected_status: z.coerce.number().int().min(100).max(599).default(200),
    check_interval_sec: z.coerce.number().int().min(10, 'Interval must be at least 10 seconds').default(60),
    enabled: z.boolean().default(true),
  }),
});

export const updateServiceSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid service ID format'),
  }),
  body: z.object({
    name: z.string().trim().min(1).max(100).optional(),
    url: z.string().url().optional(),
    method: z.enum(httpMethods).optional(),
    expected_status: z.coerce.number().int().min(100).max(599).optional(),
    check_interval_sec: z.coerce.number().int().min(10).optional(),
    enabled: z.boolean().optional(),
  }),
});

export const serviceIdParamSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid service ID format'),
  }),
});

export type CreateServiceInput = z.infer<typeof createServiceSchema>['body'];
export type UpdateServiceInput = z.infer<typeof updateServiceSchema>['body'];