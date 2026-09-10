// Role definitions, screen access rules, and action permissions.

export const ROLES = {
  ADMIN:          "ADMIN",
  COMMERCIAL:     "COMMERCIAL",
  ADV:            "ADV",
  COMMERCIAL_ADV: "COMMERCIAL_ADV",
} as const;

export type Role = keyof typeof ROLES;

export const ROLE_LABELS: Record<Role, { name: string; short: string; color: string; bg: string }> = {
  ADMIN:          { name: "Administrateur",    short: "Admin",      color: "#8b5cf6", bg: "#f5f3ff" },
  COMMERCIAL:     { name: "Commercial",        short: "Commercial", color: "#3b82f6", bg: "#eff6ff" },
  ADV:            { name: "ADV",               short: "ADV",        color: "#10b981", bg: "#ecfdf5" },
  COMMERCIAL_ADV: { name: "Commercial + ADV",  short: "Com.+ADV",   color: "#f59e0b", bg: "#fffbeb" },
};

/**
 * Top-level route prefixes each role may visit.
 * A route is allowed if the pathname starts with (or equals) any prefix in this list.
 */
export const ROLE_ALLOWED_ROUTES: Record<Role, string[]> = {
  ADMIN:          ["/dashboard", "/projets", "/clients", "/reservations", "/pipeline", "/notaire", "/taches", "/parametres", "/exceptions"],
  COMMERCIAL:     ["/dashboard", "/projets", "/clients",                  "/pipeline",             "/taches", "/parametres", "/exceptions"],
  ADV:            ["/dashboard", "/projets",              "/reservations",             "/notaire",  "/taches", "/parametres", "/exceptions"],
  COMMERCIAL_ADV: ["/dashboard", "/projets", "/clients", "/reservations", "/pipeline", "/notaire",  "/taches", "/parametres", "/exceptions"],
};

/** Fine-grained action permissions per role. */
export interface RolePermissions {
  canCreateProject: boolean;
  canEditProject:   boolean;
  canCreateUnite:   boolean;
  canEditUnite:     boolean;
}

export const ROLE_PERMISSIONS: Record<Role, RolePermissions> = {
  ADMIN:          { canCreateProject: true,  canEditProject: true,  canCreateUnite: true,  canEditUnite: true  },
  COMMERCIAL:     { canCreateProject: true,  canEditProject: true,  canCreateUnite: true,  canEditUnite: true  },
  ADV:            { canCreateProject: true,  canEditProject: true,  canCreateUnite: true,  canEditUnite: true  },
  COMMERCIAL_ADV: { canCreateProject: false, canEditProject: false, canCreateUnite: false, canEditUnite: false },
};

/** Returns true if the given role can navigate to the given pathname. */
export function isRouteAllowed(role: Role, pathname: string): boolean {
  return ROLE_ALLOWED_ROUTES[role].some(
    (prefix) => pathname === prefix || pathname.startsWith(prefix + "/")
  );
}
