import { getSessionUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { AdminSidebar } from "@/components/layout/AdminSidebar";
import { TopNavbar } from "@/components/layout/TopNavbar";
import { AdminDashboardClient } from "./AdminDashboardClient";

export const dynamic = "force-dynamic";

export default async function AdminDashboardPage() {
  const session = await getSessionUser();
  if (!session) redirect("/login");

  const platformRoles = ["SUPER_ADMIN", "SUPPORT_ADMIN", "BILLING_ADMIN"] as const;
  if (!platformRoles.includes(session.user.role as (typeof platformRoles)[number])) {
    redirect("/");
  }

  const [orgs, stations, auditLogs, transactions] = await Promise.all([
    prisma.organization.findMany({
      include: {
        subscriptions: {
          include: { plan: true },
          where: { status: "ACTIVE" },
        },
        stations: true,
        members: { include: { user: true } },
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.station.findMany({
      include: {
        processState: true,
        mounts: true,
        organization: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.auditLog.findMany({
      take: 20,
      orderBy: { createdAt: "desc" },
      include: {
        organization: { select: { id: true, name: true, slug: true } },
        user: { select: { id: true, name: true, email: true } },
      },
    }),
    prisma.paymentTransaction.findMany({
      take: 10,
      orderBy: { createdAt: "desc" },
      include: {
        invoice: {
          include: {
            organization: { select: { id: true, name: true } },
          },
        },
      },
    }),
  ]);

  const serializedOrgs = orgs.map((o) => ({
    ...o,
    storageQuotaBytes: o.storageQuotaBytes.toString(),
    storageUsedBytes: o.storageUsedBytes.toString(),
    maxBandwidthBytes: o.maxBandwidthBytes.toString(),
  }));

  const serializedStations = stations;

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#0B0E14] text-[#E2E8F0] antialiased">
      <AdminSidebar role={session.user.role} />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <TopNavbar user={session.user} />
        <main className="flex-1 overflow-y-auto">
          <AdminDashboardClient
            organizations={serializedOrgs}
            stations={serializedStations}
            auditLogs={auditLogs}
            transactions={transactions}
            adminUser={session.user}
          />
        </main>
      </div>
    </div>
  );
}
