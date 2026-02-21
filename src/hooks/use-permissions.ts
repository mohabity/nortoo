"use client";

import { useSession } from "next-auth/react";
import {
  type Permission,
  type Role,
  ROLE_PERMISSIONS,
} from "@/lib/permissions.shared";

/**
 * Client-side permission hook.
 * Reads the user's role from the Auth.js session and provides
 * a `can()` function to check permissions.
 */
export function usePermissions() {
  const { data: session } = useSession();
  const role = (session?.user?.role ?? "operator") as Role;
  const userId = session?.user?.userId;

  function can(...perms: Permission[]): boolean {
    const rolePerms = ROLE_PERMISSIONS[role];
    if (!rolePerms) return false;
    return perms.every((p) => rolePerms.includes(p));
  }

  return { role, userId, can };
}
