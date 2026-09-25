import { z } from 'zod';

export const uptimeQuerySchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid service ID format'),
  }),
  query: z.object({
    window: z.enum(['24h', '7d', '30d']).default('24h'),
  }),
});

export const latencyQuerySchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid service ID format'),
  }),
  query: z.object({
    window: z.enum(['24h', '7d', '30d']).default('24h'),
  }),
});

export type UptimeWindow = '24h' | '7d' | '30d';