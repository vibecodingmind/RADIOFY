"use client";

import { useState } from "react";
import {
  Calendar as CalendarIcon,
  Clock,
  Plus,
  Trash2,
  Radio,
  Music,
  CheckCircle2,
  AlertCircle,
  X,
  Filter,
} from "lucide-react";

interface Schedule {
  id: string;
  stationId: string;
  showId: string | null;
  playlistId: string | null;
  title: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  isRecurring: boolean;
  station: { id: string; name: string; slug: string };
  show: { id: string; title: string; hostName: string; colorCode: string } | null;
  playlist: { id: string; name: string; type: string } | null;
}

interface SchedulesClientProps {
  initialSchedules: Schedule[];
  stations: Array<{ id: string; name: string; slug: string }>;
  shows: Array<{ id: string; title: string; hostName: string; colorCode: string; stationId: string }>;
  playlists: Array<{ id: string; name: string; stationId: string; type: string }>;
}

const DAYS = [
  { index: 1, name: "Monday" },
  { index: 2, name: "Tuesday" },
  { index: 3, name: "Wednesday" },
  { index: 4, name: "Thursday" },
  { index: 5, name: "Friday" },
  { index: 6, name: "Saturday" },
  { index: 0, name: "Sunday" },
];

export function SchedulesClient({
  initialSchedules,
  stations,
  shows,
  playlists,
}: SchedulesClientProps) {
  const [schedules, setSchedules] = useState<Schedule[]>(initialSchedules);
  const [selectedStation, setSelectedStation] = useState<string>("ALL");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // New slot form
  const [formData, setFormData] = useState({
    stationId: stations[0]?.id || "",
    showId: "",
    playlistId: "",
    title: "",
    dayOfWeek: "1",
    startTime: "12:00",
    endTime: "14:00",
    isRecurring: true,
  });

  const filteredSchedules = schedules.filter((s) => {
    return selectedStation === "ALL" || s.stationId === selectedStation;
  });

  const handleShowSelect = (showId: string) => {
    const selected = shows.find((sh) => sh.id === showId);
    setFormData((prev) => ({
      ...prev,
      showId,
      title: selected ? selected.title : prev.title,
    }));
  };

  const handleCreateSlot = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/schedules", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to create schedule slot");

      setSchedules([...schedules, data.schedule]);
      setIsModalOpen(false);
      setFormData({
        stationId: stations[0]?.id || "",
        showId: "",
        playlistId: "",
        title: "",
        dayOfWeek: "1",
        startTime: "12:00",
        endTime: "14:00",
        isRecurring: true,
      });
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteSlot = async (id: string) => {
    if (!confirm("Are you sure you want to remove this scheduled air slot?")) return;

    try {
      const res = await fetch(`/api/schedules?id=${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to remove slot");
      setSchedules(schedules.filter((s) => s.id !== id));
    } catch (err: any) {
      alert(err.message);
    }
  };

  return (
    <div className="p-8 max-w-[1700px] mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#1E293B] pb-6">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
              <CalendarIcon className="w-6 h-6 text-[#00E5FF]" />
              Broadcast Calendar & Air Schedule
            </h1>
            <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-[#00FF66]/10 text-[#00FF66] border border-[#00FF66]/20 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[#00FF66] animate-pulse" />
              UTC TIMELINE
            </span>
          </div>
          <p className="text-sm text-slate-400 mt-1">
            Weekly 7-day synchronization matrix for resident live presenters, automated rotation decks, and special programs.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-[#00E5FF] hover:bg-[#00E5FF]/90 text-black font-semibold text-xs tracking-wide rounded-md transition shadow-[0_0_15px_rgba(0,229,255,0.25)]"
          >
            <Plus className="w-4 h-4" />
            SCHEDULE AIR SLOT
          </button>
        </div>
      </div>

      {/* Filter and Status */}
      <div className="flex items-center justify-between bg-[#111622] border border-[#1E293B] p-4 rounded-xl">
        <div className="flex items-center gap-3">
          <Filter className="w-4 h-4 text-[#00E5FF]" />
          <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
            Filter Station:
          </span>
          <select
            value={selectedStation}
            onChange={(e) => setSelectedStation(e.target.value)}
            className="bg-[#0B0E14] border border-[#1E293B] text-white text-xs rounded-md px-3 py-1.5 focus:border-[#00E5FF] outline-none"
          >
            <option value="ALL">All Synchronized Stations</option>
            {stations.map((st) => (
              <option key={st.id} value={st.id}>
                {st.name}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-4 text-xs text-slate-400">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#00E5FF]" />
            <span>Show Program</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#00FF66]" />
            <span>AutoDJ Rotation</span>
          </div>
        </div>
      </div>

      {/* 7-Day Weekly Grid */}
      <div className="grid grid-cols-1 md:grid-cols-7 gap-4">
        {DAYS.map((day) => {
          const daySlots = filteredSchedules
            .filter((s) => s.dayOfWeek === day.index)
            .sort((a, b) => a.startTime.localeCompare(b.startTime));

          return (
            <div
              key={day.index}
              className="bg-[#10131a] border border-[#1E293B] rounded-xl overflow-hidden flex flex-col min-h-[500px]"
            >
              {/* Day Header */}
              <div className="bg-[#111622] px-4 py-3 border-b border-[#1E293B] flex items-center justify-between">
                <span className="text-sm font-bold text-white tracking-wide">
                  {day.name}
                </span>
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-black/40 text-slate-400 border border-white/5">
                  {daySlots.length} SLOTS
                </span>
              </div>

              {/* Slots List */}
              <div className="p-3 space-y-3 flex-1 overflow-y-auto">
                {daySlots.map((slot) => {
                  const accentColor = slot.show?.colorCode || "#00FF66";

                  return (
                    <div
                      key={slot.id}
                      className="bg-[#0B0E14] border border-[#1E293B] rounded-lg p-3 hover:border-slate-600 transition relative group flex flex-col gap-1.5 shadow-sm"
                      style={{ borderLeftWidth: "3px", borderLeftColor: accentColor }}
                    >
                      <div className="flex items-start justify-between gap-1">
                        <span className="text-xs font-bold text-white leading-tight group-hover:text-[#00E5FF] transition">
                          {slot.title}
                        </span>
                        <button
                          onClick={() => handleDeleteSlot(slot.id)}
                          className="opacity-0 group-hover:opacity-100 p-1 text-slate-500 hover:text-red-400 rounded transition"
                          title="Remove Slot"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <div className="flex items-center gap-1.5 text-[11px] font-mono text-[#00E5FF]">
                        <Clock className="w-3 h-3" />
                        <span>
                          {slot.startTime} - {slot.endTime}
                        </span>
                      </div>

                      {slot.show && (
                        <div className="text-[11px] text-slate-400 flex items-center gap-1">
                          <span className="text-slate-500">Host:</span>
                          <span className="text-slate-300 font-medium">{slot.show.hostName}</span>
                        </div>
                      )}

                      {slot.playlist && (
                        <div className="text-[10px] text-[#00FF66] flex items-center gap-1 truncate">
                          <Music className="w-3 h-3 flex-shrink-0" />
                          <span className="truncate">{slot.playlist.name}</span>
                        </div>
                      )}

                      <div className="mt-1 pt-1.5 border-t border-white/5 flex items-center justify-between text-[10px] text-slate-500">
                        <span className="truncate max-w-[100px]">{slot.station.name}</span>
                        {slot.isRecurring && <span className="text-slate-400 font-mono">RECUR</span>}
                      </div>
                    </div>
                  );
                })}

                {daySlots.length === 0 && (
                  <div className="h-full flex flex-col items-center justify-center py-12 text-slate-600 text-center">
                    <Clock className="w-6 h-6 mb-2 stroke-1" />
                    <span className="text-xs">AutoDJ General Deck</span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Schedule Slot Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-[#10131a] border border-[#1E293B] rounded-xl w-full max-w-lg overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between px-6 py-4 border-b border-[#1E293B]">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <CalendarIcon className="w-4 h-4 text-[#00E5FF]" />
                Schedule Broadcast Air Slot
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-white transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateSlot} className="p-6 space-y-4">
              {error && (
                <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-md text-xs text-red-400 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  {error}
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                  Target Radio Station *
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
                  Link Registered Show Program (Optional)
                </label>
                <select
                  value={formData.showId}
                  onChange={(e) => handleShowSelect(e.target.value)}
                  className="w-full bg-[#0B0E14] border border-[#1E293B] rounded-md px-3 py-2 text-xs text-white focus:border-[#00E5FF] outline-none"
                >
                  <option value="">-- Custom Slot / Rotation --</option>
                  {shows.map((sh) => (
                    <option key={sh.id} value={sh.id}>
                      {sh.title} (Host: {sh.hostName})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                  Slot Display Title *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Synthwave After Dark with DJ Kaelen"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full bg-[#0B0E14] border border-[#1E293B] rounded-md px-3 py-2 text-xs text-white focus:border-[#00E5FF] outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                  Fallback AutoDJ Playlist (Optional)
                </label>
                <select
                  value={formData.playlistId}
                  onChange={(e) => setFormData({ ...formData, playlistId: e.target.value })}
                  className="w-full bg-[#0B0E14] border border-[#1E293B] rounded-md px-3 py-2 text-xs text-white focus:border-[#00E5FF] outline-none"
                >
                  <option value="">-- Station General Deck --</option>
                  {playlists.map((pl) => (
                    <option key={pl.id} value={pl.id}>
                      {pl.name} ({pl.type})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                    Day of Week
                  </label>
                  <select
                    value={formData.dayOfWeek}
                    onChange={(e) => setFormData({ ...formData, dayOfWeek: e.target.value })}
                    className="w-full bg-[#0B0E14] border border-[#1E293B] rounded-md px-3 py-2 text-xs text-white focus:border-[#00E5FF] outline-none"
                  >
                    <option value="1">Monday</option>
                    <option value="2">Tuesday</option>
                    <option value="3">Wednesday</option>
                    <option value="4">Thursday</option>
                    <option value="5">Friday</option>
                    <option value="6">Saturday</option>
                    <option value="0">Sunday</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                    Start (UTC)
                  </label>
                  <input
                    type="time"
                    required
                    value={formData.startTime}
                    onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                    className="w-full bg-[#0B0E14] border border-[#1E293B] rounded-md px-3 py-2 text-xs text-white focus:border-[#00E5FF] outline-none font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                    End (UTC)
                  </label>
                  <input
                    type="time"
                    required
                    value={formData.endTime}
                    onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                    className="w-full bg-[#0B0E14] border border-[#1E293B] rounded-md px-3 py-2 text-xs text-white focus:border-[#00E5FF] outline-none font-mono"
                  />
                </div>
              </div>

              <div className="pt-4 flex items-center justify-end gap-3 border-t border-[#1E293B]">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="px-4 py-2 bg-[#00E5FF] text-black font-semibold text-xs rounded-md hover:bg-[#00E5FF]/90 transition disabled:opacity-50"
                >
                  {isLoading ? "Saving..." : "Add to Broadcast Schedule"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
