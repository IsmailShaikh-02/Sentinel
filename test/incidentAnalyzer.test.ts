import { describe, it, expect, vi, beforeEach } from "vitest";
import { incidentAnalyzer } from "../src/services/incidentService.js";
import { pool } from "../src/db/pool.js";

describe("IncidentAnalyzer", () => {
  let mockClient: {
    query: ReturnType<typeof vi.fn>;
    release: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    mockClient = {
      query: vi.fn(),
      release: vi.fn(),
    };
    vi.spyOn(pool, "connect").mockResolvedValue(mockClient as any);
  });

  it("opens incident after 3 consecutive failures", async () => {
    mockClient.query.mockImplementation(async (sql: string) => {
      if (sql.includes("SELECT ok, status_code")) {
        return {
          rows: [
            { ok: false, status_code: 500, checked_at: new Date() },
            { ok: false, status_code: 500, checked_at: new Date() },
            { ok: false, status_code: 500, checked_at: new Date() },
            { ok: true, status_code: 200, checked_at: new Date() },
            { ok: true, status_code: 200, checked_at: new Date() },
          ],
        };
      }
      if (sql.includes("FROM incidents WHERE service_id")) {
        return { rows: [] };
      }
      if (sql.includes("INSERT INTO incidents")) {
        return { rows: [{ id: "inc-1" }] };
      }
      return { rows: [] };
    });

    const decision = await incidentAnalyzer.analyzeForIncidents("mock-service-id");
    expect(decision.action).toBe("open");
    expect(decision.severity).toBe("low");
    expect(decision.incidentId).toBe("inc-1");
  });

  it("does not open if incident already exists", async () => {
    mockClient.query.mockImplementation(async (sql: string) => {
      if (sql.includes("SELECT ok, status_code")) {
        return {
          rows: [
            { ok: false, status_code: 500, checked_at: new Date() },
            { ok: false, status_code: 500, checked_at: new Date() },
            { ok: false, status_code: 500, checked_at: new Date() },
            { ok: true, status_code: 200, checked_at: new Date() },
            { ok: true, status_code: 200, checked_at: new Date() },
          ],
        };
      }
      if (sql.includes("FROM incidents WHERE service_id")) {
        return { rows: [{ id: "existing-inc", severity: "low" }] };
      }
      return { rows: [] };
    });

    const decision = await incidentAnalyzer.analyzeForIncidents("mock-service-id");
    expect(decision.action).toBe("none");
  });

  it("closes incident after 2 consecutive successes", async () => {
    mockClient.query.mockImplementation(async (sql: string) => {
      if (sql.includes("SELECT ok, status_code")) {
        return {
          rows: [
            { ok: true, status_code: 200, checked_at: new Date() },
            { ok: true, status_code: 200, checked_at: new Date() },
            { ok: false, status_code: 500, checked_at: new Date() },
            { ok: false, status_code: 500, checked_at: new Date() },
            { ok: false, status_code: 500, checked_at: new Date() },
          ],
        };
      }
      if (sql.includes("FROM incidents WHERE service_id")) {
        return { rows: [{ id: "existing-inc", severity: "low" }] };
      }
      return { rows: [] };
    });

    const decision = await incidentAnalyzer.analyzeForIncidents("mock-service-id");
    expect(decision.action).toBe("close");
    expect(decision.incidentId).toBe("existing-inc");
  });

  it("ignores alternating pattern", async () => {
    mockClient.query.mockImplementation(async (sql: string) => {
      if (sql.includes("SELECT ok, status_code")) {
        return {
          rows: [
            { ok: false, status_code: 500, checked_at: new Date() },
            { ok: true, status_code: 200, checked_at: new Date() },
            { ok: false, status_code: 500, checked_at: new Date() },
            { ok: true, status_code: 200, checked_at: new Date() },
            { ok: false, status_code: 500, checked_at: new Date() },
          ],
        };
      }
      if (sql.includes("FROM incidents WHERE service_id")) {
        return { rows: [] };
      }
      return { rows: [] };
    });

    const decision = await incidentAnalyzer.analyzeForIncidents("mock-service-id");
    expect(decision.action).toBe("none");
  });
});
