import { NextResponse } from "next/server";
import { auth } from "@/auth";

// Re-export shared types & constants so server imports keep working
export {
  type Permission,
  type Role,
  ROLE_PERMISSIONS,
  ROLE_LABELS,
  hasPermission,
} from "@/lib/permissions.shared";

import { hasPermission, type Role, type Permission } from "@/lib/permissions.shared";

// ── Auth context returned by requirePermission ──

export interface AuthContext {
  merchantId: number;
  userId: number;
  role: Role;
  plan: string;
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
