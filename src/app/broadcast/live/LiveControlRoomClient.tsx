"use client";

import { useState, useEffect } from "react";
import {
  SlidersHorizontal,
  Radio,
  Play,
  Pause,
  FastForward,
  Mic,
  MicOff,
  BellRing,
  Activity,
  Layers,
  Volume2,
  CheckCircle2,
  Zap,
} from "lucide-react";

interface StationItem {
  id: string;
  name: string;
  slug: string;
  portIngest: number;
  defaultBitrate: number;
  defaultFormat: string;
  currentListeners: number;
}

export function LiveControlRoomClient({
  stations,
  initialStation,
}: {
  stations: StationItem[];
  initialStation: StationItem;
}) {
  const [selectedStationId, setSelectedStationId] = useState(initialStation.id);
  const [crossfaderPos, setCrossfaderPos] = useState(0); // -100 (Deck A) to 100 (Deck B)
  const [micActive, setMicActive] = useState(false);
  const [deckAPlaying, setDeckAPlaying] = useState(true);
  const [deckBPlaying, setDeckBPlaying] = useState(false);
  const [vuLevels, setVuLevels] = useState({ left: 74, right: 71, peakHold: 82 });
  const [activeCart, setActiveCart] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [harborConnected, setHarborConnected] = useState(false);

  const activeStation =
    stations.find((s) => s.id === selectedStationId) || initialStation;

  // Real-time broadcast LED metering animation
  useEffect(() => {
    const timer = setInterval(() => {
      const base = harborConnected ? 82 : 72;
      const jitter = Math.floor(Math.random() * 16 - 8);
      const l = Math.min(98, Math.max(20, base + jitter));
      const r = Math.min(98, Math.max(20, base + jitter - 3));
      setVuLevels((prev) => ({
        left: l,
        right: r,
        peakHold: Math.max(prev.peakHold - 2, Math.max(l, r)),
      }));
    }, 150);

    return () => clearInterval(timer);
  }, [harborConnected]);

  function triggerCart(cartName: string) {
    setActiveCart(cartName);
    setNotice(`Fired Cart: ${cartName} over master studio bus`);
    setTimeout(() => {
      setActiveCart(null);
      setTimeout(() => setNotice(null), 3000);
    }, 2000);
  }

  function simulateHarborDJ() {
    setHarborConnected(!harborConnected);
    setNotice(
      !harborConnected
        ? "External DJ connected to /live harbor via OBS. AutoDJ faded to standby."
        : "External DJ disconnected. AutoDJ smoothly resumed over broadcast bus."
    );
    setTimeout(() => setNotice(null), 5000);
  }

  return (
    <div className="space-y-6">
      {notice && (
        <div className="p-3 rounded bg-surface-panel border border-border-focus text-primary-container text-xs flex items-center gap-2 shadow-photonic">
          <CheckCircle2 className="w-4 h-4 text-primary-container" />
          <span className="font-mono">{notice}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border-subtle pb-4">
        <div>
          <h1 className="text-xl font-bold text-on-surface flex items-center gap-2">
            <SlidersHorizontal className="w-5 h-5 text-primary-container" />
            <span>Live Broadcast Control Room</span>
          </h1>
          <p className="text-xs text-on-surface-variant">
            Multi-deck mixing console, Web Audio EBU R128 metering, and live harbor source monitoring
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Radio className="w-4 h-4 text-primary-container" />
            <select
              value={selectedStationId}
              onChange={(e) => setSelectedStationId(e.target.value)}
              className="px-3 py-1.5 rounded bg-surface-panel border border-border-subtle text-xs text-on-surface focus:outline-none focus:border-border-focus font-mono"
            >
              {stations.map((st) => (
                <option key={st.id} value={st.id}>
                  {st.name} ({st.defaultBitrate}k)
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={simulateHarborDJ}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-mono font-semibold transition-all border ${
              harborConnected
                ? "bg-live-tally-red text-white border-live-tally-red shadow-photonic-red"
                : "bg-surface-panel text-on-surface-variant hover:text-on-surface border-border-subtle"
            }`}
          >
            <span
              className={`w-2 h-2 rounded-full ${
                harborConnected ? "bg-white animate-ping" : "bg-on-surface-variant"
              }`}
            />
            <span>{harborConnected ? "LIVE DJ (HARBOR INGEST)" : "AUTODJ ON AIR"}</span>
          </button>
        </div>
      </div>

      {/* Main Studio Console Deck Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column (8 cols): Dual DJ Decks & Crossfader */}
        <div className="lg:col-span-8 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Deck A */}
            <div className="p-5 rounded-lg bg-surface-panel border border-border-subtle space-y-4 shadow-panel relative overflow-hidden">
              <div className="flex items-center justify-between border-b border-border-subtle pb-2">
                <span className="text-xs font-bold text-primary uppercase tracking-wider font-mono">
                  STUDIO DECK A (PRIMARY)
                </span>
                <span className="text-[10px] font-mono text-tertiary">REPLAYGAIN -1.4dB</span>
              </div>

              <div className="space-y-1">
                <span className="text-[10px] font-mono text-on-surface-variant uppercase">
                  STEM LOADED
                </span>
                <div className="text-sm font-bold text-on-surface truncate">
                  Cybernetic Echoes
                </div>
                <div className="text-xs text-on-surface-variant truncate">
                  Neon Dreams ft. The Synthetics
                </div>
              </div>

              {/* Deck A Waveform Visualizer */}
              <div className="h-10 flex items-end gap-0.5 pt-2 overflow-hidden bg-surface-container rounded p-1">
                {Array.from({ length: 32 }).map((_, i) => (
                  <div
                    key={i}
                    className="flex-1 bg-primary-container/80 rounded-t transition-all"
                    style={{
                      height: `${Math.max(
                        15,
                        Math.sin(i * 0.5 + (deckAPlaying ? 1.5 : 0)) * 40 + 55
                      )}%`,
                    }}
                  />
                ))}
              </div>

              <div className="flex items-center justify-between pt-2">
                <button
                  onClick={() => setDeckAPlaying(!deckAPlaying)}
                  className="flex items-center gap-1.5 px-4 py-1.5 rounded bg-primary-container text-on-primary-container font-semibold text-xs shadow-photonic"
                >
                  {deckAPlaying ? (
                    <>
                      <Pause className="w-3.5 h-3.5 fill-current" />
                      <span>PAUSE DECK A</span>
                    </>
                  ) : (
                    <>
                      <Play className="w-3.5 h-3.5 fill-current ml-0.5" />
                      <span>CUE DECK A</span>
                    </>
                  )}
                </button>
                <span className="font-mono text-xs text-on-surface tabular-metrics">
                  02:44 / 04:18
                </span>
              </div>
            </div>

            {/* Deck B */}
            <div className="p-5 rounded-lg bg-surface-panel border border-border-subtle space-y-4 shadow-panel relative overflow-hidden">
              <div className="flex items-center justify-between border-b border-border-subtle pb-2">
                <span className="text-xs font-bold text-secondary uppercase tracking-wider font-mono">
                  STUDIO DECK B (STANDBY)
                </span>
                <span className="text-[10px] font-mono text-on-surface-variant">READY TO CUE</span>
              </div>

              <div className="space-y-1">
                <span className="text-[10px] font-mono text-on-surface-variant uppercase">
                  STEM LOADED
                </span>
                <div className="text-sm font-bold text-on-surface truncate">
                  Starlight Expressway
                </div>
                <div className="text-xs text-on-surface-variant truncate">
                  Kavinsky Resonance
                </div>
              </div>

              {/* Deck B Waveform Visualizer */}
              <div className="h-10 flex items-end gap-0.5 pt-2 overflow-hidden bg-surface-container rounded p-1">
                {Array.from({ length: 32 }).map((_, i) => (
                  <div
                    key={i}
                    className="flex-1 bg-secondary/80 rounded-t transition-all"
                    style={{
                      height: `${Math.max(
                        10,
                        Math.cos(i * 0.4 + (deckBPlaying ? 2 : 0)) * 35 + 45
                      )}%`,
                    }}
                  />
                ))}
              </div>

              <div className="flex items-center justify-between pt-2">
                <button
                  onClick={() => setDeckBPlaying(!deckBPlaying)}
                  className="flex items-center gap-1.5 px-4 py-1.5 rounded bg-surface-container hover:bg-surface-elevated text-secondary font-semibold text-xs border border-border-subtle"
                >
                  {deckBPlaying ? (
                    <>
                      <Pause className="w-3.5 h-3.5 fill-current" />
                      <span>PAUSE DECK B</span>
                    </>
                  ) : (
                    <>
                      <Play className="w-3.5 h-3.5 fill-current ml-0.5" />
                      <span>CUE DECK B</span>
                    </>
                  )}
                </button>
                <span className="font-mono text-xs text-on-surface-variant tabular-metrics">
                  00:00 / 03:35
                </span>
              </div>
            </div>
          </div>

          {/* Master Crossfader Control Section */}
          <div className="p-5 rounded-lg bg-surface-panel border border-border-subtle space-y-3 shadow-panel">
            <div className="flex items-center justify-between text-xs font-mono">
              <span className="font-bold text-primary">DECK A (100%)</span>
              <span className="text-on-surface-variant uppercase tracking-wider">
                LINEAR AUDIO CROSSFADER
              </span>
              <span className="font-bold text-secondary">DECK B (0%)</span>
            </div>

            <div className="relative py-2">
              <input
                type="range"
                min={-100}
                max={100}
                value={crossfaderPos}
                onChange={(e) => setCrossfaderPos(parseInt(e.target.value))}
                className="w-full accent-primary-container h-3 bg-surface-container rounded-lg cursor-pointer"
              />
              <div className="flex justify-between font-mono text-[10px] text-on-surface-variant pt-1">
                <span>◀ DECK A</span>
                <span>CENTER CROSSFADE (0.0dB)</span>
                <span>DECK B ▶</span>
              </div>
            </div>
          </div>

          {/* Instant Cart Soundboard */}
          <div className="p-5 rounded-lg bg-surface-panel border border-border-subtle space-y-3 shadow-panel">
            <div className="flex items-center justify-between border-b border-border-subtle pb-2">
              <div className="flex items-center gap-2">
                <BellRing className="w-4 h-4 text-vu-warning-amber" />
                <h3 className="text-xs font-bold text-on-surface uppercase tracking-wider font-mono">
                  Instant Cart Soundboard (Hot Keys)
                </h3>
              </div>
              <span className="text-[10px] font-mono text-on-surface-variant">4 CART TRIGGERS</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { name: "Station Legal ID", icon: "CART 1", color: "text-primary" },
                { name: "Sweeper Jingle", icon: "CART 2", color: "text-tertiary" },
                { name: "Sub Drop Impact", icon: "CART 3", color: "text-secondary" },
                { name: "Commercial Break", icon: "CART 4", color: "text-vu-warning-amber" },
              ].map((cart) => {
                const isFiring = activeCart === cart.name;

                return (
                  <button
                    key={cart.name}
                    onClick={() => triggerCart(cart.name)}
                    className={`p-3 rounded border text-left transition-all ${
                      isFiring
                        ? "bg-primary-container text-on-primary-container border-border-focus shadow-photonic"
                        : "bg-surface-container hover:bg-surface-elevated border-border-subtle"
                    }`}
                  >
                    <div className="text-[10px] font-mono font-bold mb-1 opacity-70">
                      {cart.icon}
                    </div>
                    <div className="text-xs font-bold leading-tight truncate">{cart.name}</div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Column (4 cols): Master EBU R128 VU Meter & Talkover Mic */}
        <div className="lg:col-span-4 space-y-6">
          {/* Master Stereo Segmented VU Meter */}
          <div className="p-5 rounded-lg bg-surface-panel border border-border-subtle space-y-4 shadow-panel">
            <div className="flex items-center justify-between border-b border-border-subtle pb-2">
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4 text-tertiary-container" />
                <h3 className="text-xs font-bold text-on-surface uppercase tracking-wider font-mono">
                  Master Stereo VU Meter
                </h3>
              </div>
              <span className="text-[10px] font-mono text-tertiary font-bold">EBU R128</span>
            </div>

            {/* Segmented LED meters */}
            <div className="space-y-3 font-mono text-xs">
              <div>
                <div className="flex justify-between text-[10px] text-on-surface-variant mb-1">
                  <span>CHANNEL L</span>
                  <span className="text-tertiary">
                    {vuLevels.left > 90 ? "+1.5dB" : "-12.0dB"}
                  </span>
                </div>
                <div className="h-4 bg-surface-container-lowest rounded overflow-hidden p-0.5 flex gap-0.5">
                  {Array.from({ length: 30 }).map((_, i) => {
                    const threshold = (i / 30) * 100;
                    const isActive = vuLevels.left >= threshold;
                    const color =
                      i > 26 ? "bg-live-tally-red" : i > 20 ? "bg-vu-warning-amber" : "bg-tertiary-container";

                    return (
                      <div
                        key={i}
                        className={`flex-1 rounded-sm transition-all ${
                          isActive ? color : "bg-surface-container opacity-30"
                        }`}
                      />
                    );
                  })}
                </div>
              </div>

              <div>
                <div className="flex justify-between text-[10px] text-on-surface-variant mb-1">
                  <span>CHANNEL R</span>
                  <span className="text-tertiary">
                    {vuLevels.right > 90 ? "+0.8dB" : "-13.5dB"}
                  </span>
                </div>
                <div className="h-4 bg-surface-container-lowest rounded overflow-hidden p-0.5 flex gap-0.5">
                  {Array.from({ length: 30 }).map((_, i) => {
                    const threshold = (i / 30) * 100;
                    const isActive = vuLevels.right >= threshold;
                    const color =
                      i > 26 ? "bg-live-tally-red" : i > 20 ? "bg-vu-warning-amber" : "bg-tertiary-container";

                    return (
                      <div
                        key={i}
                        className={`flex-1 rounded-sm transition-all ${
                          isActive ? color : "bg-surface-container opacity-30"
                        }`}
                      />
                    );
                  })}
                </div>
              </div>

              <div className="flex justify-between text-[9px] text-on-surface-variant border-t border-border-subtle pt-2">
                <span>-60dB</span>
                <span>-24dB</span>
                <span>-14dB (LUFS)</span>
                <span>-6dB</span>
                <span className="text-live-tally-red font-bold">0dB PEAK</span>
              </div>
            </div>

            {/* Talkover Mic Switch */}
            <div className="pt-2 border-t border-border-subtle">
              <button
                onClick={() => setMicActive(!micActive)}
                className={`w-full py-3 px-4 rounded font-bold text-xs flex items-center justify-center gap-2 transition-all ${
                  micActive
                    ? "bg-live-tally-red text-white shadow-photonic-red animate-pulse"
                    : "bg-surface-container hover:bg-surface-elevated text-on-surface border border-border-subtle"
                }`}
              >
                {micActive ? (
                  <>
                    <Mic className="w-4 h-4" />
                    <span>ON AIR: DJ MIC LIVE (MUSIC DUCKED -18dB)</span>
                  </>
                ) : (
                  <>
                    <MicOff className="w-4 h-4 text-on-surface-variant" />
                    <span>ENGAGE DJ TALKOVER MIC</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Real-time Ingest Diagnostics */}
          <div className="p-5 rounded-lg bg-surface-panel border border-border-subtle space-y-3 shadow-panel">
            <span className="text-xs font-bold text-on-surface uppercase tracking-wider font-mono">
              Live Ingest Diagnostics
            </span>

            <div className="space-y-2 text-xs font-mono">
              <div className="flex justify-between p-2 rounded bg-surface-container border border-border-subtle">
                <span className="text-on-surface-variant">Active Ingest Host</span>
                <span className="text-on-surface font-semibold">localhost:{activeStation.portIngest}</span>
              </div>
              <div className="flex justify-between p-2 rounded bg-surface-container border border-border-subtle">
                <span className="text-on-surface-variant">Live Protocol</span>
                <span className="text-primary-container font-semibold">Icecast2 Source (Harbor)</span>
              </div>
              <div className="flex justify-between p-2 rounded bg-surface-container border border-border-subtle">
                <span className="text-on-surface-variant">Ingest Latency</span>
                <span className="text-tertiary font-semibold">18ms (Direct SIP)</span>
              </div>
              <div className="flex justify-between p-2 rounded bg-surface-container border border-border-subtle">
                <span className="text-on-surface-variant">Active Listeners</span>
                <span className="text-on-surface font-semibold">
                  {activeStation.currentListeners.toLocaleString()}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
