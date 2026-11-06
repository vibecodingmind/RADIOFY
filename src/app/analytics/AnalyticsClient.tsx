"use client";

import { useEffect, useState } from "react";

type RangeKey = "today" | "yesterday" | "last7" | "last30" | "thisMonth";

interface Summary {
  kpis: {
    activeListeners: number;
    peakConcurrent: number;
    listeningHours: number;
    broadcastSpins: number;
    avgListenersOnSpins: number;
  };
  stations: Array<{
    id: string;
    name: string;
    currentListeners: number;
    peakListeners: number;
    defaultBitrate: number;
    defaultFormat: string;
    portIngest: number;
  }>;
}

const ranges: { key: RangeKey; label: string }[] = [
  { key: "today", label: "Today" },
  { key: "yesterday", label: "Yesterday" },
  { key: "last7", label: "Last 7 days" },
  { key: "last30", label: "Last 30 days" },
  { key: "thisMonth", label: "This month" },
];

export function AnalyticsClient({ initial }: { initial: Summary }) {
  const [range, setRange] = useState<RangeKey>("last7");
  const [data, setData] = useState<Summary>(initial);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/analytics?range=${range}`);
        if (!res.ok) return;
        const json = await res.json();
        if (!cancelled) setData(json);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [range]);

  return (
    <>
      <div className="flex flex-wrap gap-2">
        {ranges.map((r) => (
          <button
            key={r.key}
            type="button"
            onClick={() => setRange(r.key)}
            className={`px-2.5 py-1 rounded text-[11px] font-mono border ${
              range === r.key
                ? "bg-primary-container text-on-primary-container border-primary-container"
                : "bg-surface-panel border-border-subtle text-on-surface-variant"
            }`}
          >
            {r.label}
          </button>
        ))}
        {loading && <span className="text-[11px] text-on-surface-variant self-center">Updating…</span>}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <Kpi label="Active listeners" value={data.kpis.activeListeners.toLocaleString()} />
        <Kpi label="Peak concurrent" value={data.kpis.peakConcurrent.toLocaleString()} />
        <Kpi label="Listening hours" value={data.kpis.listeningHours.toLocaleString()} />
        <Kpi label="Broadcast spins" value={data.kpis.broadcastSpins.toLocaleString()} />
      </div>

      <div className="divide-y divide-border-subtle/50 font-mono text-xs">
        {data.stations.map((st) => (
          <div key={st.id} className="py-3 flex items-center justify-between">
            <div>
              <div className="font-bold text-on-surface">{st.name}</div>
              <div className="text-[10px] text-on-surface-variant">
                {st.defaultBitrate}kbps {st.defaultFormat.split("_")[0]}
              </div>
            </div>
            <div className="text-right">
              <div className="text-primary-container font-bold">{st.currentListeners}</div>
              <div className="text-[10px] text-on-surface-variant">Peak {st.peakListeners}</div>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}

function Kpi({ label, value }: { label: string; value: string }) {
  return (
    <div className="p-4 rounded-lg bg-surface-panel border border-border-subtle space-y-1">
      <span className="text-[10px] font-mono font-semibold text-on-surface-variant uppercase">
        {label}
      </span>
      <div className="text-2xl font-bold text-on-surface font-mono">{value}</div>
    </div>
  );
}
