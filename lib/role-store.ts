import { type Role, ROLE_PERMISSIONS, type RolePermissions } from "./roles";

const STORAGE_KEY = "promogest_role";
const DEFAULT_ROLE: Role = "ADMIN";

/** Read the active role from localStorage (falls back to ADMIN). */
export function getCurrentRole(): Role {
  if (typeof window === "undefined") return DEFAULT_ROLE;
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) return saved as Role;
  } catch {}
  return DEFAULT_ROLE;
}

/** Persist the chosen role to localStorage. */
export function setCurrentRole(role: Role): void {
  try {
    localStorage.setItem(STORAGE_KEY, role);
  } catch {}
}

/** Convenience — returns the permission set for the current role. */
export function getCurrentPermissions(): RolePermissions {
  return ROLE_PERMISSIONS[getCurrentRole()];
}
