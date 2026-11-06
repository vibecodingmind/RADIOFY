"use client";

import { useState } from "react";
import {
  ListMusic,
  PlusCircle,
  Bot,
  Play,
  Shuffle,
  Clock,
  Trash2,
  Plus,
  CheckCircle2,
  Radio,
  Sliders,
  Layers,
} from "lucide-react";

interface MediaItem {
  id: string;
  stationId: string;
  title: string;
  artist: string;
  duration: number;
  fileSize: string;
  lufs: number;
}

interface PlaylistItem {
  id: string;
  playlistId: string;
  mediaFileId: string;
  order: number;
  cueFadeSec: number;
  mediaFile: MediaItem;
}

interface Playlist {
  id: string;
  stationId: string;
  name: string;
  type: string;
  weight: number;
  isActive: boolean;
  playMode: string;
  startTime: string | null;
  endTime: string | null;
  items: PlaylistItem[];
}

interface StationSummary {
  id: string;
  name: string;
}

interface PlaylistsClientProps {
  stations: StationSummary[];
  initialStationId?: string;
  initialPlaylists: Playlist[];
  availableMedia: MediaItem[];
}

export function PlaylistsClient({
  stations,
  initialStationId,
  initialPlaylists,
  availableMedia,
}: PlaylistsClientProps) {
  const [selectedStationId, setSelectedStationId] = useState(
    initialStationId || stations[0]?.id || ""
  );
  const [playlists, setPlaylists] = useState<Playlist[]>(initialPlaylists);
  const [activePlaylistId, setActivePlaylistId] = useState<string | null>(
    initialPlaylists[0]?.id || null
  );
  const [creating, setCreating] = useState(false);
  const [newPlaylistName, setNewPlaylistName] = useState("");
  const [newPlaylistType, setNewPlaylistType] = useState("ROTATION");
  const [newPlaylistWeight, setNewPlaylistWeight] = useState(5);
  const [notice, setNotice] = useState<string | null>(null);

  const activePlaylist = playlists.find((p) => p.id === activePlaylistId);
  const stationMedia = availableMedia.filter((m) => m.stationId === selectedStationId);

  async function handleCreatePlaylist(e: React.FormEvent) {
    e.preventDefault();
    try {
      const res = await fetch("/api/playlists", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          stationId: selectedStationId,
          name: newPlaylistName,
          type: newPlaylistType,
          weight: newPlaylistWeight,
          playMode: "SHUFFLE",
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to create playlist");

      const created: Playlist = { ...data.playlist, items: [] };
      setPlaylists([created, ...playlists]);
      setActivePlaylistId(created.id);
      setCreating(false);
      setNewPlaylistName("");
      setNotice(`Created AutoDJ rotation: ${created.name}`);
      setTimeout(() => setNotice(null), 3500);
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Error creating playlist");
    }
  }

  async function handleAddTrackToPlaylist(mediaFileId: string) {
    if (!activePlaylistId) return;

    try {
      const res = await fetch(`/api/playlists/${activePlaylistId}/items`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mediaFileId, cueFadeSec: 2.5 }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to add track");

      setPlaylists((prev) =>
        prev.map((p) =>
          p.id === activePlaylistId ? { ...p, items: [...p.items, data.item] } : p
        )
      );
      setNotice("Added track to active rotation");
      setTimeout(() => setNotice(null), 2500);
    } catch (err) {
      alert("Error adding track to playlist");
    }
  }

  async function handleRemoveTrack(itemId: string) {
    if (!activePlaylistId) return;

    try {
      const res = await fetch(`/api/playlists/${activePlaylistId}/items?itemId=${itemId}`, {
        method: "DELETE",
      });

      if (res.ok) {
        setPlaylists((prev) =>
          prev.map((p) =>
            p.id === activePlaylistId
              ? { ...p, items: p.items.filter((i) => i.id !== itemId) }
              : p
          )
        );
        setNotice("Track removed from rotation");
        setTimeout(() => setNotice(null), 2500);
      }
    } catch {
      alert("Error removing track");
    }
  }

  function formatDuration(sec: number) {
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${m}:${s.toString().padStart(2, "0")}`;
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
            <ListMusic className="w-5 h-5 text-primary-container" />
            <span>AutoDJ Playlists & Rotation Engine</span>
          </h1>
          <p className="text-xs text-on-surface-variant">
            Design high-probability daypart rotations, smart crossfade curves, and automated jingle carts
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Radio className="w-4 h-4 text-primary-container" />
            <select
              value={selectedStationId}
              onChange={(e) => setSelectedStationId(e.target.value)}
              className="px-3 py-1.5 rounded bg-surface-panel border border-border-subtle text-xs text-on-surface focus:outline-none focus:border-border-focus"
            >
              {stations.map((st) => (
                <option key={st.id} value={st.id}>
                  {st.name}
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={() => setCreating(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-primary-container hover:bg-primary text-on-primary-container font-semibold text-xs transition-all shadow-photonic"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Create Playlist</span>
          </button>
        </div>
      </div>

      {/* Create Modal */}
      {creating && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-surface-panel border border-border-subtle rounded-lg p-5 space-y-4 shadow-panel">
            <h3 className="text-sm font-bold text-on-surface uppercase tracking-wider">
              Create New AutoDJ Playlist
            </h3>

            <form onSubmit={handleCreatePlaylist} className="space-y-3 text-xs">
              <div>
                <label className="block text-[11px] font-semibold text-on-surface-variant mb-1">
                  Playlist Name
                </label>
                <input
                  type="text"
                  required
                  value={newPlaylistName}
                  onChange={(e) => setNewPlaylistName(e.target.value)}
                  placeholder="e.g. Synthwave Prime Rotation"
                  className="w-full px-3 py-1.5 rounded bg-surface-container border border-border-subtle text-xs text-on-surface focus:outline-none focus:border-border-focus"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-on-surface-variant mb-1">
                  Playlist Type
                </label>
                <select
                  value={newPlaylistType}
                  onChange={(e) => setNewPlaylistType(e.target.value)}
                  className="w-full px-3 py-1.5 rounded bg-surface-container border border-border-subtle text-xs text-on-surface focus:outline-none focus:border-border-focus"
                >
                  <option value="ROTATION">Standard General Rotation (Weighted)</option>
                  <option value="SCHEDULED">Scheduled Dayparting Window</option>
                  <option value="ONCE">Play Once at Scheduled Timestamp</option>
                  <option value="ADVANCED">Advanced Custom AutoDJ Script</option>
                </select>
              </div>

              <div>
                <div className="flex items-center justify-between font-mono text-xs mb-1">
                  <span className="text-on-surface-variant uppercase">Rotation Weight:</span>
                  <span className="text-primary-container font-bold">{newPlaylistWeight} / 10</span>
                </div>
                <input
                  type="range"
                  min={1}
                  max={10}
                  value={newPlaylistWeight}
                  onChange={(e) => setNewPlaylistWeight(parseInt(e.target.value))}
                  className="w-full accent-primary-container h-1 bg-surface-container rounded-lg cursor-pointer"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setCreating(false)}
                  className="px-3 py-1.5 rounded bg-surface-container hover:bg-surface-elevated text-on-surface-variant text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded bg-primary-container text-on-primary-container font-semibold text-xs shadow-photonic"
                >
                  Create Playlist
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Main Grid: Left Playlists List vs Right Track Items & Ingestion */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Playlists Left Ribbon (4 cols) */}
        <div className="lg:col-span-4 space-y-3">
          <div className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider px-1">
            Active Rotations ({playlists.length})
          </div>

          <div className="space-y-2">
            {playlists.map((pl) => {
              const isSelected = pl.id === activePlaylistId;

              return (
                <div
                  key={pl.id}
                  onClick={() => setActivePlaylistId(pl.id)}
                  className={`p-3.5 rounded-lg border cursor-pointer transition-all ${
                    isSelected
                      ? "bg-surface-elevated border-border-focus shadow-photonic"
                      : "bg-surface-panel border-border-subtle hover:bg-surface-container"
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-sm font-bold text-on-surface">{pl.name}</span>
                    <span className="px-1.5 py-0.2 rounded bg-surface-container text-primary font-mono text-[9px] font-bold">
                      {pl.type}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-xs font-mono text-on-surface-variant">
                    <span>{pl.items.length} Tracks Queued</span>
                    <span className="text-tertiary">Weight: {pl.weight}/10</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Playlist Tracks & Vault Selector Right (8 cols) */}
        <div className="lg:col-span-8 space-y-5">
          {activePlaylist ? (
            <div className="p-5 rounded-lg bg-surface-panel border border-border-subtle space-y-4 shadow-panel">
              <div className="flex items-center justify-between border-b border-border-subtle pb-3">
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-sm font-bold text-on-surface">{activePlaylist.name}</h2>
                    <span className="px-1.5 py-0.2 rounded bg-tertiary-container/20 text-tertiary font-mono text-[9px] font-bold">
                      ACTIVE AUTODJ
                    </span>
                  </div>
                  <div className="text-xs text-on-surface-variant font-mono">
                    Rotation Mode: {activePlaylist.playMode} • Weight: {activePlaylist.weight}
                  </div>
                </div>

                <div className="flex items-center gap-2 text-xs font-mono">
                  <span className="text-primary-container">
                    Total Duration:{" "}
                    {formatDuration(
                      activePlaylist.items.reduce(
                        (acc, i) => acc + (i.mediaFile?.duration || 0),
                        0
                      )
                    )}
                  </span>
                </div>
              </div>

              {/* Items in Active Playlist */}
              <div className="space-y-2">
                <span className="text-[10px] uppercase font-mono font-semibold text-on-surface-variant tracking-wider">
                  Queued Tracks ({activePlaylist.items.length})
                </span>

                {activePlaylist.items.length === 0 ? (
                  <div className="p-6 rounded bg-surface-container text-center text-xs text-on-surface-variant">
                    No tracks assigned to this rotation. Add tracks from the vault below.
                  </div>
                ) : (
                  <div className="divide-y divide-border-subtle/50 rounded bg-surface-container border border-border-subtle">
                    {activePlaylist.items.map((item, idx) => (
                      <div
                        key={item.id}
                        className="p-2.5 flex items-center justify-between gap-3 text-xs"
                      >
                        <div className="flex items-center gap-3">
                          <span className="font-mono text-xs text-on-surface-variant w-4 text-center">
                            {idx + 1}
                          </span>
                          <div>
                            <div className="font-bold text-on-surface">
                              {item.mediaFile?.title}
                            </div>
                            <div className="text-[11px] text-on-surface-variant">
                              {item.mediaFile?.artist}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-3 font-mono">
                          <span className="text-on-surface-variant text-[11px]">
                            {formatDuration(item.mediaFile?.duration || 0)}
                          </span>
                          <span className="px-1.5 py-0.2 rounded bg-surface-container-high text-primary-container text-[10px]">
                            Fade: {item.cueFadeSec}s
                          </span>
                          <button
                            onClick={() => handleRemoveTrack(item.id)}
                            className="p-1 rounded hover:bg-surface-container-high text-error"
                            title="Remove Track"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Add from Media Vault Selector */}
              <div className="pt-3 border-t border-border-subtle space-y-2">
                <span className="text-[10px] uppercase font-mono font-semibold text-on-surface-variant tracking-wider">
                  Available Media Vault Tracks
                </span>

                <div className="max-h-56 overflow-y-auto rounded bg-surface-container border border-border-subtle divide-y divide-border-subtle/50 text-xs">
                  {stationMedia.map((m) => {
                    const isAlreadyIn = activePlaylist.items.some(
                      (i) => i.mediaFileId === m.id
                    );

                    return (
                      <div
                        key={m.id}
                        className="p-2 flex items-center justify-between hover:bg-surface-elevated transition-colors"
                      >
                        <div>
                          <div className="font-bold text-on-surface">{m.title}</div>
                          <div className="text-[10px] text-on-surface-variant">
                            {m.artist} • {formatDuration(m.duration)} • LUFS: {m.lufs}
                          </div>
                        </div>

                        <button
                          disabled={isAlreadyIn}
                          onClick={() => handleAddTrackToPlaylist(m.id)}
                          className={`flex items-center gap-1 px-2.5 py-1 rounded text-xs font-semibold font-mono transition-colors ${
                            isAlreadyIn
                              ? "bg-surface-container-high text-on-surface-variant/50 cursor-not-allowed"
                              : "bg-primary-container text-on-primary-container hover:bg-primary shadow-photonic"
                          }`}
                        >
                          <Plus className="w-3 h-3" />
                          <span>{isAlreadyIn ? "In Playlist" : "Add to Rotation"}</span>
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          ) : (
            <div className="p-8 rounded bg-surface-panel text-center text-xs text-on-surface-variant">
              Select or create a playlist on the left.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
