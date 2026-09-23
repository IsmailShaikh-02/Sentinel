import { z } from "zod";

export const alertChannelConfigSchema = z.object({
  email: z.string().trim().email("Must provide a valid email address"),
});

export const alertChannelSchema = z.object({
  id: z.string(),
  type: z.literal("email").default("email"),
  config: alertChannelConfigSchema,
  enabled: z.boolean().default(true),
  created_at: z.string().optional(),
});

export type AlertChannel = z.infer<typeof alertChannelSchema>;

export const createChannelSchema = z.object({
  type: z.literal("email").default("email"),
  email: z.string().trim().email("Must provide a valid email address"),
});

export type CreateChannelInput = z.infer<typeof createChannelSchema>;

export const alertHistoryItemSchema = z.object({
  id: z.string(),
  incident_id: z.string(),
  channel_id: z.string().optional().nullable(),
  recipient: z.string(),
  alert_type: z.enum(["OPEN", "RESOLVE"]),
  sent_at: z.string(),
  status: z.enum(["sent", "failed"]).default("sent"),
});

export type AlertHistoryItem = z.infer<typeof alertHistoryItemSchema>;

export const alertHistoryResponseSchema = z.object({
  alerts: z.array(alertHistoryItemSchema),
  total: z.number(),
  page: z.number().optional().default(1),
  totalPages: z.number().optional().default(1),
});

export type AlertHistoryResponse = z.infer<typeof alertHistoryResponseSchema>;
