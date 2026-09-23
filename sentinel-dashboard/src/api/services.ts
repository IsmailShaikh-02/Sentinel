import { apiClient, type Result } from "@/api/client";
import {
  type Service,
  serviceSchema,
  type CreateServiceInput,
  type UpdateServiceInput,
  type ManualCheckResult,
  manualCheckResultSchema,
} from "@/schemas/service.schema";
import { z } from "zod";

export const servicesApi = {
  async getServices(): Promise<Result<Service[]>> {
    return apiClient<Service[]>("/api/services", {
      method: "GET",
      schema: z.array(serviceSchema),
    });
  },

  async getServiceById(id: string): Promise<Result<Service>> {
    return apiClient<Service>(`/api/services/${id}`, {
      method: "GET",
      schema: serviceSchema,
    });
  },

  async createService(input: CreateServiceInput): Promise<Result<Service>> {
    return apiClient<Service>("/api/services", {
      method: "POST",
      body: input,
      schema: serviceSchema,
    });
  },

  async updateService(id: string, input: UpdateServiceInput): Promise<Result<Service>> {
    return apiClient<Service>(`/api/services/${id}`, {
      method: "PATCH",
      body: input,
      schema: serviceSchema,
    });
  },

  async deleteService(id: string): Promise<Result<{ success: boolean }>> {
    return apiClient<{ success: boolean }>(`/api/services/${id}`, {
      method: "DELETE",
    });
  },

  async triggerManualCheck(id: string): Promise<Result<ManualCheckResult>> {
    return apiClient<ManualCheckResult>(`/api/services/${id}/check`, {
      method: "POST",
      schema: manualCheckResultSchema,
    });
  },
};
