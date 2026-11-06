"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Radio,
  Play,
  Square,
  RotateCw,
  Copy,
  Check,
  Eye,
  EyeOff,
  Cpu,
  Activity,
  Layers,
  Settings,
  Shield,
  Trash2,
  CheckCircle2,
  Save,
  Sliders,
  ExternalLink,
} from "lucide-react";

interface MountItem {
  id: string;
  mountPath: string;
  format: string;
  bitrate: number;
  isDefault: boolean;
  isPublic: boolean;
  maxListeners: number;
  currentListeners: number;
}

interface StationDetails {
  id: string;
  name: string;
  slug: string;
  genre: string;
  description: string | null;
  streamKey: string;
  sourcePassword: string;
  adminPassword: string;
  backendStatus: string;
  defaultBitrate: number;
  defaultFormat: string;
  portIngest: number;
  portRelay: number;
  autoDjEnabled: boolean;
  crossfadeSec: number;
  currentListeners: number;
  peakListeners: number;
  mounts: MountItem[];
  processState: {
    pid: number | null;
    memoryMb: number;
    cpuUsage: number;
    bufferLatencyMs: number;
    jitterMs: number;
    encoderHealth: number;
  } | null;
  _count: {
    mediaFiles: number;
    playlists: number;
    shows: number;
  };
}

