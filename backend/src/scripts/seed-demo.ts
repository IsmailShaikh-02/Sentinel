// src/scripts/seed-demo.ts
import bcrypt from 'bcrypt';
import { pool } from '../db/pool.js';
import { SchedulerService } from '../modules/scheduler/scheduler.service.js';

async function seedDemoAccount() {
  const email = 'demo@sentinel.dev';
  const plainPassword = 'DemoUser123!';
  const hashedPassword = await bcrypt.hash(plainPassword, 12);

  // 1. Create or retrieve demo user
  const userResult = await pool.query<{ id: string }>(
    `INSERT INTO users (email, password_hash, is_demo)
     VALUES ($1, $2, true)
     ON CONFLICT (email) DO UPDATE SET is_demo = true
     RETURNING id`,
    [email, hashedPassword]
  );
  const userId = userResult.rows[0].id;

  // 2. Preset baseline services
  const targets = [
    { name: 'Cloudflare DNS', type: 'http', url: 'https://1.1.1.1', interval: 30, expected: 200 },
    { name: 'Flaky Simulator', type: 'http', url: 'https://httpbin.org/status/500', interval: 30, expected: 200 },
    { name: 'High Latency API', type: 'http', url: 'https://httpbin.org/delay/2', interval: 30, expected: 200 },
    // { name: 'Nightly Backup Cron', type: 'heartbeat', url: null, interval: 60, expected: 200 },
  ];

  for (const t of targets) {
    const sResult = await pool.query<{ id: string; check_interval_sec: number; type: string }>(
      `INSERT INTO services (user_id, name, type, url, check_interval_sec, expected_status, enabled)
       VALUES ($1, $2, $3, $4, $5, $6, true)
       ON CONFLICT DO NOTHING
       RETURNING id, check_interval_sec, type`,
      [userId, t.name, t.type, t.url, t.interval, t.expected]
    );

    if (sResult.rows[0] && sResult.rows[0].type === 'http') {
      await SchedulerService.scheduleService(sResult.rows[0].id, sResult.rows[0].check_interval_sec);
    }
  }

  console.log(`✅ Demo user ready: ${email} (${userId})`);
  process.exit(0);
}

seedDemoAccount().catch(console.error);