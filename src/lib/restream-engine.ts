import { spawn, ChildProcess } from "child_process";
import { prisma } from "./prisma";
import { buildMountStreamUrl } from "./stream-url";
import { RestreamStatus } from "@prisma/client";

const registry = new Map<string, ChildProcess>();

export class RestreamEngine {
  static async startDestination(destinationId: string): Promise<{ pid: number | null }> {
    const dest = await prisma.restreamDestination.findUnique({
      where: { id: destinationId },
      include: { station: { include: { mounts: true } } },
    });
    if (!dest || !dest.enabled) throw new Error("Destination not found or disabled");

    const previous = registry.get(destinationId);
    if (previous?.pid) {
      try {
        process.kill(previous.pid);
      } catch {
        /* noop */
      }
    }

    const mount = dest.station.mounts.find((m) => m.isDefault) || dest.station.mounts[0];
    const mountPath = mount?.mountPath || "/live";
    const inputUrl = buildMountStreamUrl(mountPath, dest.station.portRelay);

    if (process.env.ENABLE_RESTREAM_FFMPEG !== "true") {
      await prisma.restreamDestination.update({
        where: { id: destinationId },
        data: {
          status: RestreamStatus.ACTIVE,
          processPid: null,
          lastError:
            "FFmpeg restream disabled; set ENABLE_RESTREAM_FFMPEG=true on a streaming node",
        },
      });
      return { pid: null };
    }

    const ffmpeg = process.env.FFMPEG_BIN || "ffmpeg";
    const bitrate = dest.bitrateKbps;

    const child = spawn(
      ffmpeg,
      [
        "-re",
        "-i",
        inputUrl,
        "-c:a",
        "aac",
        "-b:a",
        `${bitrate}k`,
        "-ar",
        "44100",
        "-ac",
        "2",
        "-f",
        "flv",
        dest.rtmpIngestUrl,
      ],
      { stdio: "ignore", detached: true }
    );

    child.on("error", async () => {
      registry.delete(destinationId);
      await prisma.restreamDestination.update({
        where: { id: destinationId },
        data: {
          status: RestreamStatus.ERROR,
          processPid: null,
          lastError: "ffmpeg failed to start",
        },
      });
    });

    child.on("exit", async () => {
      registry.delete(destinationId);
      await prisma.restreamDestination.update({
        where: { id: destinationId },
        data: { status: RestreamStatus.IDLE, processPid: null },
      });
    });

    if (child.pid) {
      registry.set(destinationId, child);
      child.unref();
    }

    await prisma.restreamDestination.update({
      where: { id: destinationId },
      data: {
        status: RestreamStatus.ACTIVE,
        processPid: child.pid || null,
        lastError: null,
      },
    });

    return { pid: child.pid || null };
  }

  static async stopDestination(destinationId: string) {
    const child = registry.get(destinationId);
    if (child?.pid) {
      try {
        process.kill(child.pid);
      } catch {
        /* noop */
      }
      registry.delete(destinationId);
    }

    await prisma.restreamDestination.update({
      where: { id: destinationId },
      data: { status: RestreamStatus.IDLE, processPid: null },
    });
  }
}
