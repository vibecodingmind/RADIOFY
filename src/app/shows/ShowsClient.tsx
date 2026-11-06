"use client";

import { useState } from "react";
import {
  Mic,
  Plus,
  Radio,
  Calendar,
  Clock,
  Trash2,
  ExternalLink,
  Users,
  Search,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  X,
} from "lucide-react";

interface Show {
  id: string;
  stationId: string;
  title: string;
  description: string | null;
  bannerUrl: string | null;
  hostName: string;
  colorCode: string;
  station: { id: string; name: string; slug: string };
  schedules: Array<{
    id: string;
    dayOfWeek: number;
    startTime: string;
    endTime: string;
    playlist: { id: string; name: string } | null;
  }>;
}

interface ShowsClientProps {
  initialShows: any[];
  stations: Array<{ id: string; name: string; slug: string }>;
  playlists: Array<{ id: string; name: string; stationId: string }>;
  userRole: string;
}

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const PRESET_COLORS = ["#00E5FF", "#00FF66", "#FFB703", "#9D4EDD", "#FF007F", "#3A86FF"];

export function ShowsClient({ initialShows, stations, playlists, userRole }: ShowsClientProps) {
  const [shows, setShows] = useState<Show[]>(initialShows);
  const [selectedStation, setSelectedStation] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // New Show Form State
  const [formData, setFormData] = useState({
    stationId: stations[0]?.id || "",
    title: "",
    hostName: "",
    description: "",
    colorCode: "#00E5FF",
    bannerUrl: "",
  });

  const filteredShows = shows.filter((show) => {
    const matchesStation = selectedStation === "ALL" || show.stationId === selectedStation;
    const matchesSearch =
      show.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      show.hostName.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStation && matchesSearch;
  });

  const handleCreateShow = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.hostName || !formData.stationId) return;

    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/shows", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to create show");

      setShows([data.show, ...shows]);
      setIsCreateOpen(false);
      setFormData({
        stationId: stations[0]?.id || "",
        title: "",
        hostName: "",
        description: "",
        colorCode: "#00E5FF",
        bannerUrl: "",
      });
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteShow = async (id: string) => {
    if (!confirm("Are you sure you want to remove this show program?")) return;

    try {
      const res = await fetch(`/api/shows?id=${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete show");
      setShows(shows.filter((s) => s.id !== id));
    } catch (err: any) {
      alert(err.message);
    }
  };

  return (
    <div className="p-8 max-w-[1600px] mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#1E293B] pb-6">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
              <Mic className="w-6 h-6 text-[#00E5FF]" />
              Shows & Program Roster
            </h1>
            <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-[#00E5FF]/10 text-[#00E5FF] border border-[#00E5FF]/20">
              {shows.length} TITLES
            </span>
          </div>
          <p className="text-sm text-slate-400 mt-1">
            Program scheduling, resident DJ broadcasts, and metadata syndication for on-air guides.
          </p>
        </div>

        <button
          onClick={() => setIsCreateOpen(true)}
          className="flex items-center gap-2 px-4 py-2 bg-[#00E5FF] hover:bg-[#00E5FF]/90 text-black font-semibold text-xs tracking-wide rounded-md transition shadow-[0_0_15px_rgba(0,229,255,0.25)]"
        >
          <Plus className="w-4 h-4" />
          CREATE PROGRAM
        </button>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <span className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Station:</span>
          <select
            value={selectedStation}
            onChange={(e) => setSelectedStation(e.target.value)}
            className="bg-[#10131a] border border-[#1E293B] text-white text-xs rounded-md px-3 py-1.5 focus:border-[#00E5FF] outline-none"
          >
            <option value="ALL">All Synchronized Stations</option>
            {stations.map((st) => (
              <option key={st.id} value={st.id}>
                {st.name}
              </option>
            ))}
          </select>
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search shows or hosts..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#10131a] border border-[#1E293B] pl-9 pr-4 py-1.5 text-xs text-white placeholder-slate-500 rounded-md focus:border-[#00E5FF] outline-none"
          />
        </div>
      </div>

      {/* Shows Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredShows.map((show) => (
          <div
            key={show.id}
            className="bg-[#111622] border border-[#1E293B] rounded-xl overflow-hidden hover:border-[#00E5FF]/50 transition-all flex flex-col group relative"
          >
            {/* Top Color Accent Bar */}
            <div
              className="h-2 w-full transition-all group-hover:h-3"
              style={{ backgroundColor: show.colorCode }}
            />

            <div className="p-6 flex-1 flex flex-col">
              <div className="flex items-start justify-between gap-2 mb-3">
                <span className="text-[10px] font-mono tracking-wider uppercase px-2 py-0.5 rounded bg-black/40 text-slate-300 border border-white/5">
                  {show.station.name}
                </span>

                <button
                  onClick={() => handleDeleteShow(show.id)}
                  className="opacity-0 group-hover:opacity-100 p-1.5 hover:bg-red-500/10 text-slate-400 hover:text-red-400 rounded transition"
                  title="Delete Show"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              <h3 className="text-lg font-bold text-white mb-1 group-hover:text-[#00E5FF] transition">
                {show.title}
              </h3>

              <div className="flex items-center gap-2 text-xs text-slate-300 mb-3">
                <Users className="w-3.5 h-3.5 text-[#00E5FF]" />
                <span className="font-medium text-white">{show.hostName}</span>
                <span className="text-slate-500">•</span>
                <span className="text-slate-400">Resident Host</span>
              </div>

              {show.description && (
                <p className="text-xs text-slate-400 line-clamp-2 mb-4 leading-relaxed">
                  {show.description}
                </p>
              )}

              {/* Schedules */}
              <div className="mt-auto pt-4 border-t border-[#1E293B]/60 space-y-2">
                <span className="text-[10px] font-bold tracking-wider text-slate-400 uppercase flex items-center gap-1.5">
                  <Calendar className="w-3 h-3 text-[#00E5FF]" />
                  Air Slots ({show.schedules?.length || 0})
                </span>

                {show.schedules && show.schedules.length > 0 ? (
                  <div className="space-y-1.5">
                    {show.schedules.map((slot) => (
                      <div
                        key={slot.id}
                        className="flex items-center justify-between text-xs bg-[#0B0E14] px-2.5 py-1.5 rounded border border-[#1E293B]"
                      >
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-white">
                            {DAYS[slot.dayOfWeek]}
                          </span>
                          <span className="text-slate-400 font-mono">
                            {slot.startTime} - {slot.endTime} UTC
                          </span>
                        </div>
                        {slot.playlist && (
                          <span className="text-[10px] text-[#00FF66] truncate max-w-[100px]">
                            {slot.playlist.name}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-[11px] text-slate-500 italic">
                    No recurring calendar slots set. AutoDJ is on standby.
                  </p>
                )}
              </div>
            </div>
          </div>
        ))}

        {filteredShows.length === 0 && (
          <div className="col-span-full py-16 text-center border border-dashed border-[#1E293B] rounded-xl bg-[#10131a]">
            <Mic className="w-10 h-10 text-slate-600 mx-auto mb-3" />
            <h3 className="text-base font-semibold text-white">No Programs Found</h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto mt-1 mb-4">
              Create your radio shows to assign live resident DJs or dedicated AutoDJ rotation rules.
            </p>
            <button
              onClick={() => setIsCreateOpen(true)}
              className="px-4 py-2 bg-[#00E5FF] text-black font-semibold text-xs rounded-md hover:bg-[#00E5FF]/90 transition"
            >
              CREATE FIRST PROGRAM
            </button>
          </div>
        )}
      </div>

      {/* Create Modal */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-[#10131a] border border-[#1E293B] rounded-xl w-full max-w-md overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between px-6 py-4 border-b border-[#1E293B]">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Mic className="w-4 h-4 text-[#00E5FF]" />
                Register New Radio Show
              </h3>
              <button
                onClick={() => setIsCreateOpen(false)}
                className="text-slate-400 hover:text-white transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateShow} className="p-6 space-y-4">
              {error && (
                <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-md text-xs text-red-400 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  {error}
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                  Station
                </label>
                <select
                  value={formData.stationId}
                  onChange={(e) => setFormData({ ...formData, stationId: e.target.value })}
                  className="w-full bg-[#0B0E14] border border-[#1E293B] rounded-md px-3 py-2 text-xs text-white focus:border-[#00E5FF] outline-none"
                >
                  {stations.map((st) => (
                    <option key={st.id} value={st.id}>
                      {st.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                  Show Title *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Synthwave After Dark"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full bg-[#0B0E14] border border-[#1E293B] rounded-md px-3 py-2 text-xs text-white focus:border-[#00E5FF] outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                  Host / Presenter Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. DJ Kaelen or Sarah Jenkins"
                  value={formData.hostName}
                  onChange={(e) => setFormData({ ...formData, hostName: e.target.value })}
                  className="w-full bg-[#0B0E14] border border-[#1E293B] rounded-md px-3 py-2 text-xs text-white focus:border-[#00E5FF] outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                  Description
                </label>
                <textarea
                  rows={3}
                  placeholder="Provide an overview of the show, musical format, and resident theme..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full bg-[#0B0E14] border border-[#1E293B] rounded-md px-3 py-2 text-xs text-white focus:border-[#00E5FF] outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                  Brand Color Accent
                </label>
                <div className="flex items-center gap-3">
                  {PRESET_COLORS.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setFormData({ ...formData, colorCode: c })}
                      className={`w-7 h-7 rounded-full border-2 transition ${
                        formData.colorCode === c ? "border-white scale-110" : "border-transparent"
                      }`}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
              </div>

              <div className="pt-4 flex items-center justify-end gap-3 border-t border-[#1E293B]">
                <button
                  type="button"
                  onClick={() => setIsCreateOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="px-4 py-2 bg-[#00E5FF] text-black font-semibold text-xs rounded-md hover:bg-[#00E5FF]/90 transition disabled:opacity-50"
                >
                  {isLoading ? "Creating..." : "Save Show"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
