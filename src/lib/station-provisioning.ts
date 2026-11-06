import { prisma } from "./prisma";
import { StreamAudioFormat, StationStatus } from "@prisma/client";
import crypto from "crypto";

export interface CreateStationInput {
  orgId: string;
  name: string;
  description?: string;
  genre?: string;
  defaultBitrate?: number;
  defaultFormat?: StreamAudioFormat;
  crossfadeSec?: number;
  autoDjEnabled?: boolean;
}

export class StationProvisioningService {
  /**
   * Finds the next unused ingest port starting at base port 8001
   */
  static async allocateNextPort(): Promise<number> {
    const stations = await prisma.station.findMany({
      select: { portIngest: true },
      orderBy: { portIngest: "desc" },
    });

    if (stations.length === 0) return 8001;
    const maxPort = Math.max(...stations.map((s) => s.portIngest));
    return maxPort + 1;
  }

  /**
   * Generates a unique, URL-safe slug for the station
   */
  static async generateUniqueSlug(name: string): Promise<string> {
    const baseSlug = name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");

    let slug = baseSlug || "station";
    let counter = 1;

    while (await prisma.station.findUnique({ where: { slug } })) {
      slug = `${baseSlug}-${counter++}`;
    }

    return slug;
  }

  /**
   * Provisions a brand new radio station with mounts and process supervision state
   */
  static async provisionStation(input: CreateStationInput) {
    const org = await prisma.organization.findUnique({
      where: { id: input.orgId },
      include: { stations: true },
    });

    if (!org) throw new Error("Organization not found");

    if (org.stations.length >= org.maxStations) {
      throw new Error(
        `Organization station limit reached (${org.maxStations} max). Please upgrade your plan to provision additional stations.`
      );
    }

    const portIngest = await this.allocateNextPort();
    const slug = await this.generateUniqueSlug(input.name);
    const streamKey = `rf_sk_${crypto.randomBytes(16).toString("hex")}`;
    const sourcePassword = crypto.randomBytes(12).toString("base64url");
    const adminPassword = crypto.randomBytes(12).toString("base64url");

    const defaultFormat = input.defaultFormat || StreamAudioFormat.OPUS_320;
    const defaultBitrate = input.defaultBitrate || 320;

    return await prisma.$transaction(async (tx) => {
      const station = await tx.station.create({
        data: {
          orgId: input.orgId,
          name: input.name,
          slug,
          description: input.description,
          genre: input.genre || "Variety",
          streamKey,
          sourcePassword,
          adminPassword,
          backendStatus: StationStatus.ON_AIR,
          autoDjEnabled: input.autoDjEnabled ?? true,
          crossfadeSec: input.crossfadeSec ?? 2.5,
          defaultBitrate,
          defaultFormat,
          portIngest,
          portRelay: 8010,
          currentListeners: 0,
          peakListeners: 0,
        },
      });

      // Create primary mounts
      await tx.streamMount.createMany({
        data: [
          {
            stationId: station.id,
            mountPath: "/live",
            format: defaultFormat,
            bitrate: defaultBitrate,
            isDefault: true,
            isPublic: true,
            maxListeners: 1000,
          },
          {
            stationId: station.id,
            mountPath: "/autodj",
            format: defaultFormat,
            bitrate: defaultBitrate,
            isDefault: false,
            isPublic: false,
            maxListeners: 500,
          },
        ],
      });

      // Initialize station process state
      await tx.stationProcessState.create({
        data: {
          stationId: station.id,
          pid: Math.floor(10000 + Math.random() * 89999),
          memoryMb: 95.0,
          cpuUsage: 8.5,
          bufferLatencyMs: 20.0,
          jitterMs: 0.2,
          encoderHealth: 100.0,
        },
      });

      return station;
    });
  }
}
