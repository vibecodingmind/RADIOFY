import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Starting Radiofy Database Seeding...");

  // 1. Clean existing records in dependency order
  await prisma.paymentTransaction.deleteMany();
  await prisma.invoice.deleteMany();
  await prisma.subscription.deleteMany();
  await prisma.subscriptionPlan.deleteMany();
  await prisma.broadcastLog.deleteMany();
  await prisma.streamListenerSession.deleteMany();
  await prisma.bandwidthRollup.deleteMany();
  await prisma.playlistItem.deleteMany();
  await prisma.playlist.deleteMany();
  await prisma.mediaFile.deleteMany();
  await prisma.mediaFolder.deleteMany();
  await prisma.stationSchedule.deleteMany();
  await prisma.show.deleteMany();
  await prisma.djAccount.deleteMany();
  await prisma.stationProcessState.deleteMany();
  await prisma.streamMount.deleteMany();
  await prisma.station.deleteMany();
  await prisma.apiKey.deleteMany();
  await prisma.webhookDeliveryLog.deleteMany();
  await prisma.webhookEndpoint.deleteMany();
  await prisma.auditLog.deleteMany();
  await prisma.organizationInvite.deleteMany();
  await prisma.organizationMember.deleteMany();
  await prisma.customRole.deleteMany();
  await prisma.session.deleteMany();
  await prisma.organization.deleteMany();
  await prisma.user.deleteMany();

  // 2. Passwords
  const superAdminPasswordHash = await bcrypt.hash("AdminPass123!", 10);
  const broadcasterPasswordHash = await bcrypt.hash("Broadcaster123!", 10);

  // 3. Create Super Admin (matching Elena Rostova from Stitch design)
  const elena = await prisma.user.create({
    data: {
      email: "elena.rostova@radiofy.com",
      name: "Elena Rostova",
      passwordHash: superAdminPasswordHash,
      role: "SUPER_ADMIN",
      avatarUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
      isEmailVerified: true,
      isActive: true,
    },
  });
  console.log(`✓ Super Admin created: ${elena.name} (${elena.email})`);

  // 4. Create Broadcaster User
  const alex = await prisma.user.create({
    data: {
      email: "alex@neonhorizon.fm",
      name: "Alex Vance",
      passwordHash: broadcasterPasswordHash,
      role: "BROADCASTER",
      avatarUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80",
      isEmailVerified: true,
      isActive: true,
    },
  });

  // 5. Create Organization
  const org = await prisma.organization.create({
    data: {
      name: "AetherWave Broadcasting Group",
      slug: "aetherwave",
      contactEmail: "contact@neonhorizon.fm",
      timezone: "UTC",
      defaultLanguage: "en",
      storageQuotaBytes: BigInt(500 * 1024 * 1024 * 1024), // 500 GB
      storageUsedBytes: BigInt(48 * 1024 * 1024 * 1024), // 48 GB
      maxStations: 10,
    },
  });

  // Assign Alex as OWNER of the Organization
  await prisma.organizationMember.create({
    data: {
      orgId: org.id,
      userId: alex.id,
      role: "OWNER",
    },
  });

  // Also assign Elena as OWNER for instant verification
  await prisma.organizationMember.create({
    data: {
      orgId: org.id,
      userId: elena.id,
      role: "OWNER",
    },
  });

  // 6. Create Subscription Plans
  const starterPlan = await prisma.subscriptionPlan.create({
    data: {
      name: "Starter Studio",
      slug: "starter-studio",
      description: "Essential broadcasting for single stations and independent creators.",
      monthlyPriceUsd: 29.0,
      annualPriceUsd: 290.0,
      maxStations: 1,
      maxConcurrentListeners: 250,
      maxStorageGb: 15,
      maxBandwidthGb: 250,
      analyticsLevel: "STANDARD",
    },
  });

  const proPlan = await prisma.subscriptionPlan.create({
    data: {
      name: "Pro Broadcaster",
      slug: "pro-broadcaster",
      description: "High-concurrency streaming, multi-operator support, and advanced AutoDJ.",
      monthlyPriceUsd: 79.0,
      annualPriceUsd: 790.0,
      maxStations: 5,
      maxConcurrentListeners: 2500,
      maxStorageGb: 100,
      maxBandwidthGb: 1500,
      multiOperatorAllowed: true,
      customRingbackAllowed: true,
      analyticsLevel: "ADVANCED",
    },
  });

  const enterprisePlan = await prisma.subscriptionPlan.create({
    data: {
      name: "AetherCast Enterprise OS",
      slug: "aethercast-enterprise",
      description: "Mission-critical 24/7 transmission, multi-node clustering, and dedicated relay edge.",
      monthlyPriceUsd: 199.0,
      annualPriceUsd: 1990.0,
      maxStations: 15,
      maxConcurrentListeners: 25000,
      maxStorageGb: 500,
      maxBandwidthGb: 10000,
      multiOperatorAllowed: true,
      customRingbackAllowed: true,
      adFreeAllowed: true,
      analyticsLevel: "REALTIME_TELEMETRY",
    },
  });

  // Active Subscription for Organization
  const sub = await prisma.subscription.create({
    data: {
      orgId: org.id,
      planId: enterprisePlan.id,
      status: "ACTIVE",
      billingCycle: "MONTHLY",
      currentPeriodStart: new Date(),
      currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      paymentGateway: "STRIPE",
      gatewaySubId: "sub_1Q0AetherWaveSimulated",
    },
  });

  // 7. Create Stations directly matching the Stitch Reference Design
  const stationNeon = await prisma.station.create({
    data: {
      orgId: org.id,
      name: "Neon Horizon FM",
      slug: "neon-horizon-fm",
      genre: "Synthwave / Cyberpunk",
      description: "Retro-futuristic beats and continuous high-definition synthwave broadcasting.",
      sourcePassword: "neon_source_secret_2026",
      adminPassword: "neon_admin_secret_2026",
      backendStatus: "ON_AIR",
      autoDjEnabled: true,
      crossfadeSec: 2.5,
      defaultBitrate: 320,
      defaultFormat: "OPUS_320",
      portIngest: 8001,
      portRelay: 8010,
      currentListeners: 18492,
      peakListeners: 24810,
    },
  });

  const stationChillout = await prisma.station.create({
    data: {
      orgId: org.id,
      name: "Aether Chillout Lounge",
      slug: "aether-chillout",
      genre: "Ambient / Downtempo",
      description: "Deep chill atmospheres curated live by resident DJs.",
      sourcePassword: "chill_source_secret_2026",
      adminPassword: "chill_admin_secret_2026",
      backendStatus: "ON_AIR",
      autoDjEnabled: false,
      crossfadeSec: 3.0,
      defaultBitrate: 256,
      defaultFormat: "AAC_256",
      portIngest: 8002,
      portRelay: 8010,
      currentListeners: 5110,
      peakListeners: 7800,
    },
  });

  const stationUnderground = await prisma.station.create({
    data: {
      orgId: org.id,
      name: "Tokyo Underground Bass",
      slug: "tokyo-underground",
      genre: "Sub-Bass / Dub Heavy",
      description: "Deep club frequencies straight from Shibuya underground sound systems.",
      sourcePassword: "tokyo_source_secret_2026",
      adminPassword: "tokyo_admin_secret_2026",
      backendStatus: "ON_AIR",
      autoDjEnabled: true,
      crossfadeSec: 2.0,
      defaultBitrate: 320,
      defaultFormat: "MP3_320",
      portIngest: 8003,
      portRelay: 8010,
      currentListeners: 3240,
      peakListeners: 4120,
    },
  });

  const stationClassical = await prisma.station.create({
    data: {
      orgId: org.id,
      name: "Classical Echoes HD",
      slug: "classical-echoes",
      genre: "Symphonic & Acoustic",
      description: "Audiophile-grade 24-bit FLAC master acoustic recordings.",
      sourcePassword: "classical_source_secret_2026",
      adminPassword: "classical_admin_secret_2026",
      backendStatus: "STOPPED",
      autoDjEnabled: false,
      crossfadeSec: 1.5,
      defaultBitrate: 320,
      defaultFormat: "FLAC_LOSSLESS",
      portIngest: 8004,
      portRelay: 8010,
      currentListeners: 722,
      peakListeners: 1200,
    },
  });

  // Add Stream Mounts
  for (const st of [stationNeon, stationChillout, stationUnderground, stationClassical]) {
    await prisma.streamMount.create({
      data: {
        stationId: st.id,
        mountPath: "/live",
        format: st.defaultFormat,
        bitrate: st.defaultBitrate,
        isDefault: true,
        isPublic: true,
        maxListeners: 25000,
        currentListeners: st.currentListeners,
      },
    });
    await prisma.streamMount.create({
      data: {
        stationId: st.id,
        mountPath: "/autodj",
        format: st.defaultFormat,
        bitrate: st.defaultBitrate,
        isDefault: false,
        isPublic: false,
        maxListeners: 5000,
        currentListeners: 0,
      },
    });
    // Process States
    await prisma.stationProcessState.create({
      data: {
        stationId: st.id,
        pid: 24000 + Math.floor(Math.random() * 5000),
        memoryMb: 142.5,
        cpuUsage: 14.2,
        bufferLatencyMs: 24.0,
        jitterMs: 0.4,
        encoderHealth: 99.99,
      },
    });
  }

  // 8. Create Media Tracks & Playlists for Neon Horizon FM
  const track1 = await prisma.mediaFile.create({
    data: {
      stationId: stationNeon.id,
      originalFilename: "cybernetic-echoes.flac",
      title: "Cybernetic Echoes",
      artist: "Neon Dreams ft. The Synthetics",
      album: "Nightwave Synthesis (2026 Remaster)",
      genre: "Synthwave",
      duration: 258.0, // 04:18
      fileSize: BigInt(12582912),
      storageKey: "tracks/neon-dreams-cybernetic-echoes.flac",
      artworkUrl: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=300&auto=format&fit=crop&q=80",
      lufs: -14.2,
      cueInSec: 0.0,
      cueOutSec: 258.0,
    },
  });

  const track2 = await prisma.mediaFile.create({
    data: {
      stationId: stationNeon.id,
      originalFilename: "starlight-expressway.mp3",
      title: "Starlight Expressway",
      artist: "Kavinsky Resonance",
      album: "Outrun Midnight",
      genre: "Darksynth",
      duration: 215.0, // 03:35
      fileSize: BigInt(9829120),
      storageKey: "tracks/starlight-expressway.mp3",
      artworkUrl: "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=300&auto=format&fit=crop&q=80",
      lufs: -13.8,
    },
  });

  const playlist = await prisma.playlist.create({
    data: {
      stationId: stationNeon.id,
      name: "Prime Time Rotation (Deck A)",
      type: "ROTATION",
      weight: 10,
      isActive: true,
      playMode: "SHUFFLE",
    },
  });

  await prisma.playlistItem.create({
    data: {
      playlistId: playlist.id,
      mediaFileId: track1.id,
      order: 1,
      cueFadeSec: 2.5,
    },
  });

  await prisma.playlistItem.create({
    data: {
      playlistId: playlist.id,
      mediaFileId: track2.id,
      order: 2,
      cueFadeSec: 2.5,
    },
  });

  // Current Broadcast Log
  await prisma.broadcastLog.create({
    data: {
      stationId: stationNeon.id,
      mediaFileId: track1.id,
      trackTitle: track1.title,
      artist: track1.artist,
      album: track1.album,
      startedAt: new Date(Date.now() - 164 * 1000), // 02:44 into song
      durationSeconds: 258.0,
      listenersPeak: 18492,
    },
  });

  // Shows & Schedules
  await prisma.stationSchedule.create({
    data: {
      stationId: stationNeon.id,
      title: "Tokyo Midnight Grooves",
      dayOfWeek: new Date().getDay(),
      startTime: "15:00",
      endTime: "17:00",
      isRecurring: true,
    },
  });

  await prisma.stationSchedule.create({
    data: {
      stationId: stationNeon.id,
      title: "Deep Space Ambient Chronicles",
      dayOfWeek: new Date().getDay(),
      startTime: "17:00",
      endTime: "19:00",
      isRecurring: true,
    },
  });

  await prisma.stationSchedule.create({
    data: {
      stationId: stationNeon.id,
      title: "Global Guest Mix: Sarah Jenkins",
      dayOfWeek: new Date().getDay(),
      startTime: "21:00",
      endTime: "23:00",
      isRecurring: true,
    },
  });

  console.log("✅ Radiofy database seeded successfully!");
}

main()
  .catch((e) => {
    console.error("❌ Seed error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
