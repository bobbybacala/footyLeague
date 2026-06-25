import type { AppRole } from "@/types";

const TOKEN_KEY = "footy_app_token";
const ROLE_KEY = "footy_app_role";

export function getStoredToken(): string | null {
  return sessionStorage.getItem(TOKEN_KEY);
}

export function getStoredRole(): AppRole | null {
  const role = sessionStorage.getItem(ROLE_KEY);
  if (role === "editor" || role === "viewer") return role;
  return null;
}

export function persistAuth(role: AppRole, token: string) {
  sessionStorage.setItem(TOKEN_KEY, token);
  sessionStorage.setItem(ROLE_KEY, role);
}

export function clearPersistedAuth() {
  sessionStorage.removeItem(TOKEN_KEY);
  sessionStorage.removeItem(ROLE_KEY);
}
