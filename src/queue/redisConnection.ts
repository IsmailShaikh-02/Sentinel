import { ConnectionOptions } from "bullmq";
import { env } from "../env.js";

export const redisConnection: ConnectionOptions = {
  url: env.REDIS_URL,
  tls: env.REDIS_URL.startsWith("rediss://") ? {} : undefined,
  maxRetriesPerRequest: null,
};