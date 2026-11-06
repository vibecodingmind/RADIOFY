"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Globe,
  Radio,
  ExternalLink,
  Copy,
  Check,
  QrCode,
  Share2,
  Play,
  Volume2,
  Code2,
  Sliders,
  CheckCircle2,
} from "lucide-react";

interface PlayersDirectoryClientProps {
  stations: any[];
}

export function PlayersDirectoryClient({ stations }: PlayersDirectoryClientProps) {
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [qrModalStation, setQrModalStation] = useState<any | null>(null);

  const handleCopyStream = (station: any) => {
    const mount = station.mounts?.find((m: any) => m.isDefault)?.path || "/live";
    const url = `http://localhost:${station.portRelay || 8010}${mount}`;
    navigator.clipboard.writeText(url);
    setCopiedId(station.id);
    setTimeout(() => setCopiedId(null), 2500);
  };

  return (
    <div className="p-8 max-w-[1600px] mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#1E293B] pb-6">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
              <Globe className="w-6 h-6 text-[#00E5FF]" />
              Public Radio Web Players & Streaming Distribution
            </h1>
            <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-[#00E5FF]/10 text-[#00E5FF] border border-[#00E5FF]/20">
              {stations.length} ACTIVE CHANNELS
            </span>
          </div>
          <p className="text-sm text-slate-400 mt-1">
            Browser-based HLS/Icecast players, direct audio stream endpoints, and mobile QR listener distribution.
          </p>
        </div>

        <Link
          href="/widgets"
          className="flex items-center gap-2 px-4 py-2 bg-[#111622] hover:bg-[#1E293B] text-white border border-[#1E293B] text-xs font-semibold rounded-md transition"
        >
          <Code2 className="w-4 h-4 text-[#00E5FF]" />
          CUSTOMIZE EMBED WIDGETS
        </Link>
      </div>

      {/* Stations Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {stations.map((st) => {
          const mount = st.mounts?.find((m: any) => m.isDefault)?.path || "/live";
          const streamUrl = `http://localhost:${st.portRelay || 8010}${mount}`;
          const isLive = st.backendStatus === "ON_AIR" || st.processState?.pid;

          return (
            <div
              key={st.id}
              className="bg-[#111622] border border-[#1E293B] rounded-xl overflow-hidden flex flex-col justify-between hover:border-[#00E5FF]/40 transition group"
            >
              <div className="p-6">
                <div className="flex items-start justify-between gap-2 mb-4">
                  <div className="flex items-center gap-2">
                    <span
                      className={`w-2.5 h-2.5 rounded-full ${
                        isLive ? "bg-[#00FF66] animate-pulse" : "bg-slate-600"
                      }`}
                    />
                    <span className="text-[10px] font-mono tracking-wider uppercase font-bold text-slate-400">
                      {isLive ? "LIVE ON-AIR" : "STANDBY"}
                    </span>
                  </div>

                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-black/40 text-[#00E5FF] border border-white/5">
                    {st.defaultBitrate} kbps ({st.defaultFormat})
                  </span>
                </div>

                <h3 className="text-lg font-bold text-white mb-1 group-hover:text-[#00E5FF] transition">
                  {st.name}
                </h3>
                <p className="text-xs text-slate-400 mb-4 line-clamp-2">
                  {st.description || "Continuous ultra-low latency audio stream syndicated across edge relays."}
                </p>

                {/* Stream URL Box */}
                <div className="p-3 bg-[#0B0E14] rounded-lg border border-[#1E293B] space-y-2">
                  <span className="text-[10px] uppercase font-mono text-slate-400 block font-semibold">
                    Direct Icecast2 Audio Mount
                  </span>
                  <div className="flex items-center justify-between text-xs font-mono text-slate-300 truncate">
                    <span className="truncate">{streamUrl}</span>
                    <button
                      onClick={() => handleCopyStream(st)}
                      className="p-1 hover:text-[#00E5FF] transition text-slate-400 ml-2 flex-shrink-0"
                      title="Copy URL"
                    >
                      {copiedId === st.id ? (
                        <Check className="w-3.5 h-3.5 text-[#00FF66]" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>
                </div>
              </div>

              {/* Bottom Actions */}
              <div className="p-4 bg-[#0B0E14] border-t border-[#1E293B] flex items-center justify-between gap-2">
                <button
                  onClick={() => setQrModalStation(st)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-[#111622] hover:bg-[#1E293B] border border-[#1E293B] text-slate-300 text-xs font-semibold transition"
                >
                  <QrCode className="w-3.5 h-3.5 text-[#00E5FF]" />
                  QR Listen
                </button>

                <div className="flex items-center gap-2">
                  <Link
                    href={`/player/${st.slug}`}
                    target="_blank"
                    className="flex items-center gap-1.5 px-3.5 py-1.5 bg-[#00E5FF] hover:bg-[#00E5FF]/90 text-black text-xs font-semibold rounded transition"
                  >
                    <Play className="w-3.5 h-3.5 fill-current" />
                    Launch Player
                    <ExternalLink className="w-3 h-3 ml-0.5" />
                  </Link>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* QR Code Modal */}
      {qrModalStation && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-[#10131a] border border-[#1E293B] rounded-xl w-full max-w-sm overflow-hidden p-6 text-center space-y-4 shadow-2xl">
            <h3 className="text-base font-bold text-white flex items-center justify-center gap-2">
              <QrCode className="w-5 h-5 text-[#00E5FF]" />
              Scan & Listen
            </h3>
            <p className="text-xs text-slate-400">
              Point your smartphone camera to immediately stream <strong className="text-white">{qrModalStation.name}</strong> on any mobile device.
            </p>

            <div className="bg-white p-6 rounded-lg inline-block shadow-inner mx-auto">
              {/* Simulated QR Pattern */}
              <div className="w-48 h-48 bg-slate-900 flex flex-col items-center justify-center rounded p-2 text-white">
                <Radio className="w-12 h-12 text-[#00E5FF] mb-2 animate-pulse" />
                <span className="text-[10px] font-mono text-center tracking-tighter">
                  radiofy.live/player/{qrModalStation.slug}
                </span>
              </div>
            </div>

            <div className="pt-2">
              <button
                onClick={() => setQrModalStation(null)}
                className="w-full py-2 bg-[#1E293B] hover:bg-slate-700 text-white font-semibold text-xs rounded transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
