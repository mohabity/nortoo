// ── Shared permission types & constants (safe for client and server) ──

export type Permission =
  | "orders:read"
  | "orders:write"
  | "analytics:read"
  | "settings:read"
  | "settings:write"
  | "team:manage"
  | "compliance:read";

export type Role = "admin" | "manager" | "operator";

// ── Role → permissions map ──

export const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  admin: [
    "orders:read",
    "orders:write",
    "analytics:read",
    "settings:read",
    "settings:write",
    "team:manage",
    "compliance:read",
  ],
  manager: ["orders:read", "orders:write", "analytics:read"],
  operator: ["orders:read"],
};

export const ROLE_LABELS: Record<Role, string> = {
  admin: "Administrateur",
  manager: "Responsable",
  operator: "Opérateur",
};

// ── Helper: check if a role has specific permissions ──

export function hasPermission(role: Role, ...perms: Permission[]): boolean {
  const rolePerms = ROLE_PERMISSIONS[role];
  if (!rolePerms) return false;
  return perms.every((p) => rolePerms.includes(p));
}
