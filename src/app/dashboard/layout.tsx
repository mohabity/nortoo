import { Suspense } from "react";
import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { ConnectedBanner } from "@/components/dashboard/connected-banner";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-cream">
      <Sidebar />
      <div className="ml-64">
        <Header />
        <Suspense fallback={null}>
          <ConnectedBanner />
        </Suspense>
        <main className="p-6">{children}</main>
      </div>
    </div>
  );
}
