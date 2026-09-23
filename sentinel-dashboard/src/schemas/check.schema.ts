import { z } from "zod";

export const checkSchema = z.object({
  id: z.string(),
  service_id: z.string(),
  status_code: z.number().nullable(),
  response_time_ms: z.number().nullable().optional(),
  ok: z.boolean(),
  checked_at: z.string(),
});

export type Check = z.infer<typeof checkSchema>;
