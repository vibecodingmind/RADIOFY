import { getSessionUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { AdminShell } from "@/components/layout/AdminShell";
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
    <AdminShell role={session.user.role} user={session.user}>
      <GatewaysClient initialConfigs={configs} />
    </AdminShell>
  );
}
