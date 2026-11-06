import { getSessionUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Sidebar } from "@/components/layout/Sidebar";
import { TopNavbar } from "@/components/layout/TopNavbar";
import { BottomTransportBar } from "@/components/layout/BottomTransportBar";
import { MediaClient } from "./MediaClient";

export const dynamic = "force-dynamic";

export default async function MediaPage() {
  const session = await getSessionUser();
  if (!session) redirect("/login");

  const orgId = session.activeMembership?.orgId;
  const isSuper = session.user.role === "SUPER_ADMIN";

  const [stations, org] = await Promise.all([
    prisma.station.findMany({
      where: isSuper ? undefined : { orgId },
      orderBy: { createdAt: "asc" },
    }),
    prisma.organization.findUnique({
      where: { id: orgId },
    }),
  ]);

  const defaultStationId = stations[0]?.id;

  const mediaFiles = defaultStationId
    ? await prisma.mediaFile.findMany({
        where: { stationId: defaultStationId },
        orderBy: { createdAt: "desc" },
      })
    : [];

  const serializedFiles = mediaFiles.map((f) => ({
    ...f,
    fileSize: f.fileSize.toString(),
  }));

  return (
    <div className="min-h-screen bg-surface text-on-surface">
      <Sidebar stationCount={stations.length} />
      <div className="md:pl-72 flex flex-col min-h-screen">
        <TopNavbar user={session.user} />
        <main className="flex-1 px-4 lg:px-6 pt-20 pb-20 max-w-[1400px] w-full mx-auto space-y-6">
          <MediaClient
            stations={stations}
            initialStationId={defaultStationId}
            initialFiles={serializedFiles}
            storageUsedBytes={org?.storageUsedBytes.toString() || "0"}
            storageQuotaBytes={org?.storageQuotaBytes.toString() || "5368709120"}
          />
        </main>
        <BottomTransportBar />
      </div>
    </div>
  );
}
