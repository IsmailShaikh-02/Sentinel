// src/modules/auth/auth.service.ts
import bcrypt from 'bcrypt';
import { pool } from '../../db/pool.js';
import { ConflictError, UnauthorizedError } from '../../errors/http.error.js';
import { signToken } from '../../utils/jwt.js';
import type { RegisterInput, LoginInput } from './auth.schema.js';

interface AuthResponse {
  token: string;
  user: {
    id: string;
    email: string;
    isDemo: boolean;
  };
}

interface UserRow {
  id: string;
  email: string;
  password_hash: string;
  is_demo: boolean;
}

export class AuthService {
  static async register(input: RegisterInput): Promise<AuthResponse> {
    const { email, password } = input;

    // 1. Check if user already exists
    const existing = await pool.query(
      `SELECT id FROM users WHERE email = $1`,
      [email]
    );

    if (existing.rowCount && existing.rowCount > 0) {
      throw new ConflictError('User with this email already exists');
    }

    // 2. Hash password (cost >= 12)
    const passwordHash = await bcrypt.hash(password, 12);

    // 3. Insert and return new user using raw SQL
    const result = await pool.query<{ id: string; email: string; is_demo: boolean }>(
      `INSERT INTO users (email, password_hash)
       VALUES ($1, $2)
       RETURNING id, email, is_demo`,
      [email, passwordHash]
    );

    const user = result.rows[0];
    const token = signToken(user.id, user.is_demo);

    return { token, user: {
        id: user.id,
        email: user.email,
        isDemo: user.is_demo,
      }, };
  }

  static async login(input: LoginInput): Promise<AuthResponse> {
    const { email, password } = input;

    // 1. Fetch user by email in a single query
    const result = await pool.query<UserRow>(
      `SELECT id, email, password_hash, is_demo FROM users WHERE email = $1`,
      [email]
    );

    if (!result.rowCount || result.rowCount === 0) {
      throw new UnauthorizedError('Invalid email or password');
    }

    const user = result.rows[0];

    // 2. Verify plain password against stored hash directly
    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      throw new UnauthorizedError('Invalid email or password');
    }

    // 3. Issue access token
    const token = signToken(user.id, user.is_demo);

    return {
      token,
      user: {
        id: user.id,
        email: user.email,
        isDemo: user.is_demo,
      },
    };
  }
}