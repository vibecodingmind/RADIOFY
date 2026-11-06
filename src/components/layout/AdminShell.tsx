import { TopNavbar } from "@/components/layout/TopNavbar";
import { AdminSidebar } from "@/components/layout/AdminSidebar";
import type { UserRole } from "@prisma/client";

export function AdminShell({
  children,
  role,
  user,
}: {
  children: React.ReactNode;
  role: UserRole;
  user: { name: string; email: string; role: string; avatarUrl?: string | null };
}) {
  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#0B0E14] text-[#E2E8F0] antialiased">
      <AdminSidebar role={role} />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <TopNavbar user={user} layoutVariant="admin" stations={[]} />
        <main className="flex-1 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
}