export function StationStudioClient({ station: initialStation }: { station: StationDetails }) {
  const router = useRouter();
  const [station, setStation] = useState<StationDetails>(initialStation);
  const [showSourcePass, setShowSourcePass] = useState(false);
  const [showAdminPass, setShowAdminPass] = useState(false);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [loadingAction, setLoadingAction] = useState(false);
  const [savingSettings, setSavingSettings] = useState(false);

  // Editable settings form
  const [name, setName] = useState(station.name);
  const [genre, setGenre] = useState(station.genre);
  const [description, setDescription] = useState(station.description || "");
  const [crossfadeSec, setCrossfadeSec] = useState(station.crossfadeSec);
  const [autoDjEnabled, setAutoDjEnabled] = useState(station.autoDjEnabled);

  function copyText(key: string, text: string) {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2500);
  }

  async function handleAction(action: "start" | "stop" | "restart" | "reload_autodj") {
    setLoadingAction(true);
    try {
      const res = await fetch(`/api/stations/${station.id}/action`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Action failed");

      setStation((prev) => ({
        ...prev,
        backendStatus: data.station.backendStatus,
      }));
      setNotice(data.message);
      setTimeout(() => setNotice(null), 4000);
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Error executing action");
    } finally {
      setLoadingAction(false);
    }
  }

  async function handleSaveSettings(e: React.FormEvent) {
    e.preventDefault();
    setSavingSettings(true);
    try {
      const res = await fetch(`/api/stations/${station.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          genre,
          description,
          crossfadeSec,
          autoDjEnabled,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to save settings");

      setStation((prev) => ({
        ...prev,
        name: data.station.name,
        genre: data.station.genre,
        description: data.station.description,
        crossfadeSec: data.station.crossfadeSec,
        autoDjEnabled: data.station.autoDjEnabled,
      }));
      setNotice("Station parameters updated and reloaded in broadcast engine");
      setTimeout(() => setNotice(null), 4000);
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Error updating settings");
    } finally {
      setSavingSettings(false);
    }
  }

  async function handleDeleteStation() {
    if (!confirm(`Are you sure you want to permanently delete "${station.name}"? This action cannot be undone.`)) {
      return;
    }

    try {
      const res = await fetch(`/api/stations/${station.id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to delete station");
      router.push("/stations");
      router.refresh();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Error deleting station");
    }
  }

  const isOnAir = station.backendStatus === "ON_AIR";
  const streamHost = typeof window !== "undefined" ? window.location.hostname : "localhost";

  return (
    <div className="space-y-6">
      {notice && (
        <div className="p-3 rounded bg-surface-panel border border-border-focus text-primary-container text-xs flex items-center gap-2 shadow-photonic">
          <CheckCircle2 className="w-4 h-4 text-primary-container" />
          <span className="font-mono">{notice}</span>
        </div>
      )}

      {/* Station Header & Control Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-border-subtle pb-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded bg-primary-container/20 border border-primary-container/40 flex items-center justify-center text-primary-container">
            <Radio className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-on-surface">{station.name}</h1>
              <span
                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase ${
                  isOnAir
                    ? "bg-tertiary-container/20 text-tertiary border border-tertiary/30"
                    : "bg-surface-container text-on-surface-variant border border-border-subtle"
                }`}
              >
                <span
                  className={`w-1.5 h-1.5 rounded-full ${
                    isOnAir ? "bg-tertiary-container animate-pulse" : "bg-on-surface-variant"
                  }`}
                />
                <span>{station.backendStatus.replace("_", " ")}</span>
              </span>
            </div>
            <div className="flex items-center gap-2 text-xs text-on-surface-variant font-mono">
              <span>{station.genre}</span>
              <span>•</span>
              <span>{station.defaultBitrate}kbps {station.defaultFormat.split("_")[0]}</span>
              <span>•</span>
              <span>Ingest Port {station.portIngest}</span>
            </div>
          </div>
        </div>

        {/* Lifecycle Actions */}
        <div className="flex items-center gap-2">
          {isOnAir ? (
            <button
              onClick={() => handleAction("stop")}
              disabled={loadingAction}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-surface-container hover:bg-surface-elevated text-error border border-border-subtle text-xs font-semibold transition-colors"
            >
              <Square className="w-3.5 h-3.5 fill-current" />
              <span>Halt Stream</span>
            </button>
          ) : (
            <button
              onClick={() => handleAction("start")}
              disabled={loadingAction}
              className="flex items-center gap-1.5 px-4 py-1.5 rounded bg-tertiary-container hover:bg-tertiary text-on-tertiary text-xs font-bold transition-all shadow-photonic-green"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>Start Transmission</span>
            </button>
          )}

          <button
            onClick={() => handleAction("restart")}
            disabled={loadingAction}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-surface-container hover:bg-surface-elevated text-on-surface-variant hover:text-on-surface border border-border-subtle text-xs transition-colors"
            title="Restart encoder daemon"
          >
            <RotateCw className="w-3.5 h-3.5" />
            <span>Restart</span>
          </button>

          <a
            href={`/player/${station.slug}`}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-primary-container text-on-primary-container hover:bg-primary text-xs font-semibold transition-all shadow-photonic"
          >
            <span>Live Player</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>

      {/* Grid: Left Technical Credentials & Mounts vs Right Configuration */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column (7 Cols): Live Encoder Credentials & Process Health */}
        <div className="lg:col-span-7 space-y-5">
          {/* Live Ingest Connection Credentials (OBS / BUTT / Mixxx) */}
          <div className="p-5 rounded-lg bg-surface-panel border border-border-subtle space-y-4 shadow-panel">
            <div className="flex items-center justify-between border-b border-border-subtle pb-2">
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-primary-container" />
                <h2 className="text-xs font-bold text-on-surface uppercase tracking-wider">
                  Live Source Encoder Credentials (Harbor / OBS / BUTT)
                </h2>
              </div>
              <span className="text-[10px] font-mono text-tertiary font-bold">
                ICECAST2 PROTOCOL
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs font-mono">
              <div className="p-2.5 rounded bg-surface-container border border-border-subtle">
                <span className="text-[10px] text-on-surface-variant block mb-1">Server Host</span>
                <div className="flex items-center justify-between">
                  <span className="text-on-surface font-semibold">{streamHost}</span>
                  <button
                    onClick={() => copyText("host", streamHost)}
                    className="text-on-surface-variant hover:text-on-surface"
                  >
                    {copiedKey === "host" ? <Check className="w-3.5 h-3.5 text-tertiary" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              <div className="p-2.5 rounded bg-surface-container border border-border-subtle">
                <span className="text-[10px] text-on-surface-variant block mb-1">Ingest Port</span>
                <div className="flex items-center justify-between">
                  <span className="text-primary-container font-semibold">{station.portIngest}</span>
                  <button
                    onClick={() => copyText("port", station.portIngest.toString())}
                    className="text-on-surface-variant hover:text-on-surface"
                  >
                    {copiedKey === "port" ? <Check className="w-3.5 h-3.5 text-tertiary" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              <div className="p-2.5 rounded bg-surface-container border border-border-subtle">
                <span className="text-[10px] text-on-surface-variant block mb-1">Mount Point</span>
                <div className="flex items-center justify-between">
                  <span className="text-on-surface font-semibold">/live</span>
                  <button
                    onClick={() => copyText("mount", "/live")}
                    className="text-on-surface-variant hover:text-on-surface"
                  >
                    {copiedKey === "mount" ? <Check className="w-3.5 h-3.5 text-tertiary" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              <div className="p-2.5 rounded bg-surface-container border border-border-subtle">
                <span className="text-[10px] text-on-surface-variant block mb-1">Source User</span>
                <div className="flex items-center justify-between">
                  <span className="text-on-surface font-semibold">source</span>
                  <button
                    onClick={() => copyText("user", "source")}
                    className="text-on-surface-variant hover:text-on-surface"
                  >
                    {copiedKey === "user" ? <Check className="w-3.5 h-3.5 text-tertiary" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              <div className="sm:col-span-2 p-2.5 rounded bg-surface-container border border-border-subtle">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] text-on-surface-variant">Live Source Password</span>
                  <button
                    onClick={() => setShowSourcePass(!showSourcePass)}
                    className="text-[10px] text-on-surface-variant hover:text-on-surface flex items-center gap-1"
                  >
                    {showSourcePass ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                    <span>{showSourcePass ? "Hide" : "Show"}</span>
                  </button>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-on-surface font-semibold">
                    {showSourcePass ? station.sourcePassword : "••••••••••••••••••••"}
                  </span>
                  <button
                    onClick={() => copyText("pass", station.sourcePassword)}
                    className="text-on-surface-variant hover:text-on-surface"
                  >
                    {copiedKey === "pass" ? <Check className="w-3.5 h-3.5 text-tertiary" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Mount Points Configuration Table */}
          <div className="p-5 rounded-lg bg-surface-panel border border-border-subtle space-y-3 shadow-panel">
            <div className="flex items-center justify-between border-b border-border-subtle pb-2">
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-primary-container" />
                <h2 className="text-xs font-bold text-on-surface uppercase tracking-wider">
                  Active Audio Mountpoints
                </h2>
              </div>
              <span className="text-xs font-mono text-on-surface-variant">
                {station.mounts.length} Mounts Bound
              </span>
            </div>

            <div className="divide-y divide-border-subtle/50 text-xs font-mono">
              {station.mounts.map((mount) => (
                <div key={mount.id} className="py-2.5 flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-on-surface">{mount.mountPath}</span>
                      {mount.isDefault && (
                        <span className="px-1.5 py-0.2 rounded bg-primary-container/20 text-primary-container text-[9px] font-bold">
                          DEFAULT
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] text-on-surface-variant">
                      {mount.bitrate}kbps {mount.format.split("_")[0]} • Limit: {mount.maxListeners}
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="text-tertiary font-bold">{mount.currentListeners}</span>
                    <span className="text-[10px] text-on-surface-variant ml-1">listeners</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Process Health & Telemetry */}
          {station.processState && (
            <div className="p-5 rounded-lg bg-surface-panel border border-border-subtle space-y-3 shadow-panel">
              <div className="flex items-center justify-between border-b border-border-subtle pb-2">
                <div className="flex items-center gap-2">
                  <Cpu className="w-4 h-4 text-tertiary-container" />
                  <h2 className="text-xs font-bold text-on-surface uppercase tracking-wider">
                    Node Process Health & Telemetry
                  </h2>
                </div>
                <span className="text-[10px] font-mono text-tertiary font-bold">
                  HEALTH {station.processState.encoderHealth}%
                </span>
              </div>

              <div className="grid grid-cols-4 gap-2 text-xs font-mono">
                <div className="p-2 rounded bg-surface-container border border-border-subtle">
                  <span className="text-[10px] text-on-surface-variant block">PID</span>
                  <span className="text-on-surface font-semibold">{station.processState.pid || "Active"}</span>
                </div>
                <div className="p-2 rounded bg-surface-container border border-border-subtle">
                  <span className="text-[10px] text-on-surface-variant block">RAM Used</span>
                  <span className="text-on-surface font-semibold">{station.processState.memoryMb.toFixed(1)} MB</span>
                </div>
                <div className="p-2 rounded bg-surface-container border border-border-subtle">
                  <span className="text-[10px] text-on-surface-variant block">CPU Load</span>
                  <span className="text-tertiary font-semibold">{station.processState.cpuUsage.toFixed(1)}%</span>
                </div>
                <div className="p-2 rounded bg-surface-container border border-border-subtle">
                  <span className="text-[10px] text-on-surface-variant block">Buffer Latency</span>
                  <span className="text-primary-container font-semibold">{station.processState.bufferLatencyMs}ms</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right Column (5 Cols): Station Configuration & Settings */}
        <div className="lg:col-span-5 space-y-5">
          <div className="p-5 rounded-lg bg-surface-panel border border-border-subtle space-y-4 shadow-panel">
            <div className="flex items-center gap-2 border-b border-border-subtle pb-2">
              <Settings className="w-4 h-4 text-primary-container" />
              <h2 className="text-xs font-bold text-on-surface uppercase tracking-wider">
                Operational Parameters
              </h2>
            </div>

            <form onSubmit={handleSaveSettings} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-on-surface-variant uppercase tracking-wider mb-1">
                  Station Name
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-1.5 rounded bg-surface-container border border-border-subtle text-xs text-on-surface focus:outline-none focus:border-border-focus"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-on-surface-variant uppercase tracking-wider mb-1">
                  Primary Genre
                </label>
                <input
                  type="text"
                  value={genre}
                  onChange={(e) => setGenre(e.target.value)}
                  className="w-full px-3 py-1.5 rounded bg-surface-container border border-border-subtle text-xs text-on-surface focus:outline-none focus:border-border-focus"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-on-surface-variant uppercase tracking-wider mb-1">
                  Description
                </label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3 py-1.5 rounded bg-surface-container border border-border-subtle text-xs text-on-surface focus:outline-none focus:border-border-focus resize-none"
                />
              </div>

              <div className="flex items-center justify-between p-2.5 rounded bg-surface-container border border-border-subtle">
                <span className="text-xs font-semibold text-on-surface">AutoDJ Engine</span>
                <input
                  type="checkbox"
                  checked={autoDjEnabled}
                  onChange={(e) => setAutoDjEnabled(e.target.checked)}
                  className="w-4 h-4 accent-primary-container cursor-pointer"
                />
              </div>

              <div>
                <div className="flex items-center justify-between text-xs font-mono mb-1">
                  <span className="text-on-surface-variant uppercase">Crossfade Duration:</span>
                  <span className="text-primary-container font-bold">{crossfadeSec.toFixed(1)}s</span>
                </div>
                <input
                  type="range"
                  min={0.5}
                  max={6.0}
                  step={0.5}
                  value={crossfadeSec}
                  onChange={(e) => setCrossfadeSec(parseFloat(e.target.value))}
                  className="w-full accent-primary-container h-1 bg-surface-container rounded-lg cursor-pointer"
                />
              </div>

              <button
                type="submit"
                disabled={savingSettings}
                className="w-full flex items-center justify-center gap-1.5 py-2 px-3 rounded bg-primary-container hover:bg-primary text-on-primary-container font-semibold text-xs transition-all shadow-photonic disabled:opacity-50"
              >
                <Save className="w-3.5 h-3.5" />
                <span>{savingSettings ? "Saving Settings..." : "Save Station Parameters"}</span>
              </button>
            </form>
          </div>

          {/* Danger Zone */}
          <div className="p-4 rounded-lg bg-surface-panel border border-error/30 space-y-3">
            <h3 className="text-xs font-bold text-error uppercase tracking-wider">
              Danger Zone
            </h3>
            <p className="text-[11px] text-on-surface-variant">
              Deleting a station immediately unbinds stream mountpoints and drops connected listeners.
            </p>
            <button
              onClick={handleDeleteStation}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-error-container/20 hover:bg-error-container/40 text-error border border-error/40 text-xs font-semibold transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Delete Station</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
