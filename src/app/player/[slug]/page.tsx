import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { RadioPlayerClient } from "./RadioPlayerClient";

export const dynamic = "force-dynamic";

export default async function PublicPlayerPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ embed?: string }>;
}) {
  const { slug } = await params;
  const { embed } = await searchParams;
  const isEmbed = embed === "true";

  const station = await prisma.station.findUnique({
    where: { slug },
    include: {
      mounts: {
        where: { isPublic: true },
        orderBy: { isDefault: "desc" },
      },
      broadcastLogs: {
        take: 1,
        orderBy: { startedAt: "desc" },
      },
    },
  });

  if (!station) notFound();

  const nowPlaying = station.broadcastLogs[0] || {
    trackTitle: "Neon Broadcast Stream",
    artist: station.name,
    album: station.genre,
  };

  return (
    <div
      className={`flex items-center justify-center ${
        isEmbed
          ? "w-full h-full bg-surface-container-lowest p-2"
          : "min-h-screen bg-surface-container-lowest text-on-surface p-4"
      }`}
    >
      <RadioPlayerClient
        station={station}
        mountPath={station.mounts[0]?.mountPath || "/live"}
        nowPlaying={nowPlaying}
        isEmbed={isEmbed}
      />
    </div>
  );
}
