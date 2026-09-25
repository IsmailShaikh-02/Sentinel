import { apiClient, type Result } from "@/api/client";
import {
  alertChannelSchema,
  type AlertChannel,
  type CreateChannelInput,
} from "@/schemas/channel.schema";
import { z } from "zod";

export const channelsApi = {
  async getChannels(): Promise<Result<AlertChannel[]>> {
    return apiClient<AlertChannel[]>("/api/channels", {
      method: "GET",
      schema: z.array(alertChannelSchema),
    });
  },

  async createChannel(input: CreateChannelInput): Promise<Result<AlertChannel>> {
    return apiClient<AlertChannel>("/api/channels", {
      method: "POST",
      body: { type: "email", config: { email: input.email }, email: input.email },
      schema: alertChannelSchema,
    });
  },

  async testChannel(id: string): Promise<Result<{ ok: boolean; message: string }>> {
    return apiClient<{ ok: boolean; message: string }>(`/api/channels/${id}/test`, {
      method: "POST",
    });
  },

  async deleteChannel(id: string): Promise<Result<{ success: boolean }>> {
    return apiClient<{ success: boolean }>(`/api/channels/${id}`, {
      method: "DELETE",
    });
  },
};
