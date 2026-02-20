import { Suspense } from "react";
import { SessionProvider } from "next-auth/react";
import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
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
        <div className="ml-64">
          <Header />
          <Suspense fallback={null}>
            <ConnectedBanner />
          </Suspense>
          <main className="p-6">{children}</main>
        </div>
      </div>
    </SessionProvider>
  );
}
