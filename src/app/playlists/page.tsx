import { getSessionUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Sidebar } from "@/components/layout/Sidebar";
import { TopNavbar } from "@/components/layout/TopNavbar";
import { BottomTransportBar } from "@/components/layout/BottomTransportBar";
import { PlaylistsClient } from "./PlaylistsClient";

export const dynamic = "force-dynamic";

export default async function PlaylistsPage() {
  const session = await getSessionUser();
  if (!session) redirect("/login");

  const orgId = session.activeMembership?.orgId;
  const isSuper = session.user.role === "SUPER_ADMIN";

  const [stations, allMedia] = await Promise.all([
    prisma.station.findMany({
      where: isSuper ? undefined : { orgId },
      orderBy: { createdAt: "asc" },
    }),
    prisma.mediaFile.findMany({
      where: isSuper ? undefined : { station: { orgId } },
      orderBy: { title: "asc" },
    }),
  ]);

  const defaultStationId = stations[0]?.id;

  const playlists = defaultStationId
    ? await prisma.playlist.findMany({
        where: { stationId: defaultStationId },
        include: {
          items: {
            include: { mediaFile: true },
            orderBy: { order: "asc" },
          },
        },
        orderBy: { createdAt: "desc" },
      })
    : [];

  const serializedPlaylists = playlists.map((p) => ({
    ...p,
    items: p.items.map((i) => ({
      ...i,
      mediaFile: {
        ...i.mediaFile,
        fileSize: i.mediaFile.fileSize.toString(),
      },
    })),
  }));

  const serializedMedia = allMedia.map((m) => ({
    ...m,
    fileSize: m.fileSize.toString(),
  }));

  return (
    <div className="min-h-screen bg-surface text-on-surface">
      <Sidebar stationCount={stations.length} />
      <div className="md:pl-72 flex flex-col min-h-screen">
        <TopNavbar user={session.user} />
        <main className="flex-1 px-4 lg:px-6 pt-20 pb-20 max-w-[1400px] w-full mx-auto space-y-6">
          <PlaylistsClient
            stations={stations}
            initialStationId={defaultStationId}
            initialPlaylists={serializedPlaylists}
            availableMedia={serializedMedia}
          />
        </main>
        <BottomTransportBar />
      </div>
    </div>
  );
}
