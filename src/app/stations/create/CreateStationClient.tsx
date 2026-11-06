"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Radio,
  Sliders,
  Sparkles,
  ArrowRight,
  Bot,
  Zap,
  Info,
  ArrowLeft,
} from "lucide-react";

export function CreateStationClient() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [genre, setGenre] = useState("Electronic / Chill");
  const [format, setFormat] = useState("OPUS_320");
  const [bitrate, setBitrate] = useState(320);
  const [crossfadeSec, setCrossfadeSec] = useState(2.5);
  const [autoDjEnabled, setAutoDjEnabled] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const formats = [
    {
      id: "OPUS_320",
      bitrate: 320,
      label: "320 kbps Opus",
      badge: "RECOMMENDED",
      desc: "Ultra-low latency next-generation interactive broadcast codec.",
    },
    {
      id: "AAC_256",
      bitrate: 256,
      label: "256 kbps AAC-LC",
      badge: "MOBILE OPTIMIZED",
      desc: "Maximum acoustic fidelity per kilobit across iOS and Android.",
    },
    {
      id: "MP3_320",
      bitrate: 320,
      label: "320 kbps MP3",
      badge: "UNIVERSAL",
      desc: "Universal compatibility with legacy hardware internet receivers.",
    },
    {
      id: "FLAC_LOSSLESS",
      bitrate: 320,
      label: "FLAC Lossless",
      badge: "AUDIOPHILE",
      desc: "Bit-perfect uncompressed transmission for studio monitor relays.",
    },
  ];

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/stations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          description,
          genre,
          defaultFormat: format,
          defaultBitrate: bitrate,
          crossfadeSec,
          autoDjEnabled,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to create station");
      }

      router.push(`/stations/${data.station.slug}`);
      router.refresh();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Error creating station");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Back button */}
      <div>
        <Link
          href="/stations"
          className="inline-flex items-center gap-1.5 text-xs font-mono text-on-surface-variant hover:text-on-surface transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Stations Directory</span>
        </Link>
      </div>

      <div className="border-b border-border-subtle pb-4">
        <h1 className="text-xl font-bold text-on-surface flex items-center gap-2">
          <Radio className="w-5 h-5 text-primary-container" />
          <span>Provision New Radio Station</span>
        </h1>
        <p className="text-xs text-on-surface-variant">
          Allocate dedicated Icecast streaming ports, AutoDJ queue engines, and WebRTC relay mounts
        </p>
      </div>

      {error && (
        <div className="p-3 rounded bg-error-container/30 border border-error/50 text-error text-xs flex items-center gap-2">
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Step 1: Station Identity */}
        <div className="p-5 rounded-lg bg-surface-panel border border-border-subtle space-y-4 shadow-panel">
          <div className="flex items-center gap-2 border-b border-border-subtle pb-2">
            <span className="w-5 h-5 rounded-full bg-primary-container text-on-primary-container font-mono text-xs font-bold flex items-center justify-center">
              1
            </span>
            <h2 className="text-sm font-bold text-on-surface uppercase tracking-wider">
              Station Identity & Metadata
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-on-surface-variant uppercase tracking-wider mb-1.5">
                Station Call Letters / Name *
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Cyberwave Zero FM"
                className="w-full px-3 py-2 rounded bg-surface-container border border-border-subtle text-sm text-on-surface placeholder:text-on-surface-variant/50 focus:outline-none focus:border-border-focus transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-on-surface-variant uppercase tracking-wider mb-1.5">
                Primary Musical Genre
              </label>
              <input
                type="text"
                value={genre}
                onChange={(e) => setGenre(e.target.value)}
                placeholder="e.g. Synthwave / Cyberpunk"
                className="w-full px-3 py-2 rounded bg-surface-container border border-border-subtle text-sm text-on-surface focus:outline-none focus:border-border-focus transition-colors"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-on-surface-variant uppercase tracking-wider mb-1.5">
                Station Editorial Description
              </label>
              <textarea
                rows={2}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Brief summary of your radio programming and schedule focus..."
                className="w-full px-3 py-2 rounded bg-surface-container border border-border-subtle text-sm text-on-surface placeholder:text-on-surface-variant/50 focus:outline-none focus:border-border-focus transition-colors resize-none"
              />
            </div>
          </div>
        </div>

        {/* Step 2: Audio Codec & Bitrate */}
        <div className="p-5 rounded-lg bg-surface-panel border border-border-subtle space-y-4 shadow-panel">
          <div className="flex items-center gap-2 border-b border-border-subtle pb-2">
            <span className="w-5 h-5 rounded-full bg-primary-container text-on-primary-container font-mono text-xs font-bold flex items-center justify-center">
              2
            </span>
            <h2 className="text-sm font-bold text-on-surface uppercase tracking-wider">
              Audio Codec & Transmission Preset
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {formats.map((fmt) => {
              const isSelected = format === fmt.id;
              return (
                <div
                  key={fmt.id}
                  onClick={() => {
                    setFormat(fmt.id);
                    setBitrate(fmt.bitrate);
                  }}
                  className={`p-3.5 rounded border cursor-pointer transition-all ${
                    isSelected
                      ? "bg-surface-elevated border-border-focus shadow-photonic"
                      : "bg-surface-container border-border-subtle hover:border-on-surface-variant"
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-bold text-on-surface font-mono">
                      {fmt.label}
                    </span>
                    <span
                      className={`text-[9px] font-mono font-bold px-1.5 py-0.2 rounded ${
                        isSelected
                          ? "bg-primary-container text-on-primary-container"
                          : "bg-surface-container-high text-on-surface-variant"
                      }`}
                    >
                      {fmt.badge}
                    </span>
                  </div>
                  <p className="text-[11px] text-on-surface-variant">{fmt.desc}</p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Step 3: AutoDJ & Crossfading */}
        <div className="p-5 rounded-lg bg-surface-panel border border-border-subtle space-y-4 shadow-panel">
          <div className="flex items-center gap-2 border-b border-border-subtle pb-2">
            <span className="w-5 h-5 rounded-full bg-primary-container text-on-primary-container font-mono text-xs font-bold flex items-center justify-center">
              3
            </span>
            <h2 className="text-sm font-bold text-on-surface uppercase tracking-wider">
              Automation & Crossfade Engine
            </h2>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 rounded bg-surface-container border border-border-subtle">
              <div className="flex items-center gap-3">
                <Bot className="w-5 h-5 text-primary-container" />
                <div>
                  <div className="text-xs font-bold text-on-surface">Enable 24/7 AutoDJ Engine</div>
                  <div className="text-[11px] text-on-surface-variant">
                    Seamlessly plays queued tracks with intelligent ReplayGain normalization
                  </div>
                </div>
              </div>
              <input
                type="checkbox"
                checked={autoDjEnabled}
                onChange={(e) => setAutoDjEnabled(e.target.checked)}
                className="w-4 h-4 accent-primary-container cursor-pointer"
              />
            </div>

            <div>
              <div className="flex items-center justify-between text-xs font-mono mb-1.5">
                <span className="text-on-surface-variant uppercase tracking-wider">
                  Transition Crossfade Curve Duration:
                </span>
                <span className="text-primary-container font-bold">{crossfadeSec.toFixed(1)}s</span>
              </div>
              <input
                type="range"
                min={0.5}
                max={6.0}
                step={0.5}
                value={crossfadeSec}
                onChange={(e) => setCrossfadeSec(parseFloat(e.target.value))}
                className="w-full accent-primary-container h-1.5 bg-surface-container rounded-lg cursor-pointer"
              />
            </div>
          </div>
        </div>

        {/* Action Button */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <Link
            href="/stations"
            className="px-4 py-2 rounded bg-surface-container hover:bg-surface-elevated text-xs font-semibold text-on-surface-variant hover:text-on-surface border border-border-subtle transition-colors"
          >
            Cancel
          </Link>

          <button
            type="submit"
            disabled={loading}
            className="flex items-center gap-2 px-5 py-2 rounded bg-primary-container hover:bg-primary text-on-primary-container font-semibold text-xs transition-all shadow-photonic disabled:opacity-50"
          >
            {loading ? (
              <span>Allocating Node Ports & Initializing...</span>
            ) : (
              <>
                <span>Provision Broadcast Station</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
