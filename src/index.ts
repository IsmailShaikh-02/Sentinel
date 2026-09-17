// src/index.ts
import app from './app.js';
import { env } from './env.js';
import { SchedulerService } from './modules/scheduler/scheduler.service.js';

app.listen(env.PORT, async () => {
  console.log(`🚀 Sentinel API server running on port ${env.PORT} in ${env.NODE_ENV} mode`);
  try {
    await SchedulerService.syncAllServices();
  } catch (err) {
    console.error('Failed to sync scheduler on startup:', err);
  }
});