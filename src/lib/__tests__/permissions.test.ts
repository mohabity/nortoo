import { describe, it, expect } from "vitest";
import {
  hasPermission,
  ROLE_PERMISSIONS,
  type Role,
  type Permission,
} from "../permissions.shared";

// ═══════════════════════════════════════════════════════════
// ROLE_PERMISSIONS structure
// ═══════════════════════════════════════════════════════════

describe("ROLE_PERMISSIONS", () => {
  it("admin has all 7 permissions", () => {
    expect(ROLE_PERMISSIONS.admin).toHaveLength(7);
  });

  it("manager has 3 permissions (orders:read, orders:write, analytics:read)", () => {
    expect(ROLE_PERMISSIONS.manager).toContain("orders:read");
    expect(ROLE_PERMISSIONS.manager).toContain("orders:write");
    expect(ROLE_PERMISSIONS.manager).toContain("analytics:read");
    expect(ROLE_PERMISSIONS.manager).toHaveLength(3);
  });

  it("operator has only orders:read", () => {
    expect(ROLE_PERMISSIONS.operator).toEqual(["orders:read"]);
  });
});

// ═══════════════════════════════════════════════════════════
// hasPermission
// ═══════════════════════════════════════════════════════════

describe("hasPermission", () => {
  it("admin has orders:read", () => {
    expect(hasPermission("admin", "orders:read")).toBe(true);
  });

  it("admin has team:manage", () => {
    expect(hasPermission("admin", "team:manage")).toBe(true);
  });

  it("admin has settings:write", () => {
    expect(hasPermission("admin", "settings:write")).toBe(true);
  });

  it("manager does NOT have settings:write", () => {
    expect(hasPermission("manager", "settings:write")).toBe(false);
  });

  it("manager does NOT have team:manage", () => {
    expect(hasPermission("manager", "team:manage")).toBe(false);
  });

  it("operator does NOT have orders:write", () => {
    expect(hasPermission("operator", "orders:write")).toBe(false);
  });

  it("operator does NOT have analytics:read", () => {
    expect(hasPermission("operator", "analytics:read")).toBe(false);
  });

  it("checks multiple permissions (all must be present)", () => {
    expect(hasPermission("admin", "orders:read", "orders:write", "team:manage")).toBe(true);
    expect(hasPermission("manager", "orders:read", "team:manage")).toBe(false);
  });

  it("unknown role returns false", () => {
    expect(hasPermission("unknown" as Role, "orders:read")).toBe(false);
  });
});
