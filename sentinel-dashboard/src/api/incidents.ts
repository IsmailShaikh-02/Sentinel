import { apiClient, type Result } from "@/api/client";
import {
  incidentSchema,
  incidentListResponseSchema,
  incidentDetailSchema,
  type Incident,
  type IncidentListResponse,
  type IncidentDetail,
} from "@/schemas/incident.schema";
import { z } from "zod";

export interface GetIncidentsParams {
  status?: string;
  severity?: string;
  page?: number;
  limit?: number;
}

export const incidentsApi = {
  async getIncidents(params: GetIncidentsParams = {}): Promise<Result<IncidentListResponse>> {
    const searchParams = new URLSearchParams();

    if (params.status && params.status !== "all") {
      searchParams.set("status", params.status);
    }
    if (params.severity && params.severity !== "all") {
      searchParams.set("severity", params.severity);
    }
    if (params.page !== undefined) {
      searchParams.set("page", params.page.toString());
    }
    if (params.limit !== undefined) {
      searchParams.set("limit", params.limit.toString());
    }

    const queryString = searchParams.toString();
    const endpoint = `/api/incidents${queryString ? `?${queryString}` : ""}`;

    return apiClient<IncidentListResponse>(endpoint, {
      method: "GET",
      schema: incidentListResponseSchema,
    });
  },

  async getIncidentById(id: string): Promise<Result<IncidentDetail>> {
    return apiClient<IncidentDetail>(`/api/incidents/${id}`, {
      method: "GET",
      schema: incidentDetailSchema,
    });
  },

  async getServiceIncidents(serviceId: string): Promise<Result<Incident[]>> {
    return apiClient<Incident[]>(`/api/services/${serviceId}/incidents`, {
      method: "GET",
      schema: z.array(incidentSchema),
    });
  },
};
