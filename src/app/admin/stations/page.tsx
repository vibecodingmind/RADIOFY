import { getSessionUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { AdminShell } from "@/components/layout/AdminShell";
import { toClientJson } from "@/lib/serialize-client";
import { canViewOrganizationsAndStations } from "@/lib/admin-roles";
import { StationsClient } from "./StationsClient";

export const dynamic = "force-dynamic";

export default async function AdminStationsPage() {
  const session = await getSessionUser();
  if (!session) redirect("/login");
  if (!canViewOrganizationsAndStations(session.user.role)) redirect("/");

  const stations = await prisma.station.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      organization: { select: { id: true, name: true, slug: true } },
      processState: { select: { lastHeartbeat: true, pid: true } },
    },
  });

  const data = toClientJson(stations) as typeof stations;

  return (
    <AdminShell role={session.user.role} user={session.user}>
      <StationsClient stations={data} />
    </AdminShell>
  );
}
