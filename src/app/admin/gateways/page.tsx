import { getSessionUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Sidebar } from "@/components/layout/Sidebar";
import { TopNavbar } from "@/components/layout/TopNavbar";
import { BottomTransportBar } from "@/components/layout/BottomTransportBar";
import { GatewaysClient } from "./GatewaysClient";

export const dynamic = "force-dynamic";

export default async function GatewaysPage() {
  const session = await getSessionUser();
  if (!session) redirect("/login");

  if (session.user.role !== "SUPER_ADMIN") {
    redirect("/");
  }

  const configs = await prisma.paymentGatewayConfig.findMany();

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#0B0E14] text-[#E2E8F0] antialiased">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <TopNavbar />
        <main className="flex-1 overflow-y-auto pb-24">
          <GatewaysClient initialConfigs={configs} />
        </main>
      </div>
      <BottomTransportBar />
    </div>
  );
}
