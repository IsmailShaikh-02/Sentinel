import { z } from "zod";

export const windowOptionSchema = z.enum(["24h", "7d", "30d"]);
export type WindowOption = z.infer<typeof windowOptionSchema>;

export const uptimeSchema = z.object({
  serviceId: z.string(),
  window: z.string().optional(),
  totalChecks: z.number().optional(),
  successfulChecks: z.number().optional(),
  uptimePercentage: z.number(),
  history: z
    .array(
      z.object({
        timestamp: z.string(),
        uptimePercentage: z.number(),
      })
    )
    .optional(),
});

export type UptimeData = z.infer<typeof uptimeSchema>;

export const latencySchema = z.object({
  serviceId: z.string(),
  window: z.string().optional(),
  sampleCount: z.number().optional(),
  avgMs: z.number(),
  p50Ms: z.number(),
  p95Ms: z.number(),
  p99Ms: z.number(),
  history: z
    .array(
      z.object({
        timestamp: z.string(),
        avgMs: z.number(),
        p50Ms: z.number(),
        p95Ms: z.number(),
        p99Ms: z.number(),
      })
    )
    .optional(),
});

export type LatencyData = z.infer<typeof latencySchema>;
