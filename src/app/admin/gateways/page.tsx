import { getSessionUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { AdminSidebar } from "@/components/layout/AdminSidebar";
import { TopNavbar } from "@/components/layout/TopNavbar";
import { GatewaysClient } from "./GatewaysClient";

export const dynamic = "force-dynamic";

export default async function GatewaysPage() {
  const session = await getSessionUser();
  if (!session) redirect("/login");

  if (session.user.role !== "SUPER_ADMIN" && session.user.role !== "BILLING_ADMIN") {
    redirect("/admin");
  }

  const configs = await prisma.paymentGatewayConfig.findMany();

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#0B0E14] text-[#E2E8F0] antialiased">
      <AdminSidebar role={session.user.role} />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <TopNavbar user={session.user} />
        <main className="flex-1 overflow-y-auto">
          <GatewaysClient initialConfigs={configs} />
        </main>
      </div>
    </div>
  );
}
