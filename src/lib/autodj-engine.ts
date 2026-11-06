import { prisma } from "./prisma";
import path from "path";

interface AutodjMeta {
  playlistItemIndex?: number;
  playlistId?: string;
  currentLogId?: string;
}

function parseMeta(json: string): AutodjMeta {
  try {
    return JSON.parse(json || "{}") as AutodjMeta;
  } catch {
    return {};
  }
}

/**
 * Advances AutoDJ rotation for ON_AIR stations (used when Liquidsoap is not running).
 * Creates broadcast spin logs from active playlist items.
 */
export async function tickAutoDjForStation(stationId: string) {
  const station = await prisma.station.findUnique({
    where: { id: stationId },
    include: {
      processState: true,
      playlists: {
        where: { isActive: true },
        include: {
          items: {
            include: { mediaFile: true },
            orderBy: { order: "asc" },
          },
        },
        orderBy: { weight: "desc" },
        take: 1,
      },
    },
  });

  if (!station || station.backendStatus !== "ON_AIR" || !station.autoDjEnabled) {
    return null;
  }

  const playlist = station.playlists[0];
  if (!playlist || playlist.items.length === 0) {
    return null;
  }

  const meta = parseMeta(station.processState?.autodjMetaJson || "{}");
  let itemIndex = meta.playlistItemIndex ?? 0;
  if (meta.playlistId !== playlist.id) {
    itemIndex = 0;
  }

  const item = playlist.items[itemIndex % playlist.items.length];
  const media = item.mediaFile;
  const now = new Date();

  if (meta.currentLogId) {
    const prev = await prisma.broadcastLog.findUnique({ where: { id: meta.currentLogId } });
    if (prev && !prev.endedAt) {
      const elapsedSec = (now.getTime() - prev.startedAt.getTime()) / 1000;
      if (elapsedSec < Math.max(15, media.duration * 0.85)) {
        return prev;
      }
      await prisma.broadcastLog.update({
        where: { id: prev.id },
        data: {
          endedAt: now,
          durationSeconds: media.duration,
        },
      });
    }
  }

  const log = await prisma.broadcastLog.create({
    data: {
      stationId: station.id,
      mediaFileId: media.id,
      trackTitle: media.title,
      artist: media.artist,
      album: media.album,
      startedAt: now,
      durationSeconds: media.duration,
      listenersPeak: station.currentListeners,
    },
  });

  const nextIndex = (itemIndex + 1) % playlist.items.length;
  const nextMeta: AutodjMeta = {
    playlistId: playlist.id,
    playlistItemIndex: nextIndex,
    currentLogId: log.id,
  };

  await prisma.stationProcessState.update({
    where: { stationId: station.id },
    data: {
      autodjMetaJson: JSON.stringify(nextMeta),
      lastHeartbeat: now,
    },
  });

  return log;
}

export async function tickAllAutoDjStations() {
  const stations = await prisma.station.findMany({
    where: { backendStatus: "ON_AIR", autoDjEnabled: true },
    select: { id: true },
  });

  const results = [];
  for (const s of stations) {
    results.push(await tickAutoDjForStation(s.id));
  }
  return results.filter(Boolean);
}

export async function buildStationMediaDirectory(stationId: string): Promise<string> {
  const storageBase = process.env.STORAGE_LOCAL_PATH || "./storage";
  const mediaDir = path.join(storageBase, "media", stationId);
  const playlistPath = path.join(storageBase, "liquidsoap", stationId, "playlist.m3u");

  const files = await prisma.mediaFile.findMany({
    where: { stationId },
    orderBy: { createdAt: "asc" },
  });

  const fs = await import("fs/promises");
  await fs.mkdir(path.dirname(playlistPath), { recursive: true });

  const lines = files.map((f) => {
    const abs = path.join(storageBase, f.storageKey);
    return abs;
  });

  await fs.writeFile(playlistPath, `#EXTM3U\n${lines.join("\n")}\n`, "utf8");
  return mediaDir;
}
