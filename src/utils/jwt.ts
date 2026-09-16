// src/utils/jwt.ts
import jwt from 'jsonwebtoken';
import { env } from '../env.js';

interface TokenPayload {
  sub: string;
}

export const signToken = (userId: string): string => {
  return jwt.sign({ sub: userId }, env.JWT_SECRET, {
    expiresIn: '15m',
  });
};

export const verifyToken = (token: string): TokenPayload => {
  return jwt.verify(token, env.JWT_SECRET) as TokenPayload;
};