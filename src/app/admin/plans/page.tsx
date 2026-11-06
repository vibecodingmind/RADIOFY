import { getSessionUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { AdminShell } from "@/components/layout/AdminShell";
import { PlansClient } from "./PlansClient";
import { toClientJson } from "@/lib/serialize-client";

export const dynamic = "force-dynamic";

export default async function AdminPlansPage() {
  const session = await getSessionUser();
  if (!session) redirect("/login");
  if (session.user.role !== "SUPER_ADMIN" && session.user.role !== "BILLING_ADMIN") {
    redirect("/admin");
  }

  const plans = await prisma.subscriptionPlan.findMany({ orderBy: { monthlyPriceUsd: "asc" } });
  const serialized = toClientJson(plans) as Array<
    (typeof plans)[0] & { monthlyPriceUsd: number; annualPriceUsd: number }
  >;

  return (
    <AdminShell role={session.user.role} user={session.user}>
      <PlansClient plans={serialized} />
    </AdminShell>
  );
}
