// src/db/migrate.ts
import { pool } from './pool.js';

async function migrate() {
  const client = await pool.connect();
  try {
    console.log('🔄 Running database migrations...');

    await client.query('BEGIN');

    // 1. Enable pgcrypto for gen_random_uuid()
    await client.query(`CREATE EXTENSION IF NOT EXISTS "pgcrypto";`);

    // 2. Users table
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        email TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);

    // 3. Services table
    await client.query(`
      CREATE TABLE IF NOT EXISTS services (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        name TEXT NOT NULL,
        url TEXT NOT NULL,
        method TEXT NOT NULL DEFAULT 'GET',
        expected_status INT NOT NULL DEFAULT 200,
        check_interval_sec INT NOT NULL DEFAULT 60,
        enabled BOOLEAN NOT NULL DEFAULT true,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);

    // 4. Checks table (append-only facts)
    await client.query(`
      CREATE TABLE IF NOT EXISTS checks (
        id BIGSERIAL PRIMARY KEY,
        service_id UUID NOT NULL REFERENCES services(id) ON DELETE CASCADE,
        status_code INT,
        response_time_ms INT,
        ok BOOLEAN NOT NULL,
        checked_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);

    // 5. Index on checks
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_checks_service_time 
      ON checks (service_id, checked_at DESC);
    `);

    // 6. Incidents table
    await client.query(`
      CREATE TABLE IF NOT EXISTS incidents (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        service_id UUID NOT NULL REFERENCES services(id) ON DELETE CASCADE,
        summary TEXT NOT NULL,
        severity TEXT NOT NULL DEFAULT 'critical',
        started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        resolved_at TIMESTAMPTZ,
        checks_triggered_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);

    // Ensure the column exists if the table was created earlier without it
    await client.query(`
      ALTER TABLE incidents 
      ADD COLUMN IF NOT EXISTS checks_triggered_at TIMESTAMPTZ NOT NULL DEFAULT NOW();
    `);

    // Indexes for incidents
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_incidents_active 
      ON incidents (service_id) 
      WHERE resolved_at IS NULL;
    `);

    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_incidents_timeline 
      ON incidents (started_at DESC, severity);
    `);

    // Drop old constraint first so we can normalize existing data
    await client.query(`
      ALTER TABLE incidents 
      DROP CONSTRAINT IF EXISTS incidents_severity_check;
    `);

    // Normalize any dirty existing rows to lowercase 'critical'
    await client.query(`
      UPDATE incidents 
      SET severity = 'critical' 
      WHERE severity NOT IN ('critical', 'warning') OR severity IS NULL;
    `);

    // Now safely attach the constraint
    await client.query(`
      ALTER TABLE incidents 
      ADD CONSTRAINT incidents_severity_check 
      CHECK (severity IN ('critical', 'warning'));
    `);

    await client.query('COMMIT');
    console.log('✅ Migrations applied successfully!');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('❌ Migration failed:', err);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

migrate();