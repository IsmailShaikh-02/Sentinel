import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { channelsApi } from "@/api/channels";
import type { AlertChannel, CreateChannelInput } from "@/schemas/channel.schema";
import { toast } from "sonner";

export const CHANNELS_QUERY_KEY = ["channels"] as const;

export function useAlertChannels() {
  const queryClient = useQueryClient();

  const query = useQuery<AlertChannel[], Error>({
    queryKey: CHANNELS_QUERY_KEY,
    queryFn: async () => {
      const result = await channelsApi.getChannels();
      if (!result.ok) {
        throw new Error(result.error);
      }
      return result.data;
    },
    staleTime: 30000,
  });

  const createMutation = useMutation({
    mutationFn: async (input: CreateChannelInput) => {
      const result = await channelsApi.createChannel(input);
      if (!result.ok) {
        throw new Error(result.error);
      }
      return result.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: CHANNELS_QUERY_KEY });
      toast.success(`Alert recipient ${data.config.email} added successfully`);
    },
    onError: (err: Error) => {
      toast.error(err.message || "Failed to add alert recipient");
    },
  });

  const testMutation = useMutation({
    mutationFn: async (id: string) => {
      const result = await channelsApi.testChannel(id);
      if (!result.ok) {
        throw new Error(result.error);
      }
      return result.data;
    },
    onSuccess: (data) => {
      toast.success(data.message || "Test email dispatched via Brevo");
    },
    onError: (err: Error) => {
      toast.error(err.message || "Failed to dispatch Brevo test email");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const result = await channelsApi.deleteChannel(id);
      if (!result.ok) {
        throw new Error(result.error);
      }
      return id;
    },
    // Optimistic Update
    onMutate: async (id: string) => {
      await queryClient.cancelQueries({ queryKey: CHANNELS_QUERY_KEY });
      const previousChannels = queryClient.getQueryData<AlertChannel[]>(CHANNELS_QUERY_KEY);

      if (previousChannels) {
        queryClient.setQueryData<AlertChannel[]>(
          CHANNELS_QUERY_KEY,
          previousChannels.filter((ch) => ch.id !== id)
        );
      }

      return { previousChannels };
    },
    onError: (err: Error, _id, context) => {
      if (context?.previousChannels) {
        queryClient.setQueryData(CHANNELS_QUERY_KEY, context.previousChannels);
      }
      toast.error(err.message || "Failed to remove alert recipient");
    },
    onSuccess: () => {
      toast.success("Alert recipient removed successfully");
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: CHANNELS_QUERY_KEY });
    },
  });

  return {
    ...query,
    channels: query.data || [],
    createChannel: createMutation.mutateAsync,
    isCreating: createMutation.isPending,
    testChannel: testMutation.mutateAsync,
    isTesting: testMutation.isPending,
    testingId: testMutation.variables,
    deleteChannel: deleteMutation.mutateAsync,
    isDeleting: deleteMutation.isPending,
  };
}
