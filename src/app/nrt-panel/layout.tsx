import { AdminSidebar } from "@/components/admin/admin-sidebar";
import { AdminHeader } from "@/components/admin/admin-header";
import { ToastProvider } from "@/components/ui/toast";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-snow">
      <AdminSidebar />
      <div className="lg:ml-56">
        <AdminHeader />
        <ToastProvider>
          <main className="p-4 lg:p-6">{children}</main>
        </ToastProvider>
      </div>
    </div>
  );
}
