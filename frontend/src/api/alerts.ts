import { apiClient, type Result } from "@/api/client";
import {
  alertHistoryResponseSchema,
  type AlertHistoryResponse,
} from "@/schemas/channel.schema";

export const alertsApi = {
  async getAlertHistory(page: number = 1, limit: number = 20): Promise<Result<AlertHistoryResponse>> {
    return apiClient<AlertHistoryResponse>(`/api/alerts/history?page=${page}&limit=${limit}`, {
      method: "GET",
      schema: alertHistoryResponseSchema,
    });
  },
};
