import { create } from "zustand";
import type { User } from "@/schemas/auth.schema";

interface AuthState {
  token: string | null;
  user: User | null;
  isAuthenticated: boolean;
  setAuth: (token: string, user: User) => void;
  logout: () => void;
}

const getInitialToken = (): string | null => {
  try {
    return localStorage.getItem("sentinel_token");
  } catch {
    return null;
  }
};

const getInitialUser = (): User | null => {
  try {
    const storedUser = localStorage.getItem("sentinel_user");
    return storedUser ? JSON.parse(storedUser) : null;
  } catch {
    return null;
  }
};

const initialToken = getInitialToken();
const initialUser = getInitialUser();

export const useAuthStore = create<AuthState>((set) => ({
  token: initialToken,
  user: initialUser,
  isAuthenticated: Boolean(initialToken && initialUser),

  setAuth: (token: string, user: User) => {
    try {
      localStorage.setItem("sentinel_token", token);
      localStorage.setItem("sentinel_user", JSON.stringify(user));
    } catch (e) {
      console.error("Failed to persist auth to localStorage", e);
    }
    set({ token, user, isAuthenticated: true });
  },

  logout: () => {
    try {
      localStorage.removeItem("sentinel_token");
      localStorage.removeItem("sentinel_user");
    } catch (e) {
      console.error("Failed to remove auth from localStorage", e);
    }
    set({ token: null, user: null, isAuthenticated: false });
  },
}));
