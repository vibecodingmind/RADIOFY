import { getSessionUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { AdminShell } from "@/components/layout/AdminShell";
import { toClientJson } from "@/lib/serialize-client";
import { canViewOrganizationsAndStations } from "@/lib/admin-roles";
import { OrganizationsClient } from "./OrganizationsClient";

export const dynamic = "force-dynamic";

export default async function AdminOrganizationsPage() {
  const session = await getSessionUser();
  if (!session) redirect("/login");
  if (!canViewOrganizationsAndStations(session.user.role)) redirect("/");

  const orgs = await prisma.organization.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      _count: { select: { stations: true, members: true } },
      subscriptions: {
        where: { status: "ACTIVE" },
        take: 1,
        include: { plan: { select: { name: true, slug: true } } },
      },
    },
  });

  const data = toClientJson(orgs) as typeof orgs;

  return (
    <AdminShell role={session.user.role} user={session.user}>
      <OrganizationsClient organizations={data} />
    </AdminShell>
  );
}
