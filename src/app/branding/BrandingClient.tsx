"use client";

import { useState } from "react";
import NextImage from "next/image";
import { Radio, Image as ImageIcon, Loader2 } from "lucide-react";

interface StationBrand {
  id: string;
  name: string;
  slug: string;
  logoUrl: string | null;
  playerBannerUrl: string | null;
  playerAccentColor: string;
}

export function BrandingClient({ stations }: { stations: StationBrand[] }) {
  const [selectedId, setSelectedId] = useState(stations[0]?.id || "");
  const [accent, setAccent] = useState(stations[0]?.playerAccentColor || "#00E5FF");
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [bannerFile, setBannerFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const selected = stations.find((s) => s.id === selectedId) || stations[0];

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!selected) return;
    setSaving(true);
    setMessage(null);
    try {
      const form = new FormData();
      if (logoFile) form.append("logo", logoFile);
      if (bannerFile) form.append("banner", bannerFile);
      form.append("playerAccentColor", accent);

      const res = await fetch(`/api/stations/${selected.id}/branding`, {
        method: "PATCH",
        body: form,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Save failed");
      setMessage("Branding assets updated.");
      setLogoFile(null);
      setBannerFile(null);
      window.location.reload();
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  if (!selected) {
    return (
      <p className="text-xs text-on-surface-variant">
        Create a station first to configure branding.
      </p>
    );
  }

  return (
    <form onSubmit={handleSave} className="space-y-4">
      <div>
        <label className="text-[11px] font-mono text-on-surface-variant uppercase">Station</label>
        <select
          value={selectedId}
          onChange={(e) => {
            setSelectedId(e.target.value);
            const st = stations.find((s) => s.id === e.target.value);
            if (st) setAccent(st.playerAccentColor);
          }}
          className="mt-1 w-full px-3 py-2 rounded bg-surface-container border border-border-subtle text-sm"
        >
          {stations.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="p-4 rounded bg-surface-container border border-border-subtle text-xs space-y-3 text-center">
          {selected.logoUrl ? (
            <NextImage
              src={selected.logoUrl}
              alt={`${selected.name} logo`}
              width={80}
              height={80}
              className="w-20 h-20 mx-auto rounded-full object-cover"
            />
          ) : (
            <div className="w-20 h-20 mx-auto rounded-full bg-primary-container/20 flex items-center justify-center">
              <Radio className="w-10 h-10 text-primary-container" />
            </div>
          )}
          <div className="font-bold text-on-surface">Station Logo</div>
          <input
            type="file"
            accept="image/png,image/jpeg,image/webp"
            onChange={(e) => setLogoFile(e.target.files?.[0] || null)}
            className="text-[11px] w-full"
          />
        </div>

        <div className="p-4 rounded bg-surface-container border border-border-subtle text-xs space-y-3 text-center">
          {selected.playerBannerUrl ? (
            <NextImage
              src={selected.playerBannerUrl}
              alt={`${selected.name} player banner`}
              width={800}
              height={200}
              className="w-full h-20 rounded object-cover"
            />
          ) : (
            <div className="w-full h-20 rounded bg-surface-panel flex items-center justify-center">
              <ImageIcon className="w-8 h-8 text-secondary" aria-hidden />
            </div>
          )}
          <div className="font-bold text-on-surface">Player Banner</div>
          <input
            type="file"
            accept="image/png,image/jpeg,image/webp"
            onChange={(e) => setBannerFile(e.target.files?.[0] || null)}
            className="text-[11px] w-full"
          />
        </div>
      </div>

      <div>
        <label className="text-[11px] font-mono text-on-surface-variant uppercase">
          Player accent color
        </label>
        <input
          type="color"
          value={accent}
          onChange={(e) => setAccent(e.target.value)}
          className="mt-1 h-10 w-full rounded border border-border-subtle bg-surface-container"
        />
      </div>

      {message && <p className="text-xs text-primary-container">{message}</p>}

      <button
        type="submit"
        disabled={saving}
        className="px-4 py-2 rounded bg-primary-container text-on-primary-container text-xs font-semibold flex items-center gap-2"
      >
        {saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
        Save branding
      </button>
    </form>
  );
}
