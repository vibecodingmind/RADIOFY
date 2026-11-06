import { getSessionUser } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Sidebar } from "@/components/layout/Sidebar";
import { TopNavbar } from "@/components/layout/TopNavbar";
import { BottomTransportBar } from "@/components/layout/BottomTransportBar";
import { StationStudioClient } from "./StationStudioClient";

export const dynamic = "force-dynamic";

export default async function StationDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const session = await getSessionUser();
  if (!session) redirect("/login");

  const { slug } = await params;
  const isSuper = session.user.role === "SUPER_ADMIN";
  const orgId = session.activeMembership?.orgId;

  const station = await prisma.station.findFirst({
    where: {
      slug,
      ...(isSuper ? {} : { orgId }),
    },
    include: {
      mounts: true,
      processState: true,
      playlists: true,
      shows: true,
      _count: {
        select: {
          mediaFiles: true,
          playlists: true,
          shows: true,
        },
      },
    },
  });

  if (!station) notFound();

  const allStations = await prisma.station.findMany({
    where: isSuper ? undefined : { orgId },
  });

  return (
    <div className="min-h-screen bg-surface text-on-surface">
      <Sidebar stationCount={allStations.length} />
      <div className="md:pl-72 flex flex-col min-h-screen">
        <TopNavbar user={session.user} />
        <main className="flex-1 px-4 lg:px-6 pt-20 pb-20 max-w-[1400px] w-full mx-auto space-y-6">
          <StationStudioClient station={station} />
        </main>
        <BottomTransportBar
          stationName={station.name}
          bitrate={station.defaultBitrate}
          format={station.defaultFormat}
        />
      </div>
    </div>
  );
}
