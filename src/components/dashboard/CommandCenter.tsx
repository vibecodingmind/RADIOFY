"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Radio,
  PlusCircle,
  Upload,
  Bot,
  Activity,
  Headphones,
  TrendingUp,
  Clock,
  Wifi,
  Sliders,
  Play,
  SkipForward,
  FastForward,
  MicOff,
  BellRing,
  ExternalLink,
  ChevronDown,
} from "lucide-react";

interface StationData {
  id: string;
  name: string;
  tag?: string;
  status: "ON-AIR" | "STANDBY" | "OFFLINE";
  subStatus?: string;
  listeners: number;
  format: string;
  bitrate: number;
  currentShow: string;
  vuLevel: number;
}

export function CommandCenter() {
  const [timeRange, setTimeRange] = useState<"Live" | "1h" | "24h" | "7d" | "30d">("Live");
  const [activeCluster, setActiveCluster] = useState<"Global" | "NA-East" | "EU-Central" | "AP-Tokyo">("Global");
  const [vuMeterAnim, setVuMeterAnim] = useState<number[]>([70, 55, 85, 0]);
  const [isPlayingDeck, setIsPlayingDeck] = useState(true);
  const [deckProgress, setDeckProgress] = useState(164); // 02:44 in seconds
  const [deckDuration] = useState(258); // 04:18
  const [autoDjMenuOpen, setAutoDjMenuOpen] = useState(false);
  const [isCrossfading, setIsCrossfading] = useState(false);
  const [alertNotice, setAlertNotice] = useState<string | null>(null);

  // Animate VU meters and track progress in real-time
  useEffect(() => {
    const interval = setInterval(() => {
      setVuMeterAnim([
        Math.min(95, Math.max(30, 70 + Math.floor(Math.random() * 20 - 10))),
        Math.min(90, Math.max(25, 55 + Math.floor(Math.random() * 20 - 10))),
        Math.min(100, Math.max(40, 85 + Math.floor(Math.random() * 15 - 8))),
        0,
      ]);

      setDeckProgress((prev) => (prev >= deckDuration ? 0 : prev + 1));
    }, 1000);

    return () => clearInterval(interval);
  }, [deckDuration]);

  function formatTime(seconds: number) {
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  }

  function handleCrossfade() {
    setIsCrossfading(true);
    setAlertNotice("Triggered manual crossfade on Flagship Deck A -> Deck B (Duration: 2.5s)");
    setTimeout(() => {
      setIsCrossfading(false);
      setTimeout(() => setAlertNotice(null), 4000);
    }, 2500);
  }

  function handleSkip() {
    setDeckProgress(0);
    setAlertNotice("Force skipped to next queue stem: Starlight Expressway");
    setTimeout(() => setAlertNotice(null), 3500);
  }

  function handleInsertId() {
    setAlertNotice("Top of Hour Station Legal ID Jingle cued into active playback buffer");
    setTimeout(() => setAlertNotice(null), 3500);
  }

  return (
    <div className="w-full space-y-6 pb-20">
      {/* Dynamic Alert Banner */}
      {alertNotice && (
        <div className="p-3 rounded bg-surface-panel border border-border-focus text-primary-container text-xs flex items-center justify-between shadow-photonic animate-fade-in">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-primary-container animate-ping" />
            <span className="font-mono">{alertNotice}</span>
          </div>
          <button
            onClick={() => setAlertNotice(null)}
            className="text-on-surface-variant hover:text-on-surface text-xs font-mono"
          >
            DISMISS
          </button>
        </div>
      )}

      {/* Page Header & Action Controls */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 pb-1">
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight text-on-surface">
              Broadcast Command Center
            </h1>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-surface-container-high border border-border-subtle">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-tertiary-container opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-tertiary-container"></span>
              </span>
              <span className="text-[10px] font-mono font-bold text-tertiary uppercase tracking-wider">
                ON AIR • 4 STATIONS SYNCHRONIZED
              </span>
            </div>
          </div>
          <p className="text-xs text-on-surface-variant max-w-3xl">
            Global transmission health, AutoDJ cue automation, and real-time listener telemetry
            across 14 edge relay clusters.
          </p>
        </div>

        {/* Action Button Cluster & Time Range Toggle */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Time Range Toggle */}
          <div className="inline-flex p-0.5 rounded bg-surface-panel border border-border-subtle">
            {(["Live", "1h", "24h", "7d", "30d"] as const).map((r) => (
              <button
                key={r}
                onClick={() => setTimeRange(r)}
                className={`px-2.5 py-1 rounded text-xs font-mono transition-all ${
                  timeRange === r
                    ? "bg-primary-container text-on-primary-container font-bold shadow-photonic"
                    : "text-on-surface-variant hover:text-on-surface"
                }`}
              >
                {r}
              </button>
            ))}
          </div>

          {/* AutoDJ Actions Dropdown */}
          <div className="relative">
            <button
              onClick={() => setAutoDjMenuOpen(!autoDjMenuOpen)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-surface-panel hover:bg-surface-elevated text-on-surface text-xs border border-border-subtle transition-colors"
            >
              <Bot className="w-3.5 h-3.5 text-primary-container" />
              <span>AutoDJ Actions</span>
              <ChevronDown className="w-3.5 h-3.5 text-on-surface-variant" />
            </button>

            {autoDjMenuOpen && (
              <div className="absolute right-0 mt-1 w-52 rounded bg-surface-elevated border border-border-subtle shadow-panel p-1.5 space-y-1 z-50 text-xs">
                <button
                  onClick={() => {
                    handleInsertId();
                    setAutoDjMenuOpen(false);
                  }}
                  className="w-full text-left px-2 py-1.5 rounded hover:bg-surface-container"
                >
                  Insert Station ID Jingle
                </button>
                <button
                  onClick={() => {
                    handleCrossfade();
                    setAutoDjMenuOpen(false);
                  }}
                  className="w-full text-left px-2 py-1.5 rounded hover:bg-surface-container"
                >
                  Force Immediate Crossfade
                </button>
                <button
                  onClick={() => {
                    setAlertNotice("Re-indexed playlist rotations across all 4 stations");
                    setAutoDjMenuOpen(false);
                  }}
                  className="w-full text-left px-2 py-1.5 rounded hover:bg-surface-container"
                >
                  Re-sync Rotation Queues
                </button>
              </div>
            )}
          </div>

          {/* Quick Upload */}
          <Link
            href="/media"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-surface-panel hover:bg-surface-elevated text-on-surface text-xs border border-border-subtle transition-colors"
          >
            <Upload className="w-3.5 h-3.5 text-secondary" />
            <span>Quick Upload</span>
          </Link>

          {/* Create Station Primary CTA */}
          <Link
            href="/stations/create"
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded bg-primary-container hover:bg-primary text-on-primary-container font-semibold text-xs transition-all shadow-photonic"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Create Station</span>
          </Link>
        </div>
      </div>

      {/* 6 Key Broadcaster Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3">
        {/* Card 1 */}
        <div className="p-3.5 rounded bg-surface-panel border border-border-subtle flex flex-col justify-between group">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-semibold text-on-surface-variant uppercase tracking-wider">
              Stations Online
            </span>
            <Radio className="w-4 h-4 text-primary" />
          </div>
          <div className="my-2">
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl font-bold text-on-surface tabular-metrics">4</span>
              <span className="font-mono text-xs text-on-surface-variant">/ 5 nodes</span>
            </div>
          </div>
          <div className="flex items-center justify-between font-mono text-[11px]">
            <span className="text-tertiary flex items-center gap-1 font-semibold">
              <span className="h-1.5 w-1.5 rounded-full bg-tertiary-container inline-block"></span>
              100% Uptime
            </span>
            <span className="text-on-surface-variant">1 Provisioned</span>
          </div>
        </div>

        {/* Card 2 */}
        <div className="p-3.5 rounded bg-surface-panel border border-border-subtle flex flex-col justify-between group">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-semibold text-on-surface-variant uppercase tracking-wider">
              Live Listeners
            </span>
            <Activity className="w-4 h-4 text-primary-container" />
          </div>
          <div className="my-2">
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl font-bold text-on-surface tabular-metrics">18,492</span>
            </div>
          </div>
          <div className="flex items-center font-mono text-[11px] text-tertiary">
            <span>+14.2% vs. 24h avg</span>
          </div>
        </div>

        {/* Card 3 */}
        <div className="p-3.5 rounded bg-surface-panel border border-border-subtle flex flex-col justify-between group">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-semibold text-on-surface-variant uppercase tracking-wider">
              Peak Concurrent
            </span>
            <TrendingUp className="w-4 h-4 text-secondary" />
          </div>
          <div className="my-2">
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl font-bold text-on-surface tabular-metrics">24,810</span>
            </div>
          </div>
          <div className="flex items-center justify-between font-mono text-[11px] text-on-surface-variant">
            <span>21:40 UTC</span>
            <span className="text-secondary">Sunset Set</span>
          </div>
        </div>

        {/* Card 4 */}
        <div className="p-3.5 rounded bg-surface-panel border border-border-subtle flex flex-col justify-between group">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-semibold text-on-surface-variant uppercase tracking-wider">
              Monthly TLH
            </span>
            <Clock className="w-4 h-4 text-vu-warning-amber" />
          </div>
          <div className="my-2">
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl font-bold text-on-surface tabular-metrics">412.8k</span>
              <span className="font-mono text-xs text-on-surface-variant">hrs</span>
            </div>
          </div>
          <div className="flex items-center justify-between font-mono text-[11px]">
            <div className="w-full bg-surface-container rounded-full h-1.5 mr-2">
              <div className="bg-vu-warning-amber h-1.5 rounded-full w-[91%]" />
            </div>
            <span className="text-on-surface-variant whitespace-nowrap">91.4%</span>
          </div>
        </div>

        {/* Card 5 */}
        <div className="p-3.5 rounded bg-surface-panel border border-border-subtle flex flex-col justify-between group">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-semibold text-on-surface-variant uppercase tracking-wider">
              Stream Bandwidth
            </span>
            <Wifi className="w-4 h-4 text-primary-container" />
          </div>
          <div className="my-2">
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl font-bold text-on-surface tabular-metrics">4.82</span>
              <span className="font-mono text-xs text-on-surface-variant">Gbps</span>
            </div>
          </div>
          <div className="flex items-center justify-between font-mono text-[11px] text-on-surface-variant">
            <span>Peak: 6.1 Gbps</span>
            <span className="text-tertiary">99.99%</span>
          </div>
        </div>

        {/* Card 6 */}
        <div className="p-3.5 rounded bg-surface-panel border border-border-subtle flex flex-col justify-between group">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-semibold text-on-surface-variant uppercase tracking-wider">
              Encoder Health
            </span>
            <Sliders className="w-4 h-4 text-tertiary-container" />
          </div>
          <div className="my-2">
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl font-bold text-on-surface tabular-metrics">320</span>
              <span className="font-mono text-xs text-on-surface-variant">k Opus</span>
            </div>
          </div>
          <div className="flex items-center justify-between font-mono text-[11px] text-on-surface-variant">
            <span>Buf: 1.2s</span>
            <span className="text-primary-container">Jlt: 0.4ms</span>
          </div>
        </div>
      </div>

      {/* Main Grid: Left Telemetry & Matrix vs Right Master Studio Decks */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left Column (8 cols): Telemetry Graph & Synchronized Transmitter Matrix */}
        <div className="lg:col-span-8 space-y-5">
          {/* Transmission Traffic Telemetry Graph Panel */}
          <div className="p-4 rounded bg-surface-panel border border-border-subtle space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border-subtle/60 pb-3">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-sm font-semibold text-on-surface">
                    Transmission Traffic Telemetry
                  </h2>
                  <span className="px-1.5 py-0.5 rounded bg-surface-container text-[10px] font-mono text-primary-container">
                    SYNCHRONOUS 100Hz
                  </span>
                </div>
                <p className="text-xs text-on-surface-variant">
                  Live concurrency curves versus outbound edge throughput (24h Window)
                </p>
              </div>

              {/* Edge Cluster Selector */}
              <div className="flex items-center gap-1 p-0.5 rounded bg-surface-container border border-border-subtle text-[11px] font-mono">
                <span className="text-on-surface-variant px-1.5">CLUSTER</span>
                {(["Global", "NA-East", "EU-Central", "AP-Tokyo"] as const).map((c) => (
                  <button
                    key={c}
                    onClick={() => setActiveCluster(c)}
                    className={`px-2 py-0.5 rounded transition-colors ${
                      activeCluster === c
                        ? "bg-surface-elevated text-primary font-semibold"
                        : "text-on-surface-variant hover:text-on-surface"
                    }`}
                  >
                    {c}
                  </button>
                ))}
              </div>
            </div>

            {/* SVG Telemetry Curve */}
            <div className="relative h-56 w-full pt-2">
              <div className="flex items-center justify-between text-[11px] font-mono text-on-surface-variant mb-2">
                <div className="flex items-center gap-4">
                  <span className="flex items-center gap-1.5 text-primary-container">
                    <span className="w-2.5 h-2.5 rounded-full bg-primary-container" />
                    Concurrent Listeners: 18,492
                  </span>
                  <span className="flex items-center gap-1.5 text-secondary">
                    <span className="w-2.5 h-2.5 rounded-full bg-secondary" />
                    Edge Throughput: 4.82 Gbps
                  </span>
                </div>
                <span className="text-on-surface-variant">HLS CHUNK: 2.0S</span>
              </div>

              {/* SVG Graphic with dynamic wave curves */}
              <svg className="w-full h-44 overflow-visible" viewBox="0 0 800 160">
                <defs>
                  <linearGradient id="cyanGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#00E5FF" stopOpacity="0.35" />
                    <stop offset="100%" stopColor="#00E5FF" stopOpacity="0.0" />
                  </linearGradient>
                  <linearGradient id="purpleGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#dbb8ff" stopOpacity="0.25" />
                    <stop offset="100%" stopColor="#dbb8ff" stopOpacity="0.0" />
                  </linearGradient>
                </defs>

                {/* Horizontal Guide Grid Lines */}
                <line x1="0" y1="30" x2="800" y2="30" stroke="rgba(255,255,255,0.05)" />
                <line x1="0" y1="70" x2="800" y2="70" stroke="rgba(255,255,255,0.05)" />
                <line x1="0" y1="110" x2="800" y2="110" stroke="rgba(255,255,255,0.05)" />

                {/* Listener Curve Fill & Line */}
                <path
                  d="M 0 110 Q 150 140 280 110 T 520 80 Q 640 20 720 40 T 800 70 L 800 160 L 0 160 Z"
                  fill="url(#cyanGradient)"
                />
                <path
                  d="M 0 110 Q 150 140 280 110 T 520 80 Q 640 20 720 40 T 800 70"
                  fill="none"
                  stroke="#00E5FF"
                  strokeWidth="2.5"
                />

                {/* Throughput Curve */}
                <path
                  d="M 0 130 Q 140 100 290 120 T 500 120 Q 640 50 710 50 T 800 90 L 800 160 L 0 160 Z"
                  fill="url(#purpleGradient)"
                />
                <path
                  d="M 0 130 Q 140 100 290 120 T 500 120 Q 640 50 710 50 T 800 90"
                  fill="none"
                  stroke="#dbb8ff"
                  strokeWidth="2"
                  strokeDasharray="4 2"
                />

                {/* Peak Callout Point */}
                <circle cx="650" cy="30" r="5" fill="#00E5FF" className="animate-ping" />
                <circle cx="650" cy="30" r="4" fill="#00E5FF" />
                <rect x="610" y="5" width="80" height="18" rx="3" fill="#181F2E" stroke="#00E5FF" />
                <text x="650" y="17" fill="#c3f5ff" fontSize="9" textAnchor="middle" fontFamily="monospace">
                  PEAK: 24,810 (21:40)
                </text>
              </svg>

              {/* Time stamps */}
              <div className="flex justify-between font-mono text-[10px] text-on-surface-variant/70 border-t border-border-subtle pt-1">
                <span>00:00</span>
                <span>03:00</span>
                <span>06:00</span>
                <span>09:00</span>
                <span>12:00</span>
                <span>15:00</span>
                <span>18:00</span>
                <span className="text-primary-container font-semibold">21:00 (Peak)</span>
                <span>23:59</span>
              </div>
            </div>

            {/* Footer Metrics Row */}
            <div className="grid grid-cols-3 gap-2 pt-3 border-t border-border-subtle text-xs font-mono">
              <div>
                <span className="text-on-surface-variant text-[10px] block">Avg Listening Duration</span>
                <span className="text-on-surface font-semibold">48m 12s</span>
              </div>
              <div>
                <span className="text-on-surface-variant text-[10px] block">Buffer Underrun Rate</span>
                <span className="text-tertiary font-semibold">0.001% (Nominal)</span>
              </div>
              <div>
                <span className="text-on-surface-variant text-[10px] block">Top Geo Concurrency</span>
                <span className="text-primary font-semibold">US (38%) • DE • UK</span>
              </div>
            </div>
          </div>

          {/* Synchronized Transmitter Matrix */}
          <div className="p-4 rounded bg-surface-panel border border-border-subtle space-y-3">
            <div className="flex items-center justify-between border-b border-border-subtle pb-2">
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-semibold text-on-surface">
                  Synchronized Transmitter Matrix
                </h2>
                <span className="px-1.5 py-0.5 rounded bg-surface-container text-[10px] font-mono text-tertiary">
                  4 Channels Active
                </span>
              </div>
              <button className="text-xs text-primary-container hover:underline font-mono">
                Configure Encoder Presets
              </button>
            </div>

            {/* Station 1: Neon Horizon FM */}
            <div className="p-3 rounded bg-surface-container hover:bg-surface-elevated border border-border-subtle transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded bg-primary-container/20 border border-primary-container/40 flex items-center justify-center text-primary-container">
                  <Radio className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-on-surface">Neon Horizon FM</span>
                    <span className="px-1.5 py-0.2 rounded bg-surface-container-high text-primary font-mono text-[9px] font-bold">
                      FLAGSHIP
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-on-surface-variant">
                    <span className="text-tertiary flex items-center gap-1 font-mono text-[11px]">
                      <span className="w-1.5 h-1.5 rounded-full bg-tertiary-container" />
                      ON-AIR: AUTODJ
                    </span>
                    <span>•</span>
                    <span className="font-mono text-[11px]">320 kbps Opus</span>
                  </div>
                  <div className="text-[11px] text-on-surface-variant/80">
                    Synthwave After Dark with DJ Kaelen
                  </div>
                </div>
              </div>

              {/* Stereo VU Meter & Action */}
              <div className="flex items-center gap-3">
                <div className="flex flex-col gap-1 w-28 font-mono text-[9px]">
                  <div className="flex items-center gap-1">
                    <span className="text-on-surface-variant w-3">L</span>
                    <div className="flex-1 bg-surface-container-lowest h-2 rounded overflow-hidden flex">
                      <div
                        className="bg-tertiary-container h-full transition-all duration-300"
                        style={{ width: `${vuMeterAnim[0]}%` }}
                      />
                    </div>
                    <span className="text-tertiary w-8 text-right">-12dB</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="text-on-surface-variant w-3">R</span>
                    <div className="flex-1 bg-surface-container-lowest h-2 rounded overflow-hidden flex">
                      <div
                        className="bg-tertiary-container h-full transition-all duration-300"
                        style={{ width: `${vuMeterAnim[1]}%` }}
                      />
                    </div>
                    <span className="text-tertiary w-8 text-right">-14dB</span>
                  </div>
                </div>

                <Link
                  href="/stations/neon-horizon-fm"
                  className="px-3 py-1.5 rounded bg-surface-panel hover:bg-surface-container text-xs font-semibold text-primary border border-border-subtle"
                >
                  Studio
                </Link>
              </div>
            </div>

            {/* Station 2: Aether Chillout Lounge */}
            <div className="p-3 rounded bg-surface-container hover:bg-surface-elevated border border-border-subtle transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded bg-secondary-container/20 border border-secondary/40 flex items-center justify-center text-secondary">
                  <Radio className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-on-surface">Aether Chillout Lounge</span>
                    <span className="px-1.5 py-0.2 rounded bg-live-tally-red/20 text-live-tally-red font-mono text-[9px] font-bold">
                      LIVE DJ
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-on-surface-variant">
                    <span className="font-mono text-[11px]">5,110 listeners</span>
                    <span>•</span>
                    <span className="font-mono text-[11px]">256 kbps AAC</span>
                  </div>
                  <div className="text-[11px] text-on-surface-variant/80">
                    Sarah Jenkins (London Studio A • 18ms latency)
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="flex flex-col gap-1 w-28 font-mono text-[9px]">
                  <div className="flex items-center gap-1">
                    <span className="text-on-surface-variant w-3">M</span>
                    <div className="flex-1 bg-surface-container-lowest h-2 rounded overflow-hidden flex">
                      <div
                        className="bg-tertiary-container h-full transition-all duration-300"
                        style={{ width: `${vuMeterAnim[2]}%` }}
                      />
                    </div>
                    <span className="text-tertiary w-8 text-right">-18dB</span>
                  </div>
                </div>

                <Link
                  href="/stations/aether-chillout"
                  className="px-3 py-1.5 rounded bg-surface-panel hover:bg-surface-container text-xs font-semibold text-primary border border-border-subtle"
                >
                  Studio
                </Link>
              </div>
            </div>

            {/* Station 3: Tokyo Underground Bass */}
            <div className="p-3 rounded bg-surface-container hover:bg-surface-elevated border border-border-subtle transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded bg-tertiary-container/20 border border-tertiary/40 flex items-center justify-center text-tertiary">
                  <Radio className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-on-surface">Tokyo Underground Bass</span>
                    <span className="px-1.5 py-0.2 rounded bg-vu-warning-amber/20 text-vu-warning-amber font-mono text-[9px] font-bold">
                      DECK B ROTATION
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-on-surface-variant">
                    <span className="font-mono text-[11px]">3,240 listeners</span>
                    <span>•</span>
                    <span className="font-mono text-[11px]">320 kbps MP3</span>
                  </div>
                  <div className="text-[11px] text-on-surface-variant/80">
                    Sub-Bass Dub Heavy Deck #2
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="flex flex-col gap-1 w-28 font-mono text-[9px]">
                  <div className="flex items-center gap-1">
                    <span className="text-on-surface-variant w-3">M</span>
                    <div className="flex-1 bg-surface-container-lowest h-2 rounded overflow-hidden flex">
                      <div
                        className="bg-vu-warning-amber h-full transition-all duration-300"
                        style={{ width: `78%` }}
                      />
                    </div>
                    <span className="text-vu-warning-amber w-8 text-right">-6dB</span>
                  </div>
                </div>

                <Link
                  href="/stations/tokyo-underground"
                  className="px-3 py-1.5 rounded bg-surface-panel hover:bg-surface-container text-xs font-semibold text-primary border border-border-subtle"
                >
                  Studio
                </Link>
              </div>
            </div>

            {/* Station 4: Classical Echoes HD (Standby) */}
            <div className="p-3 rounded bg-surface-container hover:bg-surface-elevated border border-border-subtle transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 opacity-75">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded bg-surface-panel border border-border-subtle flex items-center justify-center text-on-surface-variant">
                  <Radio className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-on-surface">Classical Echoes HD</span>
                    <span className="px-1.5 py-0.2 rounded bg-surface-container-high text-on-surface-variant font-mono text-[9px]">
                      STANDBY IN 18M
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-on-surface-variant">
                    <span className="font-mono text-[11px]">722 standby cues</span>
                    <span>•</span>
                    <span className="font-mono text-[11px]">FLAC Lossless Master</span>
                  </div>
                  <div className="text-[11px] text-on-surface-variant/80">
                    Next: Nocturne in C Minor AutoCue
                  </div>
                </div>
              </div>

              <div>
                <button
                  onClick={() => setAlertNotice("Activated Classical Echoes HD transmission")}
                  className="px-3 py-1.5 rounded bg-surface-container-high hover:bg-surface-elevated text-xs font-semibold text-on-surface border border-border-subtle"
                >
                  Start Now
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column (4 cols): Flagship On-Air Deck, Schedules & Event Feed */}
        <div className="lg:col-span-4 space-y-5">
          {/* Flagship On-Air Deck */}
          <div className="p-4 rounded bg-surface-panel border border-border-subtle space-y-4">
            <div className="flex items-center justify-between border-b border-border-subtle pb-2">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-live-tally-red animate-pulse" />
                <span className="text-xs font-semibold text-on-surface uppercase tracking-wider">
                  FLAGSHIP ON-AIR DECK
                </span>
              </div>
              <span className="font-mono text-[11px] text-tertiary">ReplayGain: -1.4 dB</span>
            </div>

            {/* Album Artwork & Current Track Info */}
            <div className="flex items-center gap-3">
              <div className="relative w-16 h-16 rounded overflow-hidden border border-border-subtle shrink-0">
                <img
                  src="https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=200&auto=format&fit=crop&q=80"
                  alt="Track Cover"
                  className="w-full h-full object-cover"
                />
                <span className="absolute bottom-1 right-1 px-1 py-0.2 rounded bg-black/70 text-[8px] font-mono text-primary font-bold">
                  LOSSLESS
                </span>
              </div>

              <div className="min-w-0">
                <span className="text-[10px] font-mono text-on-surface-variant uppercase tracking-wider block">
                  CURRENT TRACK
                </span>
                <div className="text-sm font-bold text-on-surface truncate">
                  Cybernetic Echoes
                </div>
                <div className="text-xs text-on-surface-variant truncate">
                  Neon Dreams ft. The Synthetics
                </div>
                <div className="text-[10px] text-on-surface-variant/70 truncate">
                  Nightwave Synthesis (2026)
                </div>
              </div>
            </div>

            {/* Playback Progress & LUFS Indicator */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="text-on-surface tabular-metrics">{formatTime(deckProgress)}</span>
                <span className="text-primary-container text-[11px] font-semibold">
                  DYNAMIC LUFS: -14.2
                </span>
                <span className="text-on-surface-variant tabular-metrics">{formatTime(deckDuration)}</span>
              </div>

              {/* Progress Slider */}
              <div className="w-full bg-surface-container h-1.5 rounded-full overflow-hidden">
                <div
                  className="bg-primary-container h-full transition-all duration-300"
                  style={{ width: `${(deckProgress / deckDuration) * 100}%` }}
                />
              </div>

              {/* Dynamic Waveform Visualizer */}
              <div className="h-8 flex items-end gap-0.5 pt-1 overflow-hidden">
                {Array.from({ length: 38 }).map((_, i) => {
                  const h = Math.sin(i * 0.4 + deckProgress * 0.2) * 50 + 50;
                  return (
                    <div
                      key={i}
                      className="flex-1 bg-primary-container/70 rounded-t transition-all duration-300"
                      style={{ height: `${Math.max(15, h)}%` }}
                    />
                  );
                })}
              </div>
            </div>

            {/* Up Next Preview */}
            <div className="p-2.5 rounded bg-surface-container border border-border-subtle flex items-center justify-between text-xs font-mono">
              <div className="truncate">
                <span className="text-on-surface-variant">⏭ Up Next in 01:34: </span>
                <span className="text-on-surface font-semibold">"Starlight Expressway"</span>
              </div>
              <span className="text-[10px] px-1 py-0.5 rounded bg-surface-container-high text-tertiary shrink-0">
                0.8S CUE
              </span>
            </div>

            {/* Deck Action Buttons */}
            <div className="grid grid-cols-2 gap-2 text-xs">
              <button
                onClick={handleCrossfade}
                disabled={isCrossfading}
                className="flex items-center justify-center gap-1.5 py-1.5 px-2 rounded bg-surface-container hover:bg-surface-elevated text-on-surface border border-border-subtle transition-colors"
              >
                <FastForward className="w-3.5 h-3.5 text-primary-container" />
                <span>{isCrossfading ? "Crossfading..." : "Crossfade Now"}</span>
              </button>

              <button
                onClick={handleSkip}
                className="flex items-center justify-center gap-1.5 py-1.5 px-2 rounded bg-surface-container hover:bg-surface-elevated text-on-surface border border-border-subtle transition-colors"
              >
                <SkipForward className="w-3.5 h-3.5 text-secondary" />
                <span>Force Skip</span>
              </button>

              <button
                onClick={handleInsertId}
                className="flex items-center justify-center gap-1.5 py-1.5 px-2 rounded bg-surface-container hover:bg-surface-elevated text-on-surface border border-border-subtle transition-colors"
              >
                <BellRing className="w-3.5 h-3.5 text-vu-warning-amber" />
                <span>Insert Station ID</span>
              </button>

              <button
                onClick={() => setAlertNotice("DJ Mic muted across all live studio feeds")}
                className="flex items-center justify-center gap-1.5 py-1.5 px-2 rounded bg-surface-container hover:bg-surface-elevated text-error border border-border-subtle transition-colors"
              >
                <MicOff className="w-3.5 h-3.5" />
                <span>Mute DJ Mic</span>
              </button>
            </div>
          </div>

          {/* Scheduled Broadcasts */}
          <div className="p-4 rounded bg-surface-panel border border-border-subtle space-y-3">
            <div className="flex items-center justify-between border-b border-border-subtle pb-2">
              <span className="text-xs font-semibold text-on-surface uppercase tracking-wider">
                Scheduled Broadcasts
              </span>
              <span className="text-[10px] font-mono text-on-surface-variant flex items-center gap-1">
                UTC TIMELINE
              </span>
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between p-2 rounded bg-surface-container border border-border-subtle">
                <div>
                  <div className="font-semibold text-on-surface">Tokyo Midnight Grooves</div>
                  <div className="text-[10px] text-on-surface-variant">Kenji Sato (Live SIP/WebRTC)</div>
                </div>
                <div className="text-right font-mono">
                  <div className="text-primary-container font-semibold">15:00</div>
                  <span className="text-[9px] px-1 py-0.2 rounded bg-tertiary-container/20 text-tertiary">
                    LIVE
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between p-2 rounded bg-surface-container border border-border-subtle">
                <div>
                  <div className="font-semibold text-on-surface">Deep Space Ambient Chronicles</div>
                  <div className="text-[10px] text-on-surface-variant">AutoDJ Smart Rotation (Chill)</div>
                </div>
                <div className="text-right font-mono">
                  <div className="text-on-surface font-semibold">17:00</div>
                  <span className="text-[9px] px-1 py-0.2 rounded bg-surface-container-high text-on-surface-variant">
                    ROT
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between p-2 rounded bg-surface-container border border-border-subtle">
                <div>
                  <div className="font-semibold text-on-surface">Station Legal ID & Commercial Cart</div>
                  <div className="text-[10px] text-on-surface-variant">Automated Cart insertion</div>
                </div>
                <div className="text-right font-mono">
                  <div className="text-on-surface font-semibold">19:30</div>
                  <span className="text-[9px] px-1 py-0.2 rounded bg-vu-warning-amber/20 text-vu-warning-amber">
                    CART
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between p-2 rounded bg-surface-container border border-border-subtle">
                <div>
                  <div className="font-semibold text-on-surface">Global Guest Mix: Sarah Jenkins</div>
                  <div className="text-[10px] text-on-surface-variant">External Relay Restream</div>
                </div>
                <div className="text-right font-mono">
                  <div className="text-on-surface font-semibold">21:00</div>
                  <span className="text-[9px] px-1 py-0.2 rounded bg-secondary-container/20 text-secondary">
                    SPECIAL
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Infrastructure Telemetry Log */}
          <div className="p-4 rounded bg-surface-panel border border-border-subtle space-y-2">
            <div className="flex items-center justify-between border-b border-border-subtle pb-2">
              <span className="text-xs font-semibold text-on-surface uppercase tracking-wider">
                Infrastructure Telemetry Log
              </span>
              <span className="text-[10px] font-mono text-tertiary flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-tertiary-container animate-pulse" />
                FEED ACTIVE
              </span>
            </div>

            <div className="space-y-1.5 font-mono text-[10px] text-on-surface-variant max-h-36 overflow-y-auto pr-1">
              <div className="flex items-start gap-1.5">
                <span className="text-primary-container shrink-0">[14:42]</span>
                <span>Track Transition: Successfully crossfaded #8841 to #8842 (Deck A to B).</span>
              </div>
              <div className="flex items-start gap-1.5">
                <span className="text-tertiary shrink-0">[14:30]</span>
                <span>Station ID Jingle fired automatically on Top of the Hour.</span>
              </div>
              <div className="flex items-start gap-1.5">
                <span className="text-secondary shrink-0">[14:15]</span>
                <span>Frankfurt Edge Relay Node synchronized 4,200 listeners (0 drops).</span>
              </div>
              <div className="flex items-start gap-1.5">
                <span className="text-vu-warning-amber shrink-0">[13:58]</span>
                <span>SoundExchange Royalty Log snapshot auto-exported to S3 storage bucket.</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
