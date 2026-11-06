"use client";

import { useState } from "react";
import {
  Code2,
  Copy,
  Check,
  Radio,
  Sliders,
  ExternalLink,
  Sparkles,
} from "lucide-react";

interface StationItem {
  id: string;
  name: string;
  slug: string;
}

export function WidgetsClient({ stations }: { stations: StationItem[] }) {
  const [selectedStationSlug, setSelectedStationSlug] = useState(
    stations[0]?.slug || "neon-horizon-fm"
  );
  const [widgetHeight, setWidgetHeight] = useState(260);
  const [copied, setCopied] = useState(false);

  const appUrl = typeof window !== "undefined" ? window.location.origin : "http://localhost:3000";
  const embedUrl = `${appUrl}/player/${selectedStationSlug}?embed=true`;

  const embedCode = `<iframe
  src="${embedUrl}"
  width="100%"
  height="${widgetHeight}"
  frameborder="0"
  allow="autoplay"
  style="border-radius: 12px; border: 1px solid rgba(255,255,255,0.08); overflow: hidden;"
></iframe>`;

  function copyCode() {
    navigator.clipboard.writeText(embedCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  }

  return (
    <div className="space-y-6">
      <div className="border-b border-border-subtle pb-4">
        <h1 className="text-xl font-bold text-on-surface flex items-center gap-2">
          <Code2 className="w-5 h-5 text-primary-container" />
          <span>Embeddable Web Radio Players</span>
        </h1>
        <p className="text-xs text-on-surface-variant">
          Generate responsive, high-fidelity HTML5 audio players for your radio website and blog
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Config & Code (6 cols) */}
        <div className="lg:col-span-6 space-y-5">
          <div className="p-5 rounded-lg bg-surface-panel border border-border-subtle space-y-4 shadow-panel">
            <span className="text-xs font-bold text-on-surface uppercase tracking-wider font-mono">
              Widget Configuration
            </span>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-[11px] font-semibold text-on-surface-variant mb-1 uppercase tracking-wider">
                  Target Radio Station
                </label>
                <select
                  value={selectedStationSlug}
                  onChange={(e) => setSelectedStationSlug(e.target.value)}
                  className="w-full px-3 py-1.5 rounded bg-surface-container border border-border-subtle text-xs text-on-surface focus:outline-none focus:border-border-focus font-mono"
                >
                  {stations.map((st) => (
                    <option key={st.id} value={st.slug}>
                      {st.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <div className="flex justify-between text-[11px] font-mono text-on-surface-variant mb-1">
                  <span>FRAME HEIGHT</span>
                  <span className="text-primary-container">{widgetHeight}px</span>
                </div>
                <input
                  type="range"
                  min={180}
                  max={340}
                  step={20}
                  value={widgetHeight}
                  onChange={(e) => setWidgetHeight(parseInt(e.target.value))}
                  className="w-full accent-primary-container h-1 bg-surface-container rounded-lg cursor-pointer"
                />
              </div>
            </div>
          </div>

          {/* Embed Snippet Card */}
          <div className="p-5 rounded-lg bg-surface-panel border border-border-subtle space-y-3 shadow-panel">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-on-surface uppercase tracking-wider font-mono">
                HTML Embed Snippet
              </span>
              <button
                onClick={copyCode}
                className="flex items-center gap-1.5 px-3 py-1 rounded bg-primary-container text-on-primary-container text-xs font-semibold shadow-photonic"
              >
                {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? "Copied HTML!" : "Copy Embed Code"}</span>
              </button>
            </div>

            <pre className="p-3 rounded bg-surface-container border border-border-subtle text-[11px] font-mono text-primary overflow-x-auto whitespace-pre-wrap">
              {embedCode}
            </pre>
          </div>
        </div>

        {/* Right Live Preview (6 cols) */}
        <div className="lg:col-span-6 space-y-4">
          <div className="text-xs font-bold text-on-surface uppercase tracking-wider font-mono">
            Live Widget Preview
          </div>

          <div className="p-5 rounded-lg bg-surface-panel border border-border-subtle flex items-center justify-center min-h-[300px]">
            <iframe
              src={embedUrl}
              width="100%"
              height={widgetHeight}
              style={{
                borderRadius: "12px",
                border: "1px solid rgba(255,255,255,0.08)",
                overflow: "hidden",
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
