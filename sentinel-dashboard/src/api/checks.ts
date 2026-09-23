import { apiClient, type Result } from "@/api/client";
import { checkSchema, type Check } from "@/schemas/check.schema";
import { z } from "zod";

export const checksApi = {
  async getRecentChecks(serviceId: string, limit: number = 10): Promise<Result<Check[]>> {
    return apiClient<Check[]>(`/api/services/${serviceId}/checks?limit=${limit}`, {
      method: "GET",
      schema: z.array(checkSchema),
    });
  },
};
