"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Radio,
  PlusCircle,
  Play,
  Square,
  RotateCw,
  Sliders,
  ExternalLink,
  Users,
  Music2,
  ListMusic,
  CheckCircle2,
} from "lucide-react";

interface StationItem {
  id: string;
  name: string;
  slug: string;
  genre: string;
  description: string | null;
  backendStatus: string;
  defaultFormat: string;
  defaultBitrate: number;
  portIngest: number;
  currentListeners: number;
  peakListeners: number;
  autoDjEnabled: boolean;
  processState: {
    cpuUsage: number;
    memoryMb: number;
    encoderHealth: number;
  } | null;
  _count: {
    mediaFiles: number;
    playlists: number;
    shows: number;
  };
}

export function StationsClient({ initialStations }: { initialStations: StationItem[] }) {
  const [stations, setStations] = useState<StationItem[]>(initialStations);
  const [filter, setFilter] = useState<"ALL" | "ON_AIR" | "STOPPED">("ALL");
  const [notice, setNotice] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const filtered = stations.filter((s) => {
    if (filter === "ALL") return true;
    return s.backendStatus === filter;
  });

  async function handleStationAction(stationId: string, action: "start" | "stop" | "restart") {
    setActionLoading(`${stationId}-${action}`);
    try {
      const res = await fetch(`/api/stations/${stationId}/action`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Action failed");

      setStations((prev) =>
        prev.map((s) =>
          s.id === stationId ? { ...s, backendStatus: data.station.backendStatus } : s
        )
      );
      setNotice(data.message);
      setTimeout(() => setNotice(null), 4000);
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Error executing action");
    } finally {
      setActionLoading(null);
    }
  }

  return (
    <div className="space-y-6">
      {/* Alert Notice */}
      {notice && (
        <div className="p-3 rounded bg-surface-panel border border-border-focus text-primary-container text-xs flex items-center gap-2 shadow-photonic">
          <CheckCircle2 className="w-4 h-4 text-primary-container" />
          <span className="font-mono">{notice}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border-subtle pb-4">
        <div>
          <h1 className="text-xl font-bold text-on-surface flex items-center gap-2">
            <Radio className="w-5 h-5 text-primary-container" />
            <span>Radio Stations Directory</span>
          </h1>
          <p className="text-xs text-on-surface-variant">
            Supervise active transmission nodes, AutoDJ encoders, and edge mounts
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Status Filter */}
          <div className="inline-flex p-0.5 rounded bg-surface-panel border border-border-subtle text-xs">
            {(["ALL", "ON_AIR", "STOPPED"] as const).map((st) => (
              <button
                key={st}
                onClick={() => setFilter(st)}
                className={`px-3 py-1 rounded transition-colors font-mono ${
                  filter === st
                    ? "bg-primary-container text-on-primary-container font-bold"
                    : "text-on-surface-variant hover:text-on-surface"
                }`}
              >
                {st.replace("_", " ")}
              </button>
            ))}
          </div>

          <Link
            href="/stations/create"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-primary-container hover:bg-primary text-on-primary-container font-semibold text-xs transition-all shadow-photonic"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Create Station</span>
          </Link>
        </div>
      </div>

      {/* Stations Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filtered.map((station) => {
          const isOnAir = station.backendStatus === "ON_AIR";

          return (
            <div
              key={station.id}
              className="p-5 rounded-lg bg-surface-panel border border-border-subtle hover:border-border-focus/40 transition-all space-y-4 shadow-panel"
            >
              {/* Header Info */}
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded bg-surface-container border border-border-subtle flex items-center justify-center text-primary-container">
                    <Radio className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <Link
                        href={`/stations/${station.slug}`}
                        className="text-base font-bold text-on-surface hover:text-primary-container transition-colors"
                      >
                        {station.name}
                      </Link>
                      <span className="px-1.5 py-0.2 rounded bg-surface-container-high text-primary font-mono text-[9px] font-bold">
                        PORT {station.portIngest}
                      </span>
                    </div>
                    <div className="text-xs text-on-surface-variant font-medium">
                      {station.genre}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
                  <span
                    className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded text-[10px] font-mono font-bold uppercase tracking-wider ${
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
              </div>

              {/* Description */}
              {station.description && (
                <p className="text-xs text-on-surface-variant line-clamp-2">
                  {station.description}
                </p>
              )}

              {/* Telemetry Metrics Row */}
              <div className="grid grid-cols-4 gap-2 p-2.5 rounded bg-surface-container border border-border-subtle text-xs font-mono">
                <div>
                  <span className="text-[10px] text-on-surface-variant block">Format</span>
                  <span className="text-on-surface font-semibold">
                    {station.defaultBitrate}k {station.defaultFormat.split("_")[0]}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-on-surface-variant block">Listeners</span>
                  <span className="text-primary-container font-semibold">
                    {station.currentListeners.toLocaleString()}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-on-surface-variant block">Tracks</span>
                  <span className="text-on-surface font-semibold">
                    {station._count.mediaFiles}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-on-surface-variant block">AutoDJ</span>
                  <span
                    className={`font-semibold ${
                      station.autoDjEnabled ? "text-tertiary" : "text-on-surface-variant"
                    }`}
                  >
                    {station.autoDjEnabled ? "Active" : "Manual"}
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-between pt-2 border-t border-border-subtle text-xs">
                <div className="flex items-center gap-1.5">
                  {isOnAir ? (
                    <button
                      onClick={() => handleStationAction(station.id, "stop")}
                      disabled={actionLoading !== null}
                      className="flex items-center gap-1 px-2.5 py-1 rounded bg-surface-container hover:bg-surface-elevated text-error border border-border-subtle transition-colors"
                      title="Gracefully halt stream"
                    >
                      <Square className="w-3.5 h-3.5 fill-current" />
                      <span>Stop</span>
                    </button>
                  ) : (
                    <button
                      onClick={() => handleStationAction(station.id, "start")}
                      disabled={actionLoading !== null}
                      className="flex items-center gap-1 px-2.5 py-1 rounded bg-tertiary-container text-on-tertiary font-semibold hover:bg-tertiary transition-colors shadow-photonic-green"
                    >
                      <Play className="w-3.5 h-3.5 fill-current" />
                      <span>Start Stream</span>
                    </button>
                  )}

                  <button
                    onClick={() => handleStationAction(station.id, "restart")}
                    disabled={actionLoading !== null}
                    className="p-1.5 rounded bg-surface-container hover:bg-surface-elevated text-on-surface-variant hover:text-on-surface border border-border-subtle transition-colors"
                    title="Restart Encoder Process"
                  >
                    <RotateCw className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  <Link
                    href={`/stations/${station.slug}`}
                    className="flex items-center gap-1 px-3 py-1 rounded bg-primary-container/10 hover:bg-primary-container/20 text-primary border border-primary/30 font-semibold transition-colors"
                  >
                    <span>Studio Console</span>
                    <ExternalLink className="w-3 h-3" />
                  </Link>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
