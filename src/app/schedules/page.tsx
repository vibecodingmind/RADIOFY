import { getSessionUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Sidebar } from "@/components/layout/Sidebar";
import { TopNavbar } from "@/components/layout/TopNavbar";
import { BottomTransportBar } from "@/components/layout/BottomTransportBar";
import { SchedulesClient } from "./SchedulesClient";

export const dynamic = "force-dynamic";

export default async function SchedulesPage() {
  const session = await getSessionUser();
  if (!session) redirect("/login");

  const orgId = session.activeMembership?.orgId;
  const isSuper = session.user.role === "SUPER_ADMIN";

  const [stations, shows, playlists, schedules] = await Promise.all([
    prisma.station.findMany({
      where: isSuper ? undefined : { orgId },
      orderBy: { createdAt: "asc" },
      select: { id: true, name: true, slug: true },
    }),
    prisma.show.findMany({
      where: isSuper ? undefined : { station: { orgId } },
      orderBy: { title: "asc" },
      select: { id: true, title: true, hostName: true, colorCode: true, stationId: true },
    }),
    prisma.playlist.findMany({
      where: isSuper ? undefined : { station: { orgId } },
      orderBy: { name: "asc" },
      select: { id: true, name: true, stationId: true, type: true },
    }),
    prisma.stationSchedule.findMany({
      where: isSuper ? undefined : { station: { orgId } },
      include: {
        station: { select: { id: true, name: true, slug: true } },
        show: { select: { id: true, title: true, hostName: true, colorCode: true } },
        playlist: { select: { id: true, name: true, type: true } },
      },
      orderBy: [{ dayOfWeek: "asc" }, { startTime: "asc" }],
    }),
  ]);

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#0B0E14] text-[#E2E8F0] antialiased">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <TopNavbar />
        <main className="flex-1 overflow-y-auto pb-24">
          <SchedulesClient
            initialSchedules={schedules}
            stations={stations}
            shows={shows}
            playlists={playlists}
          />
        </main>
      </div>
      <BottomTransportBar />
    </div>
  );
}
