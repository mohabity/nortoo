import type { LucideIcon } from "lucide-react";

// ── Tab identifiers ──
export type TabId =
  | "profile"
  | "store"
  | "scoring"
  | "escalation"
  | "rto_costs"
  | "api"
  | "notifications"
  | "privacy";

// ── Tab metadata (for sidebar rendering) ──
export interface TabMeta {
  id: TabId;
  label: string;
  icon: LucideIcon;
}

// ── Merchant settings (from GET /api/settings) ──
export interface MerchantSettings {
  name: string;
  domain: string | null;
  email: string;
  plan: string;
  apiKey: string | null;
  youcanStoreId: string | null;
  verifyThreshold: number;
  flagThreshold: number;
  blockThreshold: number;
  autoBlockEnabled: boolean;
  escalationConfig: string | null;
  rtoCostFixed: number;
  rtoCostPercent: number;
  dataRetentionMonths: number;
  cndpDeclarationRef: string | null;
  consentRecordedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

// ── Toast notification ──
export interface Toast {
  id: string;
  type: "success" | "error" | "info";
  message: string;
}

// ── Common props for all tab components ──
export interface BaseTabProps {
  settings: MerchantSettings;
  onRefresh: () => Promise<void>;
  onToast: (type: Toast["type"], message: string) => void;
}
