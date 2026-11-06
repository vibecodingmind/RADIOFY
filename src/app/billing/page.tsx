import { getSessionUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Sidebar } from "@/components/layout/Sidebar";
import { TopNavbar } from "@/components/layout/TopNavbar";
import { BottomTransportBar } from "@/components/layout/BottomTransportBar";
import { BillingClient } from "./BillingClient";

export const dynamic = "force-dynamic";

export default async function BillingPage() {
  const session = await getSessionUser();
  if (!session) redirect("/login");

  const orgId = session.activeMembership?.orgId;
  if (!orgId) redirect("/");

  const [org, plans, invoices, stations] = await Promise.all([
    prisma.organization.findUnique({
      where: { id: orgId },
      include: {
        subscriptions: {
          include: { plan: true },
          orderBy: { createdAt: "desc" },
          take: 1,
        },
      },
    }),
    prisma.subscriptionPlan.findMany({
      where: { isActive: true },
      orderBy: { monthlyPriceUsd: "asc" },
    }),
    prisma.invoice.findMany({
      where: { orgId },
      orderBy: { createdAt: "desc" },
      take: 10,
    }),
    prisma.station.findMany({
      where: { orgId },
    }),
  ]);

  const activeSub = org?.subscriptions[0] || null;

  const serializedPlans = plans.map((p) => ({
    ...p,
    monthlyPriceUsd: Number(p.monthlyPriceUsd),
    annualPriceUsd: Number(p.annualPriceUsd),
  }));

  const serializedInvoices = invoices.map((inv) => ({
    ...inv,
    amountDue: Number(inv.amountDue),
    amountPaid: Number(inv.amountPaid),
  }));

  return (
    <div className="min-h-screen bg-surface text-on-surface">
      <Sidebar stationCount={stations.length} />
      <div className="md:pl-72 flex flex-col min-h-screen">
        <TopNavbar user={session.user} />
        <main className="flex-1 px-4 lg:px-6 pt-20 pb-20 max-w-[1400px] w-full mx-auto space-y-6">
          <BillingClient
            orgId={orgId}
            currentPlan={activeSub?.plan ? {
              ...activeSub.plan,
              monthlyPriceUsd: Number(activeSub.plan.monthlyPriceUsd),
              annualPriceUsd: Number(activeSub.plan.annualPriceUsd),
            } : null}
            availablePlans={serializedPlans}
            invoices={serializedInvoices}
            storageQuotaBytes={org?.storageQuotaBytes.toString() || "0"}
            storageUsedBytes={org?.storageUsedBytes.toString() || "0"}
            maxStations={org?.maxStations || 1}
            activeStationCount={stations.length}
          />
        </main>
        <BottomTransportBar />
      </div>
    </div>
  );
}
