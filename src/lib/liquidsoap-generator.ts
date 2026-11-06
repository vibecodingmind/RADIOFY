/**
 * AetherCast Independent Audio Streaming Engine
 * Liquidsoap v2.x Station Configuration Generator
 */

export interface StationConfigInput {
  stationId: string;
  stationName: string;
  slug: string;
  backendPort: number;
  streamBitrate: number;
  streamFormat: "MP3" | "AAC" | "OGG" | "FLAC" | "OPUS";
  mediaDirectory: string;
  icecastHost?: string;
  icecastPort?: number;
  icecastPassword?: string;
  mounts: Array<{
    path: string;
    bitrate: number;
    format: string;
    isDefault: boolean;
  }>;
}

export function generateLiquidsoapConfig(config: StationConfigInput): string {
  const {
    stationId,
    stationName,
    slug,
    backendPort,
    streamBitrate,
    streamFormat,
    mediaDirectory,
    icecastHost = "127.0.0.1",
    icecastPort = 8010,
    icecastPassword = "hackme",
    mounts,
  } = config;

  // Determine audio encoder function based on streamFormat
  let encoder = `%mp3(bitrate=${streamBitrate}, samplerate=44100, stereo=true)`;
  if (streamFormat === "AAC") {
    encoder = `%fdkaac(bitrate=${streamBitrate}, samplerate=44100, channels=2)`;
  } else if (streamFormat === "OPUS") {
    encoder = `%opus(bitrate=${streamBitrate}, samplerate=48000, channels=2)`;
  } else if (streamFormat === "FLAC") {
    encoder = `%flac(samplerate=44100, channels=2, compression=5)`;
  } else if (streamFormat === "OGG") {
    encoder = `%vorbis(quality=0.6, samplerate=44100, channels=2)`;
  }

  const primaryMount = mounts.find((m) => m.isDefault)?.path || "/live";

  return `#!/usr/bin/env liquidsoap
# ====================================================================
# AetherCast Broadcast OS v4.2 - Dedicated Station Daemon
# Station: ${stationName} (${slug}) [ID: ${stationId}]
# Port: ${backendPort} | Primary Mount: ${primaryMount}
# Generated: ${new Date().toISOString()}
# ====================================================================

# Logging & Environment
set("log.level", 3)
set("log.stdout", true)
set("server.telnet", true)
set("server.telnet.port", ${backendPort})
set("server.telnet.bind_addr", "127.0.0.1")

# Audio Input 1: Emergency Silence Safeguard
silence_guard = blank(duration=2.0)

# Audio Input 2: Station Media Vault / AutoDJ Playlist Pool
# Scans station storage vault
autodj_source = mksafe(playlist(reload=600, "${mediaDirectory}"))

# Audio Input 3: Live DJ Harbor Ingest
# Allows resident presenters & guest DJs to stream directly via OBS / BUTT
live_harbor = input.harbor(
  "${primaryMount}",
  port = ${backendPort + 100},
  auth = fun(login, pass) -> (login == "dj" and pass != ""),
  buffer = 2.0,
  max = 10.0
)

# Priority Switching Hierarchy: Live Harbor -> AutoDJ -> Silence Guard
radio_stream = fallback(
  track_sensitive = false,
  transitions = [
    fun(a, b) -> sequence([fade.out(duration=2.0, a), fade.in(duration=1.5, b)]),
    fun(a, b) -> sequence([fade.out(duration=1.5, a), fade.in(duration=1.0, b)])
  ],
  [live_harbor, autodj_source, silence_guard]
)

# EBU R128 Loudness Normalization & Limiter DSP
radio_stream = normalize(
  target = -14.0,
  window = 0.5,
  radio_stream
)

# Smooth Crossfade Transitions
radio_stream = crossfade(
  duration = 3.5,
  smart = true,
  fade_in = 1.5,
  fade_out = 2.0,
  radio_stream
)

# Dynamic Metadata Handler
def on_metadata_update(m)
  title = m["title"]
  artist = m["artist"]
  print("NOW PLAYING [${slug}]: #{artist} - #{title}")
end
radio_stream.on_metadata(on_metadata_update)

# Output: Native High-Performance Icecast2 Distribution
${mounts
  .map(
    (m) => `
output.icecast(
  ${encoder},
  host = "${icecastHost}",
  port = ${icecastPort},
  password = "${icecastPassword}",
  mount = "${m.path}",
  name = "${stationName}",
  description = "AetherCast Independent Stream",
  url = "https://radiofy.live",
  genre = "Electronic",
  radio_stream
)
`
  )
  .join("\n")}
`;
}
