import { getSessionUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Sidebar } from "@/components/layout/Sidebar";
import { TopNavbar } from "@/components/layout/TopNavbar";
import { BottomTransportBar } from "@/components/layout/BottomTransportBar";
import { DeveloperClient } from "./DeveloperClient";

export const dynamic = "force-dynamic";

export default async function DeveloperRelaysPage() {
  const session = await getSessionUser();
  if (!session) redirect("/login");

  const orgId = session.activeMembership?.orgId;
  if (!orgId) redirect("/");

  const [keys, webhooks, stations] = await Promise.all([
    prisma.apiKey.findMany({
      where: { orgId },
      select: {
        id: true,
        name: true,
        keyPrefix: true,
        scopes: true,
        lastUsedAt: true,
        createdAt: true,
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.webhookEndpoint.findMany({
      where: { orgId },
      include: {
        deliveryLogs: {
          take: 5,
          orderBy: { createdAt: "desc" },
        },
      },
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
          <DeveloperClient initialKeys={keys} initialWebhooks={webhooks} />
        </main>
        <BottomTransportBar />
      </div>
    </div>
  );
}
