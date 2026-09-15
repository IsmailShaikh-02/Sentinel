import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { pool } from "../../src/db/pool.js";
import { incidentAnalyzer } from "../../src/services/incidentService.js";

describe("Incident Integration Workflow", () => {
  let testUserId: string;
  let testServiceId: string;

  beforeAll(async () => {
    // Run schema setup if needed
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        email TEXT NOT NULL UNIQUE,
        password_hash TEXT NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT now()
      );
      CREATE TABLE IF NOT EXISTS services (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        name TEXT NOT NULL,
        url TEXT NOT NULL,
        method TEXT NOT NULL DEFAULT 'GET',
        expected_status INT NOT NULL DEFAULT 200,
        check_interval_sec INT NOT NULL DEFAULT 60,
        enabled BOOLEAN NOT NULL DEFAULT true,
        created_at TIMESTAMPTZ NOT NULL DEFAULT now()
      );
      CREATE TABLE IF NOT EXISTS checks (
        id BIGSERIAL PRIMARY KEY,
        service_id UUID NOT NULL REFERENCES services(id) ON DELETE CASCADE,
        status_code INT,
        response_time_ms INT,
        ok BOOLEAN NOT NULL,
        checked_at TIMESTAMPTZ NOT NULL DEFAULT now()
      );
      CREATE TABLE IF NOT EXISTS incidents (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        service_id UUID NOT NULL REFERENCES services(id) ON DELETE CASCADE,
        started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        resolved_at TIMESTAMPTZ,
        severity TEXT NOT NULL CHECK (severity IN ('low', 'medium', 'high')),
        summary TEXT NOT NULL
      );
    `);

    // Create test user and service
    const userRes = await pool.query<{ id: string }>(
      `INSERT INTO users (email, password_hash)
       VALUES ($1, $2)
       RETURNING id`,
      [`test-incident-${Date.now()}@example.com`, "hash"],
    );
    testUserId = userRes.rows[0]!.id;

    const svcRes = await pool.query<{ id: string }>(
      `INSERT INTO services (user_id, name, url)
       VALUES ($1, $2, $3)
       RETURNING id`,
      [testUserId, "Test Service", "http://localhost:9999"],
    );
    testServiceId = svcRes.rows[0]!.id;
  });

  afterAll(async () => {
    if (testUserId) {
      await pool.query("DELETE FROM users WHERE id = $1", [testUserId]);
    }
    await pool.end();
  });

  it("detects incident from 3 real failures", async () => {
    // Insert 3 failures
    for (let i = 0; i < 3; i++) {
      await pool.query(
        "INSERT INTO checks (service_id, status_code, response_time_ms, ok) VALUES ($1, $2, $3, $4)",
        [testServiceId, 500, 100, false],
      );
    }

    const decision = await incidentAnalyzer.analyzeForIncidents(testServiceId);
    expect(decision.action).toBe("open");

    const incidentsRes = await pool.query<{ id: string; resolved_at: Date | null }>(
      "SELECT id, resolved_at FROM incidents WHERE service_id = $1",
      [testServiceId],
    );
    expect(incidentsRes.rows.length).toBe(1);
    expect(incidentsRes.rows[0]?.resolved_at).toBeNull();
  });

  it("does not race-duplicate on concurrent checks", async () => {
    // Create another service for concurrency test
    const svcRes = await pool.query<{ id: string }>(
      `INSERT INTO services (user_id, name, url)
       VALUES ($1, $2, $3)
       RETURNING id`,
      [testUserId, "Concurrent Service", "http://localhost:9999"],
    );
    const concurrentServiceId = svcRes.rows[0]!.id;

    // Insert 3 failures
    for (let i = 0; i < 3; i++) {
      await pool.query(
        "INSERT INTO checks (service_id, status_code, response_time_ms, ok) VALUES ($1, $2, $3, $4)",
        [concurrentServiceId, 500, 100, false],
      );
    }

    // Call analyzeForIncidents concurrently
    const results = await Promise.all([
      incidentAnalyzer.analyzeForIncidents(concurrentServiceId),
      incidentAnalyzer.analyzeForIncidents(concurrentServiceId),
    ]);

    const openCount = results.filter((r) => r.action === "open").length;
    expect(openCount).toBe(1);

    const incidentsRes = await pool.query(
      "SELECT id FROM incidents WHERE service_id = $1 AND resolved_at IS NULL",
      [concurrentServiceId],
    );
    expect(incidentsRes.rows.length).toBe(1);
  });
});
