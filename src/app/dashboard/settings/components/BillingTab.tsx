"use client";

import BillingPage from "@/app/dashboard/billing/page";
import type { BaseTabProps } from "../types";

/**
 * BillingTab — renders the full billing page content
 * directly inside the settings tab, so the user never
 * leaves the settings page.
 */
export function BillingTab(_props: BaseTabProps) {
  return <BillingPage />;
}
