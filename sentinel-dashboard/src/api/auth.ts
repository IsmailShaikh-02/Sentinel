import { apiClient, type Result } from "@/api/client";
import {
  type AuthResponse,
  authResponseSchema,
  type LoginInput,
  type RegisterInput,
} from "@/schemas/auth.schema";

export const authApi = {
  async login(credentials: LoginInput): Promise<Result<AuthResponse>> {
    return apiClient<AuthResponse>("/api/auth/login", {
      method: "POST",
      body: {
        email: credentials.email,
        password: credentials.password,
      },
      schema: authResponseSchema,
    });
  },

  async register(credentials: RegisterInput): Promise<Result<AuthResponse>> {
    return apiClient<AuthResponse>("/api/auth/register", {
      method: "POST",
      body: {
        email: credentials.email,
        password: credentials.password,
      },
      schema: authResponseSchema,
    });
  },
};
