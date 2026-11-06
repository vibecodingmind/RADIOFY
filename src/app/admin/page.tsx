import { getSessionUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { AdminShell } from "@/components/layout/AdminShell";
import { AdminDashboardClient } from "./AdminDashboardClient";
import { isPlatformOperatorRole } from "@/lib/admin-roles";
import { toClientJson } from "@/lib/serialize-client";

export const dynamic = "force-dynamic";

export default async function AdminDashboardPage() {
  const session = await getSessionUser();
  if (!session) redirect("/login");

  if (!isPlatformOperatorRole(session.user.role)) {
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

  const serializedOrgs = toClientJson(orgs) as typeof orgs;
  const serializedStations = toClientJson(stations) as typeof stations;
  const serializedAudits = toClientJson(auditLogs) as typeof auditLogs;
  const serializedTransactions = toClientJson(transactions) as typeof transactions;

  return (
    <AdminShell role={session.user.role} user={session.user}>
      <AdminDashboardClient
        organizations={serializedOrgs}
        stations={serializedStations}
        auditLogs={serializedAudits}
        transactions={serializedTransactions}
        adminUser={session.user}
      />
    </AdminShell>
  );
}
