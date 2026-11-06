import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { buildMountStreamUrl } from "@/lib/stream-url";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;

  const station = await prisma.station.findUnique({
    where: { slug },
    include: {
      mounts: { where: { isPublic: true }, orderBy: { isDefault: "desc" } },
      broadcastLogs: { take: 1, orderBy: { startedAt: "desc" } },
    },
  });

  if (!station || !station.publicPageEnabled) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const defaultMount = station.mounts[0];
  const nowPlaying = station.broadcastLogs[0];

  return NextResponse.json({
    station: {
      id: station.id,
      name: station.name,
      slug: station.slug,
      genre: station.genre,
      description: station.description,
      logoUrl: station.logoUrl,
      playerBannerUrl: station.playerBannerUrl,
      playerAccentColor: station.playerAccentColor,
      currentListeners: station.currentListeners,
      backendStatus: station.backendStatus,
    },
    streamUrl: defaultMount
      ? buildMountStreamUrl(defaultMount.mountPath, station.portRelay)
      : null,
    nowPlaying: nowPlaying
      ? {
          trackTitle: nowPlaying.trackTitle,
          artist: nowPlaying.artist,
          album: nowPlaying.album,
          startedAt: nowPlaying.startedAt,
        }
      : null,
  });
}
