// src/queue/types.ts
export interface CheckJobData {
  serviceId: string;
  /** optional: set by the scheduler when triggered outside polling */
  trigger?: "schedule" | "manual";
}