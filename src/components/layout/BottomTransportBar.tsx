"use client";

import { useState } from "react";
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  Radio,
  Mic,
  Activity,
  ExternalLink,
  Cpu,
} from "lucide-react";

interface BottomTransportBarProps {
  stationName?: string;
  bitrate?: number;
  format?: string;
}

export function BottomTransportBar({
  stationName = "Neon Horizon FM",
  bitrate = 320,
  format = "Opus",
}: BottomTransportBarProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPflActive, setIsPflActive] = useState(false);
  const [isDucked, setIsDucked] = useState(false);
  const [volume, setVolume] = useState(-6.2);

  return (
    <footer className="fixed bottom-0 right-0 left-0 md:left-72 h-14 bg-surface-container-lowest/95 backdrop-blur-md border-t border-border-subtle z-30 px-4 flex items-center justify-between select-none">
      {/* Left Transport & PFL Monitoring */}
      <div className="flex items-center gap-3">
        {/* PFL Switch */}
        <button
          onClick={() => setIsPflActive(!isPflActive)}
          className={`flex items-center gap-1.5 px-2 py-1 rounded border text-xs font-mono font-bold transition-all ${
            isPflActive
              ? "bg-primary-container text-on-primary-container border-border-focus shadow-photonic"
              : "bg-surface-panel text-on-surface-variant border-border-subtle hover:text-on-surface"
          }`}
          title="Pre-Fade Listen (Studio Solo Monitor)"
        >
          <span
            className={`w-1.5 h-1.5 rounded-full ${
              isPflActive ? "bg-live-tally-red animate-ping" : "bg-on-surface-variant"
            }`}
          />
          <span>PFL</span>
        </button>

        {/* Master Play/Pause Monitor */}
        <button
          onClick={() => setIsPlaying(!isPlaying)}
          className="w-8 h-8 rounded-full bg-primary-container text-on-primary-container flex items-center justify-center hover:bg-primary transition-all shadow-photonic"
          title={isPlaying ? "Mute Master Audio" : "Listen Master Audio"}
        >
          {isPlaying ? (
            <Pause className="w-4 h-4 fill-current" />
          ) : (
            <Play className="w-4 h-4 fill-current ml-0.5" />
          )}
        </button>

        {/* Level Fader & Decibels Readout */}
        <div className="flex items-center gap-2">
          {volume === -60 ? (
            <VolumeX className="w-4 h-4 text-error" />
          ) : (
            <Volume2 className="w-4 h-4 text-on-surface-variant" />
          )}
          <input
            type="range"
            min={-40}
            max={0}
            step={0.5}
            value={volume}
            onChange={(e) => setVolume(parseFloat(e.target.value))}
            className="w-20 accent-primary-container h-1 bg-surface-container rounded-lg cursor-pointer"
          />
          <span className="font-mono text-xs text-on-surface tabular-metrics w-14">
            {volume.toFixed(1)} dB
          </span>
        </div>

        {/* Mic Ducking Toggle */}
        <button
          onClick={() => setIsDucked(!isDucked)}
          className={`flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-mono border transition-colors ${
            isDucked
              ? "bg-secondary-container/40 text-secondary border-secondary/50"
              : "bg-surface-panel text-on-surface-variant border-border-subtle hover:text-on-surface"
          }`}
          title="Auto DJ Talkover Ducking (-18dB)"
        >
          <Mic className="w-3 h-3" />
          <span>Duck -18dB</span>
        </button>
      </div>

      {/* Right Edge Infrastructure Telemetry */}
      <div className="flex items-center gap-4 text-xs font-mono">
        <div className="hidden lg:flex items-center gap-3 text-on-surface-variant border-r border-border-subtle pr-4">
          <div className="flex items-center gap-1">
            <Cpu className="w-3.5 h-3.5 text-primary-container" />
            <span>CPU: 14%</span>
          </div>
          <div>RAM: 2.1 GB</div>
          <div className="flex items-center gap-1 text-tertiary">
            <Activity className="w-3.5 h-3.5 text-tertiary-container" />
            <span>99.9% Health</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="px-1.5 py-0.5 rounded bg-surface-panel text-[10px] text-on-surface-variant border border-border-subtle">
            HLS / Icecast2
          </span>

          <a
            href={`/player/demo`}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-surface-panel hover:bg-surface-elevated text-primary border border-border-subtle text-xs transition-colors"
          >
            <span>Studio Deck</span>
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      </div>
    </footer>
  );
}
