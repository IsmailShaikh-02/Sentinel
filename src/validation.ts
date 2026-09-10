import { z } from "zod";

export const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

export const loginSchema = registerSchema;

export const createServiceSchema = z.object({
  name: z.string().min(1).max(100),
  url: z.string().url(),
  method: z.enum(["GET", "HEAD", "POST"]).default("GET"),
  expected_status: z.number().int().min(100).max(599).default(200),
  check_interval_sec: z.number().int().min(10).max(86400).default(60),
  enabled: z.boolean().default(true),
});

export const updateServiceSchema = createServiceSchema.partial();

export const uuidParamSchema = z.object({ id: z.string().uuid() });