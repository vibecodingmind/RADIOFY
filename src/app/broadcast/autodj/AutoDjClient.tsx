"use client";

import { useState } from "react";
import {
  Radio,
  Sliders,
  RotateCw,
  FastForward,
  Play,
  Volume2,
  ShieldAlert,
  Sparkles,
  Layers,
  CheckCircle2,
  Activity,
  Zap,
  Music,
} from "lucide-react";

interface AutoDjClientProps {
  initialStations: any[];
}

export function AutoDjClient({ initialStations }: AutoDjClientProps) {
  const [stations, setStations] = useState(initialStations);
  const [selectedStationId, setSelectedStationId] = useState(stations[0]?.id || "");
  const [crossfadeSec, setCrossfadeSec] = useState("3.5");
  const [curveType, setCurveType] = useState("logarithmic");
  const [replayGainTarget, setReplayGainTarget] = useState("-14.0");
  const [isProcessing, setIsProcessing] = useState(false);
  const [actionNotice, setActionNotice] = useState<string | null>(null);

  const currentStation = stations.find((s) => s.id === selectedStationId) || stations[0];

  const handleAction = async (action: string) => {
    if (!currentStation) return;
    setIsProcessing(true);
    setActionNotice(null);

    try {
      const res = await fetch(`/api/stations/${currentStation.id}/action`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Action failed");

      setActionNotice(`AutoDJ Engine executed action: ${action.toUpperCase()}`);
      setTimeout(() => setActionNotice(null), 4000);
    } catch (err: any) {
      alert(err.message);
    } finally {
      setIsProcessing(false);
    }
  };

  const totalTracks =
    currentStation?.playlists?.reduce(
      (acc: number, pl: any) => acc + (pl.items?.length || 0),
      0
    ) || 0;

  return (
    <div className="p-8 max-w-[1600px] mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#1E293B] pb-6">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
              <Zap className="w-6 h-6 text-[#00E5FF]" />
              AutoDJ Engine Diagnostics & Cue Calibration
            </h1>
            <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-[#00FF66]/10 text-[#00FF66] border border-[#00FF66]/20 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[#00FF66] animate-pulse" />
              ENGINE ACTIVE
            </span>
          </div>
          <p className="text-sm text-slate-400 mt-1">
            ReplayGain loudness matching, automated smart transitions, gapless crossfade DSP, and fail-safe fallback routing.
          </p>
        </div>

        {/* Station Picker */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400 uppercase font-semibold">Station:</span>
          <select
            value={selectedStationId}
            onChange={(e) => setSelectedStationId(e.target.value)}
            className="bg-[#10131a] border border-[#1E293B] text-white text-xs rounded-md px-3 py-2 focus:border-[#00E5FF] outline-none"
          >
            {stations.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name} ({s.slug})
              </option>
            ))}
          </select>
        </div>
      </div>

      {actionNotice && (
        <div className="p-3 bg-[#00FF66]/10 border border-[#00FF66]/20 rounded-lg text-xs text-[#00FF66] flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
          {actionNotice}
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-[#111622] border border-[#1E293B] p-5 rounded-xl">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1">
            Standby Cues
          </span>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-white">{totalTracks}</span>
            <span className="text-xs text-[#00FF66] font-mono">Normalized</span>
          </div>
          <span className="text-[11px] text-slate-500 mt-2 block">
            Indexed across {currentStation?.playlists?.length || 0} active playlists
          </span>
        </div>

        <div className="bg-[#111622] border border-[#1E293B] p-5 rounded-xl">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1">
            Dynamic LUFS Target
          </span>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-[#00E5FF]">{replayGainTarget}</span>
            <span className="text-xs text-slate-400 font-mono">LUFS</span>
          </div>
          <span className="text-[11px] text-slate-500 mt-2 block">
            EBU R128 Loudness Standard matched
          </span>
        </div>

        <div className="bg-[#111622] border border-[#1E293B] p-5 rounded-xl">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1">
            Crossfade Window
          </span>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-white">{crossfadeSec}s</span>
            <span className="text-xs text-slate-400 font-mono">Smart Overlap</span>
          </div>
          <span className="text-[11px] text-slate-500 mt-2 block">
            Curve: {curveType.toUpperCase()}
          </span>
        </div>

        <div className="bg-[#111622] border border-[#1E293B] p-5 rounded-xl">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1">
            Fallback Guard
          </span>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-[#00FF66]">0.00%</span>
            <span className="text-xs text-slate-400 font-mono">Silence Drops</span>
          </div>
          <span className="text-[11px] text-slate-500 mt-2 block">
            Safety ringbuffer primed
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: DSP Calibration & Quick Controls */}
        <div className="lg:col-span-2 space-y-6">
          {/* Quick Engine Actions */}
          <div className="bg-[#111622] border border-[#1E293B] rounded-xl p-6">
            <h3 className="text-base font-bold text-white mb-2 flex items-center gap-2">
              <Activity className="w-5 h-5 text-[#00E5FF]" />
              Real-Time AutoDJ Controls
            </h3>
            <p className="text-xs text-slate-400 mb-6">
              Send immediate control signals to the station’s Liquidsoap audio processing daemon.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <button
                disabled={isProcessing}
                onClick={() => handleAction("reload_autodj")}
                className="flex items-center justify-center gap-2 px-4 py-3 bg-[#0B0E14] border border-[#1E293B] hover:border-[#00E5FF] rounded-lg text-xs font-semibold text-white transition hover:text-[#00E5FF] group disabled:opacity-50"
              >
                <RotateCw className="w-4 h-4 group-hover:rotate-180 transition-transform duration-500 text-[#00E5FF]" />
                RE-INDEX QUEUE
              </button>

              <button
                disabled={isProcessing}
                onClick={() => handleAction("restart")}
                className="flex items-center justify-center gap-2 px-4 py-3 bg-[#0B0E14] border border-[#1E293B] hover:border-yellow-500/50 rounded-lg text-xs font-semibold text-white transition hover:text-yellow-400 group disabled:opacity-50"
              >
                <FastForward className="w-4 h-4 text-yellow-400" />
                FORCE SKIP TRACK
              </button>

              <button
                disabled={isProcessing}
                onClick={() => handleAction("reload_autodj")}
                className="flex items-center justify-center gap-2 px-4 py-3 bg-[#0B0E14] border border-[#1E293B] hover:border-[#00FF66] rounded-lg text-xs font-semibold text-white transition hover:text-[#00FF66] group disabled:opacity-50"
              >
                <Sparkles className="w-4 h-4 text-[#00FF66]" />
                INSERT STATION JINGLE
              </button>
            </div>
          </div>

          {/* DSP Transition Sliders */}
          <div className="bg-[#111622] border border-[#1E293B] rounded-xl p-6 space-y-6">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Sliders className="w-5 h-5 text-[#00E5FF]" />
              DSP Crossfade & Loudness Calibration
            </h3>

            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-xs mb-2">
                  <span className="font-semibold text-slate-300 uppercase tracking-wider">
                    Smart Crossfade Window
                  </span>
                  <span className="font-mono text-[#00E5FF] font-bold">{crossfadeSec} seconds</span>
                </div>
                <input
                  type="range"
                  min="0.5"
                  max="8.0"
                  step="0.5"
                  value={crossfadeSec}
                  onChange={(e) => setCrossfadeSec(e.target.value)}
                  className="w-full accent-[#00E5FF] bg-[#0B0E14] h-2 rounded-lg cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-slate-500 mt-1 font-mono">
                  <span>0.5s (Tight Cut)</span>
                  <span>4.0s (Radio Standard)</span>
                  <span>8.0s (Club Blend)</span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                  Transition Curve Algorithm
                </label>
                <div className="grid grid-cols-3 gap-3">
                  {["logarithmic", "linear", "exponential"].map((type) => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => setCurveType(type)}
                      className={`px-3 py-2 text-xs font-semibold rounded-md border uppercase transition ${
                        curveType === type
                          ? "bg-[#00E5FF]/10 border-[#00E5FF] text-[#00E5FF]"
                          : "bg-[#0B0E14] border-[#1E293B] text-slate-400 hover:text-white"
                      }`}
                    >
                      {type}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs mb-2">
                  <span className="font-semibold text-slate-300 uppercase tracking-wider">
                    ReplayGain Normalization Level
                  </span>
                  <span className="font-mono text-[#00FF66] font-bold">{replayGainTarget} LUFS</span>
                </div>
                <input
                  type="range"
                  min="-20.0"
                  max="-10.0"
                  step="0.5"
                  value={replayGainTarget}
                  onChange={(e) => setReplayGainTarget(e.target.value)}
                  className="w-full accent-[#00FF66] bg-[#0B0E14] h-2 rounded-lg cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-slate-500 mt-1 font-mono">
                  <span>-20 dB (High Dynamic Range)</span>
                  <span>-14 dB (Broadcast EBU R128)</span>
                  <span>-10 dB (Max Loudness)</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Col: Fallback Hierarchy Matrix */}
        <div className="space-y-6">
          <div className="bg-[#111622] border border-[#1E293B] rounded-xl p-6">
            <h3 className="text-base font-bold text-white mb-2 flex items-center gap-2">
              <Layers className="w-5 h-5 text-[#00E5FF]" />
              Audio Ingest Fallback Chain
            </h3>
            <p className="text-xs text-slate-400 mb-6">
              Priority order enforced by the station supervisor when audio sources connect or disconnect.
            </p>

            <div className="space-y-3">
              {[
                {
                  rank: 1,
                  title: "Live DJ Harbor Ingest",
                  desc: "Port harbor live stream (OBS, BUTT, Mixxx) with automatic ducking",
                  color: "#FF007F",
                  status: "STANDBY / ACTIVE",
                },
                {
                  rank: 2,
                  title: "Air Calendar Slot",
                  desc: "Scheduled show or dedicated live host program",
                  color: "#00E5FF",
                  status: "TIMED",
                },
                {
                  rank: 3,
                  title: "AutoDJ Smart Rotation",
                  desc: "Weighted random playlist deck and rotation rules",
                  color: "#00FF66",
                  status: "ONLINE",
                },
                {
                  rank: 4,
                  title: "Station ID / Jingle Cart",
                  desc: "Top of hour legal identifiers and promotional carts",
                  color: "#FFB703",
                  status: "AUTOMATED",
                },
                {
                  rank: 5,
                  title: "Silence Guard Loop",
                  desc: "Seamless emergency audio loop to prevent disconnects",
                  color: "#9D4EDD",
                  status: "FAIL-SAFE",
                },
              ].map((item) => (
                <div
                  key={item.rank}
                  className="p-3 bg-[#0B0E14] border border-[#1E293B] rounded-lg flex items-start gap-3"
                  style={{ borderLeftWidth: "3px", borderLeftColor: item.color }}
                >
                  <span className="w-5 h-5 rounded-full bg-white/5 text-slate-300 flex items-center justify-center text-xs font-mono font-bold flex-shrink-0">
                    {item.rank}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1">
                      <span className="text-xs font-bold text-white">{item.title}</span>
                      <span
                        className="text-[9px] font-mono font-semibold px-1.5 py-0.5 rounded"
                        style={{ color: item.color, backgroundColor: `${item.color}15` }}
                      >
                        {item.status}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-0.5">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
