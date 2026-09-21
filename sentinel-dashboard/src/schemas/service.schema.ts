import { z } from "zod";

export const serviceTypeSchema = z.enum(["http", "heartbeat"]);
export type ServiceType = z.infer<typeof serviceTypeSchema>;

export const httpMethodSchema = z.enum(["GET", "POST", "HEAD", "PUT", "DELETE"]);
export type HttpMethod = z.infer<typeof httpMethodSchema>;

export const serviceSchema = z.object({
  id: z.string(),
  name: z.string(),
  type: serviceTypeSchema,
  url: z.string().nullable().optional(),
  method: httpMethodSchema.nullable().optional().default("GET"),
  expected_status: z.number().nullable().optional().default(200),
  check_interval_sec: z.number(),
  enabled: z.boolean().default(true),
  heartbeat_key: z.string().nullable().optional(),
  created_at: z.string().optional(),
  last_check_ok: z.boolean().nullable().optional(),
  last_status_code: z.number().nullable().optional(),
  last_response_time_ms: z.number().nullable().optional(),
  last_checked_at: z.string().nullable().optional(),
});

export type Service = z.infer<typeof serviceSchema>;

export const createServiceSchema = z
  .object({
    name: z.string().trim().min(1, "Name is required"),
    type: serviceTypeSchema.default("http"),
    url: z.string().optional(),
    method: httpMethodSchema.default("GET"),
    expected_status: z.coerce.number().min(100).max(599).default(200),
    check_interval_sec: z.coerce.number().min(10, "Interval must be at least 10 seconds"),
    enabled: z.boolean().default(true),
  })
  .refine(
    (data) => {
      if (data.type === "http") {
        if (!data.url) return false;
        try {
          new URL(data.url);
          return true;
        } catch {
          return false;
        }
      }
      return true;
    },
    {
      message: "Valid URL is required for HTTP endpoints (e.g., https://example.com)",
      path: ["url"],
    }
  );

export type CreateServiceInput = z.infer<typeof createServiceSchema>;

export const updateServiceSchema = z.object({
  name: z.string().trim().min(1, "Name is required").optional(),
  url: z.string().optional(),
  method: httpMethodSchema.optional(),
  expected_status: z.coerce.number().min(100).max(599).optional(),
  check_interval_sec: z.coerce.number().min(10, "Interval must be at least 10 seconds").optional(),
  enabled: z.boolean().optional(),
});

export type UpdateServiceInput = z.infer<typeof updateServiceSchema>;

export const manualCheckResultSchema = z.object({
  statusCode: z.number().optional(),
  responseTimeMs: z.number().optional(),
  ok: z.boolean(),
  checkedAt: z.string().optional(),
});

export type ManualCheckResult = z.infer<typeof manualCheckResultSchema>;

export const uptimeResponseSchema = z.object({
  serviceId: z.string(),
  uptimePercentage: z.number(),
});

export type UptimeResponse = z.infer<typeof uptimeResponseSchema>;
