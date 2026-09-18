import { healthCheckQueue } from '../modules/scheduler/queue.js';
import { redisConnection } from '../lib/redis.js';

async function cleanRedis() {
  try {
    console.log('🧹 Purging BullMQ schedulers and jobs from Redis...');

    // 1. Remove all BullMQ v5 Job Schedulers
    const schedulers = await healthCheckQueue.getJobSchedulers();
    for (const scheduler of schedulers) {
      if (scheduler.id) {
        await healthCheckQueue.removeJobScheduler(scheduler.id);
        console.log(`🛑 Removed scheduler: ${scheduler.id}`);
      }
    }

    // 2. Obliterate pending, active, and delayed jobs in the queue
    await healthCheckQueue.obliterate({ force: true });
    console.log('💥 Obliterated all pending, active, and delayed jobs in queue');

    // 3. Clear any orphaned BullMQ queue keys directly in Redis
    const streamKeys = await redisConnection.keys('bull:service-health-checks:*');
    if (streamKeys.length > 0) {
      await redisConnection.del(...streamKeys);
      console.log(`🧼 Deleted ${streamKeys.length} lingering Redis keys`);
    }

    console.log('✅ Redis queue is completely spotless!');
  } catch (error) {
    console.error('❌ Failed to clean Redis:', error);
    process.exit(1);
  } finally {
    await healthCheckQueue.close();
    await redisConnection.quit();
    process.exit(0);
  }
}

cleanRedis();