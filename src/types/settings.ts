import type { LucideIcon } from "lucide-react";

// ── Tab identifiers ──
export type TabId =
  | "profile"
  | "store"
  | "team"
  | "scoring"
  | "escalation"
  | "rto_costs"
  | "api"
  | "notifications"
  | "privacy"
  | "phone_lists"
  | "billing";

// ── Tab metadata (for sidebar rendering) ──
export interface TabMeta {
  id: TabId;
  labelKey: string;
  icon: LucideIcon;
}

// ── Merchant settings (from GET /api/settings) ──
export interface MerchantSettings {
  name: string;
  domain: string | null;
  email: string;
  emailVerified: string | null;
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
  notificationPreferences: string | null;
  whatsappPhoneNumberId: string | null;
  whatsappWabaId: string | null;
  trialEndsAt: string | null;
  currentMonthOrders: number;
  currentMonthStart: string | null;
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
