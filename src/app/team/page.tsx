import { getSessionUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Sidebar } from "@/components/layout/Sidebar";
import { TopNavbar } from "@/components/layout/TopNavbar";
import { BottomTransportBar } from "@/components/layout/BottomTransportBar";
import { TeamManagerClient } from "./TeamManagerClient";
import { ROLE_PERMISSIONS_MAP } from "@/lib/permissions";

export const dynamic = "force-dynamic";

export default async function TeamPage() {
  const session = await getSessionUser();
  if (!session) redirect("/login");

  const orgId = session.activeMembership?.orgId;
  if (!orgId) redirect("/");

  const [members, invites, stations] = await Promise.all([
    prisma.organizationMember.findMany({
      where: { orgId },
      include: {
        user: true,
        customRole: true,
      },
      orderBy: { joinedAt: "asc" },
    }),
    prisma.organizationInvite.findMany({
      where: { orgId, status: "PENDING" },
      orderBy: { createdAt: "desc" },
    }),
    prisma.station.findMany({
      where: { orgId },
    }),
  ]);

  return (
    <div className="min-h-screen bg-surface text-on-surface">
      <Sidebar stationCount={stations.length} />
      <div className="md:pl-72 flex flex-col min-h-screen">
        <TopNavbar user={session.user} />
        <main className="flex-1 px-4 lg:px-6 pt-20 pb-20 max-w-[1400px] w-full mx-auto space-y-6">
          <TeamManagerClient
            orgId={orgId}
            currentUserId={session.user.id}
            initialMembers={members}
            initialInvites={invites}
            rolePermissions={ROLE_PERMISSIONS_MAP}
          />
        </main>
        <BottomTransportBar />
      </div>
    </div>
  );
}
