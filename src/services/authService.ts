import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { env } from "../env.js";
import { ConflictError, UnauthorizedError } from "../errors.js";
import { pool } from "../db/pool.js";

interface UserRow {
  id: string;
  email: string;
  password_hash: string;
}

function signToken(userId: string): string {
  return jwt.sign({ sub: userId }, env.JWT_SECRET, { expiresIn: "15m" });
}

export async function register(email: string, password: string): Promise<{ token: string }> {
  const existing = await pool.query<UserRow>(
    "SELECT id, email, password_hash FROM users WHERE email = $1",
    [email],
  );
  if (existing.rows.length > 0) {
    throw new ConflictError("Email already registered");
  }

  const passwordHash = await bcrypt.hash(password, env.BCRYPT_COST);
  const inserted = await pool.query<UserRow>(
    "INSERT INTO users (email, password_hash) VALUES ($1, $2) RETURNING id, email, password_hash",
    [email, passwordHash],
  );
  return { token: signToken(inserted.rows[0]!.id) };
}

export async function login(email: string, password: string): Promise<{ token: string }> {
  const result = await pool.query<UserRow>(
    "SELECT id, email, password_hash FROM users WHERE email = $1",
    [email],
  );
  const user = result.rows[0];
  if (!user || !(await bcrypt.compare(password, user.password_hash))) {
    // Same message for unknown email and wrong password — don't leak which accounts exist
    throw new UnauthorizedError("Invalid credentials");
  }
  return { token: signToken(user.id) };
}