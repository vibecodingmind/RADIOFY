import { getSessionUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Sidebar } from "@/components/layout/Sidebar";
import { TopNavbar } from "@/components/layout/TopNavbar";
import { BottomTransportBar } from "@/components/layout/BottomTransportBar";
import { CommandCenter } from "@/components/dashboard/CommandCenter";
import { prisma } from "@/lib/prisma";
import { getTenantScope, stationOrgWhere } from "@/lib/tenant";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const session = await getSessionUser();
  if (!session) {
    redirect("/login");
  }

  const { isSuper, orgId } = getTenantScope(session);

  if (!isSuper && !orgId) {
    redirect("/team");
  }

  const stations = await prisma.station.findMany({
    where: stationOrgWhere(isSuper, orgId),
    orderBy: { createdAt: "asc" },
  });

  const stationOptions = stations.map((s) => ({
    id: s.id,
    name: s.name,
    format: s.defaultFormat.replace("_", " "),
    bitrate: s.defaultBitrate,
    status: s.backendStatus === "ON_AIR" ? "ON-AIR" : s.backendStatus,
  }));

  return (
    <div className="min-h-screen bg-surface text-on-surface">
      {/* Fixed Left Sidebar */}
      <Sidebar stationCount={stations.length} />

      {/* Main Studio Frame */}
      <div className="md:pl-72 flex flex-col min-h-screen">
        {/* Top Navbar */}
        <TopNavbar
          user={session.user}
          stations={stationOptions}
          activeStationId={stations[0]?.id}
        />

        {/* Command Center Content Area */}
        <main className="flex-1 px-4 lg:px-6 pt-20 pb-20 max-w-[1600px] w-full mx-auto">
          <CommandCenter />
        </main>

        {/* Master Bottom Transport Bar */}
        <BottomTransportBar
          stationName={stations[0]?.name}
          bitrate={stations[0]?.defaultBitrate}
          format={stations[0]?.defaultFormat}
        />
      </div>
    </div>
  );
}
