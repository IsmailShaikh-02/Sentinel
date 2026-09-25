import { z } from "zod";
import { checkSchema } from "@/schemas/check.schema";

export const incidentSeveritySchema = z.enum(["critical", "warning"]);
export type IncidentSeverity = z.infer<typeof incidentSeveritySchema>;

export const incidentSchema = z.object({
  id: z.string(),
  service_id: z.string(),
  service_name: z.string().nullable().optional(),
  summary: z.string(),
  severity: incidentSeveritySchema,
  started_at: z.string(),
  resolved_at: z.string().nullable(),
  duration_minutes: z.number().nullable().optional(),
});

export type Incident = z.infer<typeof incidentSchema>;

export const incidentListResponseSchema = z.object({
  incidents: z.array(incidentSchema),
  total: z.number(),
  page: z.number(),
  totalPages: z.number(),
});

export type IncidentListResponse = z.infer<typeof incidentListResponseSchema>;

export const incidentDetailSchema = incidentSchema.extend({
  checks: z.array(checkSchema).default([]),
});

export type IncidentDetail = z.infer<typeof incidentDetailSchema>;
