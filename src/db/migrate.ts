import { pool } from "./pool.js";

async function migrate(): Promise<void> {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      email         TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
    );

    CREATE TABLE IF NOT EXISTS services (
      id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id            UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      name               TEXT NOT NULL,
      url                TEXT NOT NULL,
      method             TEXT NOT NULL DEFAULT 'GET',
      expected_status    INT  NOT NULL DEFAULT 200,
      check_interval_sec INT  NOT NULL DEFAULT 60,
      enabled            BOOLEAN NOT NULL DEFAULT true,
      created_at         TIMESTAMPTZ NOT NULL DEFAULT now()
    );
    CREATE INDEX IF NOT EXISTS idx_services_user ON services(user_id);

    CREATE TABLE IF NOT EXISTS checks (
      id               BIGSERIAL PRIMARY KEY,
      service_id       UUID NOT NULL REFERENCES services(id) ON DELETE CASCADE,
      status_code      INT,
      response_time_ms INT,
      ok               BOOLEAN NOT NULL,
      checked_at       TIMESTAMPTZ NOT NULL DEFAULT now()
    );
    CREATE INDEX IF NOT EXISTS idx_checks_service_time
      ON checks (service_id, checked_at DESC);

    CREATE TABLE IF NOT EXISTS incidents (
      id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      service_id  UUID NOT NULL REFERENCES services(id) ON DELETE CASCADE,
      started_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
      resolved_at TIMESTAMPTZ,
      severity    TEXT NOT NULL CHECK (severity IN ('low', 'medium', 'high')),
      summary     TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_incidents_service_active ON incidents(service_id) WHERE resolved_at IS NULL;

    CREATE TABLE IF NOT EXISTS channels (
      id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      type       TEXT NOT NULL CHECK (type IN ('telegram', 'slack', 'email')),
      config     JSONB NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );

    CREATE TABLE IF NOT EXISTS alerts_sent (
      id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      incident_id UUID NOT NULL REFERENCES incidents(id) ON DELETE CASCADE,
      channel_id  UUID NOT NULL REFERENCES channels(id) ON DELETE CASCADE,
      sent_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
      UNIQUE(incident_id, channel_id)
    );
  `);
  console.log("Migration complete");
}

migrate()
  .then(() => pool.end())
  .catch((err) => {
    console.error("Migration failed:", err);
    process.exit(1);
  });