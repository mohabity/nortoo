import { Suspense } from "react";
import { SessionProvider } from "next-auth/react";
import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { MobileHeader } from "@/components/layout/mobile-header";
import { BottomNav } from "@/components/layout/bottom-nav";
import { ConnectedBanner } from "@/components/dashboard/connected-banner";
import { EmailVerificationBanner } from "@/components/dashboard/email-verification-banner";
import { OnboardingRedirect } from "@/components/dashboard/onboarding-redirect";
import { ReportBanner } from "@/components/dashboard/report-banner";
import { PlanBanner } from "@/components/plan-banner";
import { BillingProvider } from "@/components/billing-context";
import { ToastProvider } from "@/components/ui/toast";
import { SupportBubble } from "@/components/layout/support-bubble";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SessionProvider>
      <BillingProvider>
        <OnboardingRedirect />
        <div className="min-h-screen bg-snow">
          <Sidebar />
          <MobileHeader />
          <div className="lg:ms-64">
            <Header />
            <Suspense fallback={null}>
              <ConnectedBanner />
            </Suspense>
            <Suspense fallback={null}>
              <EmailVerificationBanner />
            </Suspense>
            <Suspense fallback={null}>
              <ReportBanner />
            </Suspense>
            <Suspense fallback={null}>
              <PlanBanner />
            </Suspense>
            <ToastProvider>
              <main className="px-4 py-4 pb-24 lg:p-6 lg:pb-6">{children}</main>
              <SupportBubble />
            </ToastProvider>
          </div>
          <BottomNav />
        </div>
      </BillingProvider>
    </SessionProvider>
  );
}
