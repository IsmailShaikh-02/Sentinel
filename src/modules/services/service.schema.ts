// src/modules/services/service.schema.ts
import { z } from 'zod';

const httpMethods = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'HEAD'] as const;
const serviceTypes = ['http', 'heartbeat'] as const;

export const createServiceSchema = z.object({
  body: z
    .object({
      name: z.string().trim().min(1, 'Name is required').max(100),
      type: z.enum(serviceTypes).default('http'),
      url: z.string().url('Must be a valid URL').optional(),
      method: z.enum(httpMethods).default('GET'),
      expected_status: z.coerce.number().int().min(100).max(599).default(200),
      check_interval_sec: z.coerce
        .number()
        .int()
        .min(10, 'Interval must be at least 10 seconds')
        .default(60),
      enabled: z.boolean().default(true),
    })
    .refine(
      (data) => {
        if (data.type === 'http' && !data.url) {
          return false;
        }
        return true;
      },
      {
        message: 'URL is required for active HTTP services',
        path: ['url'],
      }
    ),
});

export const updateServiceSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid service ID format'),
  }),
  body: z.object({
    name: z.string().trim().min(1).max(100).optional(),
    url: z.string().url('Must be a valid URL').optional(),
    method: z.enum(httpMethods).optional(),
    expected_status: z.coerce.number().int().min(100).max(599).optional(),
    check_interval_sec: z.coerce
      .number()
      .int()
      .min(10, 'Interval must be at least 10 seconds')
      .optional(),
    enabled: z.boolean().optional(),
    // 'type' is intentionally omitted: immutable after creation
  }),
});

export const serviceIdParamSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid service ID format'),
  }),
});

export type CreateServiceInput = z.infer<typeof createServiceSchema>['body'];
export type UpdateServiceInput = z.infer<typeof updateServiceSchema>['body'];