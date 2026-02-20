import { Suspense } from "react";
import { SessionProvider } from "next-auth/react";
import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { MobileHeader } from "@/components/layout/mobile-header";
import { BottomNav } from "@/components/layout/bottom-nav";
import { ConnectedBanner } from "@/components/dashboard/connected-banner";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SessionProvider>
      <div className="min-h-screen bg-snow">
        <Sidebar />
        <MobileHeader />
        <div className="lg:ml-64">
          <Header />
          <Suspense fallback={null}>
            <ConnectedBanner />
          </Suspense>
          <main className="px-4 py-4 pb-24 lg:p-6 lg:pb-6">{children}</main>
        </div>
        <BottomNav />
      </div>
    </SessionProvider>
  );
}
