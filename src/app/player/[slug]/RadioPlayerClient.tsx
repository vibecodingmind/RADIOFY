"use client";

import { useState, useRef, useEffect } from "react";
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  Radio,
  Share2,
  Copy,
  Check,
  ExternalLink,
} from "lucide-react";

interface StationProps {
  id: string;
  name: string;
  slug: string;
  genre: string;
  description: string | null;
  defaultBitrate: number;
  defaultFormat: string;
  portRelay: number;
  currentListeners: number;
}

interface NowPlayingProps {
  trackTitle: string;
  artist: string;
  album?: string | null;
}

export function RadioPlayerClient({
  station,
  mountPath,
  nowPlaying,
  isEmbed = false,
}: {
  station: StationProps;
  mountPath: string;
  nowPlaying: NowPlayingProps;
  isEmbed?: boolean;
}) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(0.85);
  const [isMuted, setIsMuted] = useState(false);
  const [copied, setCopied] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Audio stream URL (points to Icecast port)
  const streamUrl = typeof window !== "undefined"
    ? `${window.location.protocol}//${window.location.hostname}:${station.portRelay}${mountPath}`
    : `http://localhost:${station.portRelay}${mountPath}`;

  function togglePlay() {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play().catch((e) => console.log("Stream play buffer:", e));
      setIsPlaying(true);
    }
  }

  function handleVolumeChange(val: number) {
    setVolume(val);
    if (audioRef.current) {
      audioRef.current.volume = val;
    }
    if (val === 0) setIsMuted(true);
    else setIsMuted(false);
  }

  function copyStreamLink() {
    navigator.clipboard.writeText(streamUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  }

  return (
    <div
      className={`w-full ${
        isEmbed ? "max-w-none" : "max-w-xl"
      } rounded-xl bg-surface-panel border border-border-subtle p-5 shadow-panel space-y-4`}
    >
      <audio
        ref={audioRef}
        src={streamUrl}
        preload="none"
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
      />

      {/* Station Banner */}
      <div className="flex items-center justify-between border-b border-border-subtle pb-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded bg-primary-container/20 border border-primary-container/40 flex items-center justify-center text-primary-container">
            <Radio className="w-5 h-5 text-primary-container animate-pulse" />
          </div>
          <div>
            <h2 className="text-base font-bold text-on-surface">{station.name}</h2>
            <div className="flex items-center gap-2 text-xs text-on-surface-variant font-mono">
              <span>{station.genre}</span>
              <span>•</span>
              <span className="text-primary-container">{station.defaultBitrate}kbps Opus</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-tertiary-container/20 text-tertiary font-mono text-[10px] font-bold">
            <span className="w-1.5 h-1.5 rounded-full bg-tertiary-container animate-ping" />
            <span>LIVE STREAM</span>
          </span>
        </div>
      </div>

      {/* Now Playing Block */}
      <div className="p-4 rounded-lg bg-surface-container border border-border-subtle flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="min-w-0">
          <span className="text-[10px] uppercase font-mono font-bold text-on-surface-variant tracking-wider block">
            NOW BROADCASTING
          </span>
          <div className="text-sm font-bold text-on-surface truncate">
            {nowPlaying.trackTitle}
          </div>
          <div className="text-xs text-on-surface-variant truncate">
            {nowPlaying.artist} {nowPlaying.album ? `— ${nowPlaying.album}` : ""}
          </div>
        </div>

        {/* Live Audio Visualizer Bars */}
        <div className="h-8 flex items-end gap-1 shrink-0">
          {Array.from({ length: 16 }).map((_, i) => (
            <div
              key={i}
              className={`w-1 rounded-t transition-all duration-200 ${
                isPlaying ? "bg-primary-container animate-pulse" : "bg-on-surface-variant/30"
              }`}
              style={{
                height: isPlaying ? `${Math.max(20, Math.sin(i * 0.8) * 60 + 35)}%` : "15%",
              }}
            />
          ))}
        </div>
      </div>

      {/* Controls & Volume */}
      <div className="flex items-center justify-between gap-4 pt-1">
        <div className="flex items-center gap-3">
          <button
            onClick={togglePlay}
            className="w-12 h-12 rounded-full bg-primary-container hover:bg-primary text-on-primary-container flex items-center justify-center transition-all shadow-photonic"
          >
            {isPlaying ? (
              <Pause className="w-5 h-5 fill-current" />
            ) : (
              <Play className="w-5 h-5 fill-current ml-0.5" />
            )}
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={() => handleVolumeChange(isMuted ? 0.85 : 0)}
              className="text-on-surface-variant hover:text-on-surface"
            >
              {isMuted ? (
                <VolumeX className="w-4 h-4 text-error" />
              ) : (
                <Volume2 className="w-4 h-4" />
              )}
            </button>
            <input
              type="range"
              min={0}
              max={1}
              step={0.05}
              value={isMuted ? 0 : volume}
              onChange={(e) => handleVolumeChange(parseFloat(e.target.value))}
              className="w-24 accent-primary-container h-1 bg-surface-container rounded-lg cursor-pointer"
            />
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={copyStreamLink}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-surface-container hover:bg-surface-elevated text-xs font-mono text-on-surface-variant hover:text-on-surface border border-border-subtle transition-colors"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-tertiary" />
                <span className="text-tertiary">Copied</span>
              </>
            ) : (
              <>
                <Share2 className="w-3.5 h-3.5" />
                <span>Stream URL</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
