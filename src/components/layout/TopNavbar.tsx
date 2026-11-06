"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Search,
  Radio,
  ChevronDown,
  Activity,
  BookOpen,
  Bell,
  Moon,
  LogOut,
  User,
  Shield,
  Check,
} from "lucide-react";

interface StationOption {
  id: string;
  name: string;
  format: string;
  bitrate: number;
  status: string;
}

interface TopNavbarProps {
  user?: {
    name: string;
    email: string;
    role: string;
    avatarUrl?: string | null;
  } | null;
  stations?: StationOption[];
  activeStationId?: string;
  onSelectStation?: (id: string) => void;
}

export function TopNavbar({
  user,
  stations = [
    { id: "1", name: "Neon Horizon FM", format: "Opus", bitrate: 320, status: "ON-AIR" },
    { id: "2", name: "Aether Chillout Lounge", format: "AAC", bitrate: 256, status: "ON-AIR" },
    { id: "3", name: "Tokyo Underground Bass", format: "MP3", bitrate: 320, status: "ON-AIR" },
    { id: "4", name: "Classical Echoes HD", format: "FLAC", bitrate: 320, status: "STANDBY" },
  ],
  activeStationId = "1",
  onSelectStation,
}: TopNavbarProps) {
  const router = useRouter();
  const [stationMenuOpen, setStationMenuOpen] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);

  const activeStation =
    stations.find((s) => s.id === activeStationId) || stations[0];

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  return (
    <header className="fixed top-0 right-0 left-0 md:left-72 h-16 bg-surface-container-lowest/90 backdrop-blur-md border-b border-border-subtle z-30 px-4 flex items-center justify-between">
      {/* Search Input */}
      <div className="flex-1 max-w-md hidden sm:block">
        <div className="relative">
          <Search className="w-4 h-4 text-on-surface-variant absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search tracks, presenters, stations, relays... ⌘K"
            className="w-full pl-9 pr-4 py-1.5 rounded bg-surface-panel border border-border-subtle text-xs text-on-surface placeholder:text-on-surface-variant/50 focus:outline-none focus:border-border-focus transition-colors"
          />
        </div>
      </div>

      {/* Right Action Cluster */}
      <div className="flex items-center gap-3">
        {/* Active Station Selector Pill */}
        <div className="relative">
          <button
            onClick={() => setStationMenuOpen(!stationMenuOpen)}
            className="flex items-center gap-2 px-2.5 py-1.5 rounded bg-surface-panel hover:bg-surface-elevated border border-border-subtle transition-colors"
          >
            <div className="w-2 h-2 rounded-full bg-tertiary-container animate-pulse" />
            <div className="flex items-center gap-1.5 text-xs">
              <span className="font-semibold text-on-surface">{activeStation?.name}</span>
              <span className="text-on-surface-variant">•</span>
              <span className="font-mono text-on-surface-variant text-[11px]">
                {activeStation?.bitrate}kbps {activeStation?.format}
              </span>
              <span className="px-1 py-0.5 rounded bg-tertiary-container/20 text-tertiary text-[9px] font-mono font-bold">
                {activeStation?.status}
              </span>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-on-surface-variant" />
          </button>

          {/* Station Switcher Dropdown */}
          {stationMenuOpen && (
            <div className="absolute right-0 mt-1 w-64 rounded bg-surface-elevated border border-border-subtle shadow-panel p-1.5 space-y-1 z-50">
              <div className="px-2 py-1 text-[10px] font-semibold text-on-surface-variant uppercase tracking-wider">
                Select Active Station
              </div>
              {stations.map((st) => (
                <button
                  key={st.id}
                  onClick={() => {
                    onSelectStation?.(st.id);
                    setStationMenuOpen(false);
                  }}
                  className="w-full flex items-center justify-between p-2 rounded hover:bg-surface-container text-left text-xs transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <Radio className="w-3.5 h-3.5 text-primary-container" />
                    <div>
                      <div className="font-semibold text-on-surface">{st.name}</div>
                      <div className="text-[10px] text-on-surface-variant font-mono">
                        {st.bitrate}kbps {st.format}
                      </div>
                    </div>
                  </div>
                  {st.id === activeStation?.id && (
                    <Check className="w-3.5 h-3.5 text-tertiary" />
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Global Toolbar Quick Buttons */}
        <div className="flex items-center gap-1 border-l border-border-subtle pl-2">
          <Link
            href="/analytics"
            className="p-1.5 rounded hover:bg-surface-panel text-on-surface-variant hover:text-on-surface transition-colors"
            title="Stream Health Telemetry"
          >
            <Activity className="w-4 h-4" />
          </Link>
          <Link
            href="/relays"
            className="p-1.5 rounded hover:bg-surface-panel text-on-surface-variant hover:text-on-surface transition-colors"
            title="Engine API Docs"
          >
            <BookOpen className="w-4 h-4" />
          </Link>
          <button
            className="relative p-1.5 rounded hover:bg-surface-panel text-on-surface-variant hover:text-on-surface transition-colors"
            title="Alerts"
          >
            <Bell className="w-4 h-4" />
            <span className="absolute top-1 right-1 w-3.5 h-3.5 rounded-full bg-live-tally-red text-white text-[9px] font-mono font-bold flex items-center justify-center">
              2
            </span>
          </button>
          <button
            className="p-1.5 rounded hover:bg-surface-panel text-on-surface-variant hover:text-on-surface transition-colors"
            title="Dark Broadcast Mode"
          >
            <Moon className="w-4 h-4" />
          </button>
        </div>

        {/* User Profile Dropdown */}
        <div className="relative border-l border-border-subtle pl-2">
          <button
            onClick={() => setProfileMenuOpen(!profileMenuOpen)}
            className="flex items-center gap-2 p-1 rounded hover:bg-surface-panel transition-colors"
          >
            <div className="text-right hidden sm:block">
              <div className="text-xs font-semibold text-on-surface leading-none">
                {user?.name || "Elena Rostova"}
              </div>
              <div className="text-[9px] font-mono text-primary-container uppercase tracking-wider mt-1 leading-none">
                {user?.role === "SUPER_ADMIN" ? "HQ SUPERADMIN" : "BROADCASTER"}
              </div>
            </div>
            {user?.avatarUrl ? (
              <img
                src={user.avatarUrl}
                alt={user.name}
                className="w-7 h-7 rounded-full object-cover border border-primary-container/40"
              />
            ) : (
              <div className="w-7 h-7 rounded-full bg-primary-container/20 border border-primary-container/40 flex items-center justify-center text-xs font-bold text-primary">
                {user?.name?.charAt(0) || "E"}
              </div>
            )}
          </button>

          {profileMenuOpen && (
            <div className="absolute right-0 mt-1 w-52 rounded bg-surface-elevated border border-border-subtle shadow-panel p-1.5 space-y-1 z-50">
              <div className="px-2 py-1 border-b border-border-subtle">
                <div className="text-xs font-semibold text-on-surface">{user?.name}</div>
                <div className="text-[11px] text-on-surface-variant truncate">{user?.email}</div>
              </div>
              <Link
                href="/settings"
                onClick={() => setProfileMenuOpen(false)}
                className="flex items-center gap-2 px-2 py-1.5 rounded hover:bg-surface-container text-xs text-on-surface"
              >
                <User className="w-3.5 h-3.5 text-on-surface-variant" />
                <span>Operator Profile</span>
              </Link>
              {user?.role === "SUPER_ADMIN" && (
                <Link
                  href="/admin"
                  onClick={() => setProfileMenuOpen(false)}
                  className="flex items-center gap-2 px-2 py-1.5 rounded hover:bg-surface-container text-xs text-[#00E5FF] font-semibold"
                >
                  <Shield className="w-3.5 h-3.5 text-[#00E5FF]" />
                  <span>HQ Superadmin Cockpit</span>
                </Link>
              )}
              <Link
                href="/team"
                onClick={() => setProfileMenuOpen(false)}
                className="flex items-center gap-2 px-2 py-1.5 rounded hover:bg-surface-container text-xs text-on-surface"
              >
                <Shield className="w-3.5 h-3.5 text-on-surface-variant" />
                <span>Team & Permissions</span>
              </Link>
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-2 px-2 py-1.5 rounded hover:bg-error-container/20 text-xs text-error transition-colors text-left"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Disconnect Console</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
