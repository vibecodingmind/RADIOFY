"use client";

import { useState } from "react";
import {
  Music2,
  Upload,
  Search,
  Play,
  Pause,
  Trash2,
  Edit2,
  CheckCircle2,
  HardDrive,
  FileAudio,
  Plus,
  Radio,
  Sliders,
} from "lucide-react";
import { formatBytes } from "@/lib/utils";

interface MediaItem {
  id: string;
  stationId: string;
  title: string;
  artist: string;
  album: string | null;
  genre: string | null;
  duration: number;
  fileSize: string;
  mimeType: string;
  lufs: number;
  cueInSec: number;
  cueOutSec: number | null;
  artworkUrl: string | null;
  createdAt: Date | string;
}

interface StationSummary {
  id: string;
  name: string;
  slug: string;
}

interface MediaClientProps {
  stations: StationSummary[];
  initialStationId?: string;
  initialFiles: MediaItem[];
  storageUsedBytes: string;
  storageQuotaBytes: string;
}

export function MediaClient({
  stations,
  initialStationId,
  initialFiles,
  storageUsedBytes,
  storageQuotaBytes,
}: MediaClientProps) {
  const [selectedStationId, setSelectedStationId] = useState(
    initialStationId || stations[0]?.id || ""
  );
  const [files, setFiles] = useState<MediaItem[]>(initialFiles);
  const [searchQuery, setSearchQuery] = useState("");
  const [uploading, setUploading] = useState(false);
  const [activePreviewId, setActivePreviewId] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [editingFile, setEditingFile] = useState<MediaItem | null>(null);

  const used = BigInt(storageUsedBytes);
  const quota = BigInt(storageQuotaBytes);
  const percentUsed = quota > 0n ? Number((used * 100n) / quota) : 0;

  const filteredFiles = files.filter(
    (f) =>
      f.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      f.artist.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (f.album && f.album.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const fileList = e.target.files;
    if (!fileList || fileList.length === 0) return;

    setUploading(true);
    let successCount = 0;

    for (let i = 0; i < fileList.length; i++) {
      const file = fileList[i];
      const formData = new FormData();
      formData.append("file", file);
      formData.append("stationId", selectedStationId);

      try {
        const res = await fetch("/api/media/upload", {
          method: "POST",
          body: formData,
        });

        const data = await res.json();
        if (res.ok && data.mediaFile) {
          setFiles((prev) => [data.mediaFile, ...prev]);
          successCount++;
        }
      } catch (err) {
        console.error("Upload error:", err);
      }
    }

    setUploading(false);
    if (successCount > 0) {
      setNotice(`Successfully ingested ${successCount} audio stems into media vault`);
      setTimeout(() => setNotice(null), 4000);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete track from media vault?")) return;
    try {
      const res = await fetch(`/api/media/${id}`, { method: "DELETE" });
      if (res.ok) {
        setFiles((prev) => prev.filter((f) => f.id !== id));
        setNotice("Track removed from media vault");
        setTimeout(() => setNotice(null), 3000);
      }
    } catch (err) {
      alert("Failed to delete track");
    }
  }

  async function handleSaveMetadata(e: React.FormEvent) {
    e.preventDefault();
    if (!editingFile) return;

    try {
      const res = await fetch(`/api/media/${editingFile.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: editingFile.title,
          artist: editingFile.artist,
          album: editingFile.album,
          genre: editingFile.genre,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setFiles((prev) =>
          prev.map((f) => (f.id === editingFile.id ? data.mediaFile : f))
        );
        setEditingFile(null);
        setNotice("ID3 metadata tags updated");
        setTimeout(() => setNotice(null), 3000);
      }
    } catch {
      alert("Failed to save metadata");
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

      {/* Header & Station Selector */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border-subtle pb-4">
        <div>
          <h1 className="text-xl font-bold text-on-surface flex items-center gap-2">
            <Music2 className="w-5 h-5 text-primary-container" />
            <span>Broadcaster Media Vault</span>
          </h1>
          <p className="text-xs text-on-surface-variant">
            Upload audio stems, parse ID3 tags, and calculate broadcast EBU R128 LUFS levels
          </p>
        </div>

        {/* Station Select & Upload Trigger */}
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

          <label className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-primary-container hover:bg-primary text-on-primary-container font-semibold text-xs transition-all shadow-photonic cursor-pointer">
            <Upload className="w-3.5 h-3.5" />
            <span>{uploading ? "Ingesting..." : "Upload Audio"}</span>
            <input
              type="file"
              multiple
              accept="audio/*"
              disabled={uploading}
              onChange={handleFileUpload}
              className="hidden"
            />
          </label>
        </div>
      </div>

      {/* Storage Quota Ribbon */}
      <div className="p-3 rounded bg-surface-panel border border-border-subtle flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs font-mono">
        <div className="flex items-center gap-2">
          <HardDrive className="w-4 h-4 text-secondary" />
          <span className="text-on-surface font-semibold">Storage Vault Allocation:</span>
          <span className="text-primary-container">
            {formatBytes(Number(used))} / {formatBytes(Number(quota))}
          </span>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-64">
          <div className="flex-1 bg-surface-container h-1.5 rounded-full overflow-hidden">
            <div
              className="bg-primary-container h-full transition-all duration-300"
              style={{ width: `${percentUsed}%` }}
            />
          </div>
          <span className="text-on-surface-variant text-[11px] whitespace-nowrap">
            {percentUsed}% Used
          </span>
        </div>
      </div>

      {/* Search Input */}
      <div className="relative">
        <Search className="w-4 h-4 text-on-surface-variant absolute left-3 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Filter audio library by track title, artist, or album..."
          className="w-full pl-9 pr-3 py-2 rounded bg-surface-panel border border-border-subtle text-xs text-on-surface placeholder:text-on-surface-variant/50 focus:outline-none focus:border-border-focus"
        />
      </div>

      {/* Tracks Table */}
      <div className="rounded-lg bg-surface-panel border border-border-subtle overflow-hidden shadow-panel">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-b border-border-subtle text-[10px] uppercase font-mono font-semibold text-on-surface-variant tracking-wider bg-surface-container/40">
              <th className="py-2.5 px-3">Stem Title</th>
              <th className="py-2.5 px-3">Artist</th>
              <th className="py-2.5 px-3">Album / Year</th>
              <th className="py-2.5 px-3 text-right">Duration</th>
              <th className="py-2.5 px-3 text-center">LUFS</th>
              <th className="py-2.5 px-3 text-right">Size</th>
              <th className="py-2.5 px-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border-subtle/50 font-mono text-[11px]">
            {filteredFiles.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-8 text-center text-on-surface-variant">
                  No audio files found. Click “Upload Audio” to ingest tracks.
                </td>
              </tr>
            ) : (
              filteredFiles.map((file) => {
                const isPlaying = activePreviewId === file.id;

                return (
                  <tr key={file.id} className="hover:bg-surface-container/50 transition-colors group">
                    <td className="py-2.5 px-3 font-sans">
                      <div className="flex items-center gap-2.5">
                        <button
                          onClick={() => setActivePreviewId(isPlaying ? null : file.id)}
                          className="w-6 h-6 rounded-full bg-surface-container hover:bg-primary-container text-on-surface hover:text-on-primary-container flex items-center justify-center transition-colors shrink-0"
                          title="Preview Track"
                        >
                          {isPlaying ? (
                            <Pause className="w-3 h-3 fill-current" />
                          ) : (
                            <Play className="w-3 h-3 fill-current ml-0.5" />
                          )}
                        </button>
                        <div className="min-w-0">
                          <div className="font-bold text-on-surface truncate">{file.title}</div>
                          <div className="text-[10px] text-on-surface-variant font-mono">
                            {file.genre || "Variety"}
                          </div>
                        </div>
                      </div>
                    </td>

                    <td className="py-2.5 px-3 text-on-surface">{file.artist}</td>

                    <td className="py-2.5 px-3 text-on-surface-variant">
                      {file.album || "—"}
                    </td>

                    <td className="py-2.5 px-3 text-right text-on-surface">
                      {formatDuration(file.duration)}
                    </td>

                    <td className="py-2.5 px-3 text-center">
                      <span className="px-1.5 py-0.5 rounded bg-surface-container text-primary-container text-[10px] font-bold">
                        {file.lufs.toFixed(1)}
                      </span>
                    </td>

                    <td className="py-2.5 px-3 text-right text-on-surface-variant">
                      {formatBytes(Number(file.fileSize))}
                    </td>

                    <td className="py-2.5 px-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => setEditingFile(file)}
                          className="p-1 rounded hover:bg-surface-container text-on-surface-variant hover:text-on-surface"
                          title="Edit Metadata"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(file.id)}
                          className="p-1 rounded hover:bg-surface-container text-error"
                          title="Delete File"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Edit Metadata Modal */}
      {editingFile && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-surface-panel border border-border-subtle rounded-lg p-5 space-y-4 shadow-panel">
            <h3 className="text-sm font-bold text-on-surface uppercase tracking-wider">
              Edit Stem ID3 Metadata
            </h3>

            <form onSubmit={handleSaveMetadata} className="space-y-3 text-xs">
              <div>
                <label className="block text-[11px] font-semibold text-on-surface-variant mb-1">
                  Track Title
                </label>
                <input
                  type="text"
                  required
                  value={editingFile.title}
                  onChange={(e) => setEditingFile({ ...editingFile, title: e.target.value })}
                  className="w-full px-3 py-1.5 rounded bg-surface-container border border-border-subtle text-xs text-on-surface focus:outline-none focus:border-border-focus"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-on-surface-variant mb-1">
                  Artist Name
                </label>
                <input
                  type="text"
                  required
                  value={editingFile.artist}
                  onChange={(e) => setEditingFile({ ...editingFile, artist: e.target.value })}
                  className="w-full px-3 py-1.5 rounded bg-surface-container border border-border-subtle text-xs text-on-surface focus:outline-none focus:border-border-focus"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-on-surface-variant mb-1">
                  Album Name
                </label>
                <input
                  type="text"
                  value={editingFile.album || ""}
                  onChange={(e) => setEditingFile({ ...editingFile, album: e.target.value })}
                  className="w-full px-3 py-1.5 rounded bg-surface-container border border-border-subtle text-xs text-on-surface focus:outline-none focus:border-border-focus"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingFile(null)}
                  className="px-3 py-1.5 rounded bg-surface-container hover:bg-surface-elevated text-on-surface-variant text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded bg-primary-container text-on-primary-container font-semibold text-xs shadow-photonic"
                >
                  Save Tags
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
