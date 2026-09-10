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
  `);
  console.log("Migration complete");
}

migrate()
  .then(() => pool.end())
  .catch((err) => {
    console.error("Migration failed:", err);
    process.exit(1);
  });