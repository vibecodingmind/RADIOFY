import { getSessionUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Sidebar } from "@/components/layout/Sidebar";
import { TopNavbar } from "@/components/layout/TopNavbar";
import { BottomTransportBar } from "@/components/layout/BottomTransportBar";
import { CreateStationClient } from "./CreateStationClient";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function CreateStationPage() {
  const session = await getSessionUser();
  if (!session) redirect("/login");

  const orgId = session.activeMembership?.orgId;
  const isSuper = session.user.role === "SUPER_ADMIN";

  const stations = await prisma.station.findMany({
    where: isSuper ? undefined : { orgId },
  });

  return (
    <div className="min-h-screen bg-surface text-on-surface">
      <Sidebar stationCount={stations.length} />
      <div className="md:pl-72 flex flex-col min-h-screen">
        <TopNavbar user={session.user} />
        <main className="flex-1 px-4 lg:px-6 pt-20 pb-20 max-w-[900px] w-full mx-auto space-y-6">
          <CreateStationClient />
        </main>
        <BottomTransportBar />
      </div>
    </div>
  );
}
