"use client";

import { useCallback, useEffect, useState } from "react";
import { Radio, Plus, Play, Square, Trash2, Loader2 } from "lucide-react";

const PLATFORMS = [
  "YOUTUBE",
  "FACEBOOK",
  "TWITCH",
  "TWITTER",
  "LINKEDIN",
  "TIKTOK",
  "CUSTOM",
] as const;

interface DestRow {
  id: string;
  platform: string;
  label: string;
  enabled: boolean;
  status: string;
  bitrateKbps: number;
  lastError: string | null;
  processPid: number | null;
  rtmpHint: string;
}

export function RestreamSection({ stationId }: { stationId: string }) {
  const [destinations, setDestinations] = useState<DestRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    platform: "YOUTUBE" as (typeof PLATFORMS)[number],
    label: "",
    rtmpIngestUrl: "",
    bitrateKbps: 128,
  });
  const [notice, setNotice] = useState<string | null>(null);

  const load = useCallback(async () => {
    const res = await fetch(`/api/stations/${stationId}/restream`);
    if (!res.ok) return;
    const data = await res.json();
    setDestinations(data.destinations || []);
  }, [stationId]);

  useEffect(() => {
    (async () => {
      setLoading(true);
      await load();
      setLoading(false);
    })();
  }, [load]);

  async function addDestination(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setNotice(null);
    try {
      const res = await fetch(`/api/stations/${stationId}/restream`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          platform: form.platform,
          label: form.label,
          rtmpIngestUrl: form.rtmpIngestUrl,
          bitrateKbps: form.bitrateKbps,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to add");
      setForm({ ...form, label: "", rtmpIngestUrl: "" });
      await load();
      setNotice("Destination saved. Start FFmpeg on your streaming node or enable ENABLE_RESTREAM_FFMPEG.");
      setTimeout(() => setNotice(null), 5000);
    } catch (err) {
      setNotice(err instanceof Error ? err.message : "Error");
    } finally {
      setSaving(false);
    }
  }

  async function startDest(id: string) {
    const res = await fetch(`/api/stations/${stationId}/restream/${id}/action`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "start" }),
    });
    const data = await res.json();
    if (!res.ok) {
      setNotice(data.error || "Start failed");
      return;
    }
    await load();
  }

  async function stopDest(id: string) {
    const res = await fetch(`/api/stations/${stationId}/restream/${id}/action`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "stop" }),
    });
    if (!res.ok) return;
    await load();
  }

  async function removeDest(id: string) {
    if (!confirm("Remove this social restream destination?")) return;
    const res = await fetch(`/api/stations/${stationId}/restream/${id}`, {
      method: "DELETE",
    });
    if (!res.ok) return;
    await load();
  }

  return (
    <div className="p-5 rounded-lg bg-surface-panel border border-border-subtle space-y-4 shadow-panel">
      <div className="flex items-center gap-2 border-b border-border-subtle pb-2">
        <Radio className="w-4 h-4 text-secondary" />
        <h2 className="text-xs font-bold text-on-surface uppercase tracking-wider font-mono">
          Social simulcast (RTMP)
        </h2>
      </div>
      <p className="text-[11px] text-on-surface-variant">
        Paste each platform&apos;s RTMP ingest URL with stream key. Audio is pulled from your public Icecast mount and
        pushed with FFmpeg when <span className="font-mono text-primary-container">ENABLE_RESTREAM_FFMPEG=true</span>.
      </p>

      {notice && (
        <div className="text-xs text-primary-container bg-surface-container px-2 py-1.5 rounded border border-border-subtle">
          {notice}
        </div>
      )}

      {loading ? (
        <div className="text-xs text-on-surface-variant flex items-center gap-2">
          <Loader2 className="w-4 h-4 animate-spin" /> Loading destinations…
        </div>
      ) : (
        <div className="space-y-2">
          {destinations.map((d) => (
            <div
              key={d.id}
              className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 rounded bg-surface-container border border-border-subtle text-xs"
            >
              <div>
                <div className="font-bold text-on-surface">{d.label}</div>
                <div className="text-[10px] text-on-surface-variant font-mono">
                  {d.platform} • {d.status} • {d.bitrateKbps} kbps AAC
                </div>
                <div className="text-[10px] text-on-surface-variant/70 font-mono mt-0.5">{d.rtmpHint}</div>
                {d.lastError && (
                  <div className="text-[10px] text-error mt-1">{d.lastError}</div>
                )}
              </div>
              <div className="flex items-center gap-1 shrink-0">
                {d.status === "ACTIVE" ? (
                  <button
                    type="button"
                    onClick={() => stopDest(d.id)}
                    className="p-1.5 rounded bg-surface-panel border border-border-subtle"
                    title="Stop"
                  >
                    <Square className="w-3.5 h-3.5" />
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => startDest(d.id)}
                    className="p-1.5 rounded bg-tertiary-container/20 border border-tertiary/30 text-tertiary"
                    title="Start FFmpeg push"
                  >
                    <Play className="w-3.5 h-3.5" />
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => removeDest(d.id)}
                  className="p-1.5 rounded bg-error-container/10 border border-error/20 text-error"
                  title="Delete"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <form onSubmit={addDestination} className="space-y-2 pt-2 border-t border-border-subtle">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          <div>
            <label className="text-[10px] text-on-surface-variant uppercase font-mono">Platform</label>
            <select
              value={form.platform}
              onChange={(e) => setForm({ ...form, platform: e.target.value as (typeof PLATFORMS)[number] })}
              className="w-full mt-0.5 px-2 py-1.5 rounded bg-surface-container border border-border-subtle text-xs"
            >
              {PLATFORMS.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-[10px] text-on-surface-variant uppercase font-mono">Label</label>
            <input
              value={form.label}
              onChange={(e) => setForm({ ...form, label: e.target.value })}
              placeholder="e.g. Main YouTube channel"
              className="w-full mt-0.5 px-2 py-1.5 rounded bg-surface-container border border-border-subtle text-xs"
              required
            />
          </div>
        </div>
        <div>
          <label className="text-[10px] text-on-surface-variant uppercase font-mono">RTMP ingest URL</label>
          <input
            value={form.rtmpIngestUrl}
            onChange={(e) => setForm({ ...form, rtmpIngestUrl: e.target.value })}
            placeholder="rtmps://a.rtmp.youtube.com/live2/xxxx"
            className="w-full mt-0.5 px-2 py-1.5 rounded bg-surface-container border border-border-subtle text-xs font-mono"
            required
          />
        </div>
        <div className="flex items-center gap-2">
          <label className="text-[10px] text-on-surface-variant uppercase font-mono">Bitrate (kbps)</label>
          <input
            type="number"
            min={64}
            max={320}
            value={form.bitrateKbps}
            onChange={(e) => setForm({ ...form, bitrateKbps: Number(e.target.value) })}
            className="w-24 px-2 py-1 rounded bg-surface-container border border-border-subtle text-xs"
          />
          <button
            type="submit"
            disabled={saving}
            className="ml-auto flex items-center gap-1 px-3 py-1.5 rounded bg-primary-container text-on-primary-container text-xs font-semibold"
          >
            {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
            Add destination
          </button>
        </div>
      </form>
    </div>
  );
}
