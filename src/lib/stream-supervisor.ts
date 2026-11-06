import { prisma } from "./prisma";
import { generateLiquidsoapConfig } from "./liquidsoap-generator";
import { buildStationMediaDirectory } from "./autodj-engine";
import path from "path";
import fs from "fs/promises";
import { spawn, ChildProcess } from "child_process";
import { StationStatus, StreamAudioFormat } from "@prisma/client";

const processRegistry = new Map<string, ChildProcess>();

function formatToLiquidsoap(format: StreamAudioFormat): "MP3" | "AAC" | "OGG" | "FLAC" | "OPUS" {
  if (format.startsWith("AAC")) return "AAC";
  if (format.startsWith("MP3")) return "MP3";
  if (format.startsWith("FLAC")) return "FLAC";
  if (format.startsWith("OPUS")) return "OPUS";
  return "MP3";
}

async function writeLiquidsoapConfig(stationId: string) {
  const station = await prisma.station.findUnique({
    where: { id: stationId },
    include: { mounts: true, processState: true },
  });
  if (!station) throw new Error("Station not found");

  const storageBase = process.env.STORAGE_LOCAL_PATH || "./storage";
  await buildStationMediaDirectory(stationId);
  const mediaDirectory = path.join(storageBase, "liquidsoap", stationId, "playlist.m3u");

  const configBody = generateLiquidsoapConfig({
    stationId: station.id,
    stationName: station.name,
    slug: station.slug,
    backendPort: station.portIngest,
    streamBitrate: station.defaultBitrate,
    streamFormat: formatToLiquidsoap(station.defaultFormat),
    mediaDirectory,
    icecastHost: process.env.STREAM_ICECAST_HOST || "127.0.0.1",
    icecastPort: Number(process.env.STREAM_ICECAST_PORT || station.portRelay),
    icecastPassword: process.env.STREAM_ICECAST_SOURCE_PASSWORD || station.sourcePassword,
    mounts: station.mounts.map((m) => ({
      path: m.mountPath,
      bitrate: m.bitrate,
      format: m.format,
      isDefault: m.isDefault,
    })),
  });

  const configDir = path.join(storageBase, "liquidsoap", stationId);
  await fs.mkdir(configDir, { recursive: true });
  const configPath = path.join(configDir, `${station.slug}.liq`);
  await fs.writeFile(configPath, configBody, "utf8");
  await fs.copyFile(configPath, path.join(configDir, "station.liq"));

  await prisma.stationProcessState.update({
    where: { stationId: station.id },
    data: { liquidsoapConfigPath: configPath },
  });

  return configPath;
}

async function callExternalSupervisor(stationId: string, action: string) {
  const base = process.env.STREAM_SUPERVISOR_URL;
  if (!base) return null;

  const res = await fetch(`${base.replace(/\/$/, "")}/stations/${stationId}/${action}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.STREAM_SUPERVISOR_TOKEN || ""}`,
    },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as { error?: string }).error || "Supervisor request failed");
  }
  return res.json();
}

export class StreamSupervisor {
  static async start(stationId: string) {
    const external = await callExternalSupervisor(stationId, "start");
    if (external) return external;

    const configPath = await writeLiquidsoapConfig(stationId);
    const liquidsoapBin = process.env.LIQUIDSOAP_BIN || "liquidsoap";

    let pid: number | null = null;
    let mode: "liquidsoap" | "managed" = "managed";

    if (process.env.ENABLE_LIQUIDSOAP === "true") {
      const child = spawn(liquidsoapBin, [configPath], {
        detached: true,
        stdio: "ignore",
      });
      child.on("error", () => {
        processRegistry.delete(stationId);
      });
      if (child.pid) {
        child.unref();
        processRegistry.set(stationId, child);
        pid = child.pid;
        mode = "liquidsoap";
      }
    }

    await prisma.station.update({
      where: { id: stationId },
      data: {
        backendStatus: StationStatus.ON_AIR,
        processState: {
          update: {
            pid,
            supervisorPid: pid,
            encoderHealth: 100,
            lastHeartbeat: new Date(),
            cpuUsage: mode === "liquidsoap" ? 12 : 4,
            memoryMb: mode === "liquidsoap" ? 120 : 48,
          },
        },
      },
    });

    return { mode, configPath, pid };
  }

  static async stop(stationId: string) {
    const external = await callExternalSupervisor(stationId, "stop");
    if (external) return external;

    const proc = processRegistry.get(stationId);
    if (proc?.pid) {
      try {
        process.kill(proc.pid);
      } catch {
        /* already stopped */
      }
      processRegistry.delete(stationId);
    }

    await prisma.station.update({
      where: { id: stationId },
      data: {
        backendStatus: StationStatus.STOPPED,
        processState: {
          update: {
            pid: null,
            supervisorPid: null,
            encoderHealth: 0,
            lastHeartbeat: new Date(),
          },
        },
      },
    });

    return { stopped: true };
  }

  static async restart(stationId: string) {
    await this.stop(stationId);
    return this.start(stationId);
  }

  static async reloadAutoDj(stationId: string) {
    const configPath = await writeLiquidsoapConfig(stationId);
    await prisma.stationProcessState.update({
      where: { stationId },
      data: { lastHeartbeat: new Date() },
    });
    return { reloaded: true, configPath };
  }
}
