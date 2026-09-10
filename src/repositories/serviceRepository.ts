import { pool } from "../db/pool.js";
import { NotFoundError } from "../errors.js";

export interface ServiceRow {
  id: string;
  user_id: string;
  name: string;
  url: string;
  method: string;
  expected_status: number;
  check_interval_sec: number;
  enabled: boolean;
  created_at: Date;
}

export async function createService(
  userId: string,
  data: {
    name: string;
    url: string;
    method: string;
    expected_status: number;
    check_interval_sec: number;
    enabled: boolean;
  },
): Promise<ServiceRow> {
  const result = await pool.query<ServiceRow>(
    `INSERT INTO services (user_id, name, url, method, expected_status, check_interval_sec, enabled)
     VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
    [userId, data.name, data.url, data.method, data.expected_status, data.check_interval_sec, data.enabled],
  );
  return result.rows[0]!;
}

export async function listServices(userId: string): Promise<ServiceRow[]> {
  const result = await pool.query<ServiceRow>(
    "SELECT * FROM services WHERE user_id = $1 ORDER BY created_at DESC",
    [userId],
  );
  return result.rows;
}

export async function getServiceById(userId: string, serviceId: string): Promise<ServiceRow> {
  const result = await pool.query<ServiceRow>(
    "SELECT * FROM services WHERE id = $1 AND user_id = $2",
    [serviceId, userId],
  );
  const service = result.rows[0];
  if (!service) throw new NotFoundError("Service not found");
  return service;
}

export async function updateService(
  userId: string,
  serviceId: string,
  data: Partial<{
    name: string;
    url: string;
    method: string;
    expected_status: number;
    check_interval_sec: number;
    enabled: boolean;
  }>,
): Promise<ServiceRow> {
  const fields = Object.keys(data) as Array<keyof typeof data>;
  if (fields.length === 0) {
    return getServiceById(userId, serviceId);
  }
  const setClause = fields.map((f, i) => `${f} = $${i + 3}`).join(", ");
  const values = [serviceId, userId, ...fields.map((f) => data[f])];
  const result = await pool.query<ServiceRow>(
    `UPDATE services SET ${setClause} WHERE id = $1 AND user_id = $2 RETURNING *`,
    values,
  );
  const service = result.rows[0];
  if (!service) throw new NotFoundError("Service not found");
  return service;
}

export async function deleteService(userId: string, serviceId: string): Promise<void> {
  const result = await pool.query(
    "DELETE FROM services WHERE id = $1 AND user_id = $2",
    [serviceId, userId],
  );
  if (result.rowCount === 0) throw new NotFoundError("Service not found");
}