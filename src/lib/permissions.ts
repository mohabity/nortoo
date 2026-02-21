import { NextResponse } from "next/server";
import { auth } from "@/auth";

// ── Permission types ──

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

// ── Auth context returned by requirePermission ──

export interface AuthContext {
  merchantId: number;
  userId: number;
  role: Role;
  plan: string;
}

// ── Helper: check if a role has specific permissions ──

export function hasPermission(role: Role, ...perms: Permission[]): boolean {
  const rolePerms = ROLE_PERMISSIONS[role];
  if (!rolePerms) return false;
  return perms.every((p) => rolePerms.includes(p));
}

// ── Permission error ──

export class PermissionError extends Error {
  status: number;
  constructor(message: string, status: number = 403) {
    super(message);
    this.status = status;
  }
}

// ── Require specific permissions for an API route ──

export async function requirePermission(
  ...perms: Permission[]
): Promise<AuthContext> {
  const session = await auth();

  if (
    !session?.user?.merchantId ||
    !session?.user?.userId ||
    !session?.user?.role
  ) {
    throw new PermissionError("Non authentifié", 401);
  }

  const { merchantId, userId, role, plan } = session.user;

  if (!hasPermission(role as Role, ...perms)) {
    throw new PermissionError(
      "Vous n'avez pas la permission d'effectuer cette action."
    );
  }

  return { merchantId, userId, role: role as Role, plan };
}

// ── Handle permission errors in API routes ──

export function handlePermissionError(err: unknown) {
  if (err instanceof PermissionError) {
    return NextResponse.json(
      {
        error: err.message,
        code: err.status === 401 ? "UNAUTHORIZED" : "FORBIDDEN",
      },
      { status: err.status }
    );
  }
  throw err;
}
