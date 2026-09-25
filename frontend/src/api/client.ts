import { z } from "zod";
import { env } from "@/env";
import { useAuthStore } from "@/store/auth.store";

export type Result<T> =
  | { ok: true; data: T }
  | { ok: false; error: string };

export interface ApiClientOptions extends Omit<RequestInit, "body"> {
  body?: unknown;
  schema?: z.ZodSchema<any>;
}

export async function apiClient<T>(
  endpoint: string,
  options: ApiClientOptions = {}
): Promise<Result<T>> {
  const { body, headers: customHeaders, schema, ...customOptions } = options;

  const token = useAuthStore.getState().token;

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(customHeaders as Record<string, string>),
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const url = endpoint.startsWith("http")
    ? endpoint
    : `${env.VITE_API_URL}${endpoint.startsWith("/") ? endpoint : `/${endpoint}`}`;

  try {
    const response = await fetch(url, {
      ...customOptions,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });

    if (response.status === 401) {
      useAuthStore.getState().logout();
      return { ok: false, error: "Unauthorized session. Please log in again." };
    }

    const text = await response.text();
    let json: unknown;
    try {
      json = text ? JSON.parse(text) : {};
    } catch {
      json = { message: text };
    }

    if (!response.ok) {
      const errorMessage =
        (json as { error?: string; message?: string })?.error ||
        (json as { message?: string })?.message ||
        `Request failed with status ${response.status}`;
      return { ok: false, error: errorMessage };
    }

    if (schema) {
      const parsed = schema.safeParse(json);
      if (!parsed.success) {
        console.error("Zod API response schema error:", parsed.error);
        return { ok: false, error: "Invalid server response structure." };
      }
      return { ok: true, data: parsed.data as T };
    }

    return { ok: true, data: json as T };
  } catch (err: unknown) {
    const errorMsg =
      err instanceof Error ? err.message : "Network error occurred";
    return { ok: false, error: errorMsg };
  }
}
