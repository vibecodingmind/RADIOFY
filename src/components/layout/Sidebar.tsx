"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Radio,
  PlusCircle,
  SlidersHorizontal,
  Bot,
  Music2,
  ListMusic,
  CalendarDays,
  Tv2,
  Users2,
  Activity,
  FileSpreadsheet,
  Globe,
  Code2,
  Palette,
  Users,
  Network,
  CreditCard,
  Settings,
} from "lucide-react";

interface SidebarProps {
  stationCount?: number;
}

interface NavItem {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
  count?: number;
  isAction?: boolean;
  isLive?: boolean;
  tag?: string;
}

interface NavSection {
  title: string;
  items: NavItem[];
}

export function Sidebar({ stationCount = 4 }: SidebarProps) {
  const pathname = usePathname();

  const navSections: NavSection[] = [
    {
      title: "OVERVIEW & STATIONS",
      items: [
        { name: "Overview", href: "/", icon: LayoutDashboard, badge: "HOST" },
        { name: "All Stations", href: "/stations", icon: Radio, count: stationCount },
        { name: "Create Station", href: "/stations/create", icon: PlusCircle, isAction: true },
      ],
    },
    {
      title: "BROADCASTING & MEDIA",
      items: [
        { name: "Live Control Room", href: "/broadcast/live", icon: SlidersHorizontal, isLive: true },
        { name: "AutoDJ Engines", href: "/broadcast/autodj", icon: Bot },
        { name: "Media Library", href: "/media", icon: Music2, tag: "FLAC/OPUS" },
        { name: "Playlists & Rotations", href: "/playlists", icon: ListMusic },
        { name: "Scheduling & Calendar", href: "/schedules", icon: CalendarDays },
        { name: "Shows & Programs", href: "/shows", icon: Tv2 },
        { name: "DJs & Presenters", href: "/team/djs", icon: Users2 },
      ],
    },
    {
      title: "INSIGHTS & TELEMETRY",
      items: [
        { name: "Live Analytics", href: "/analytics", icon: Activity },
        { name: "Reports & Royalty Logs", href: "/reports", icon: FileSpreadsheet },
      ],
    },
    {
      title: "CUSTOMIZATION & APIS",
      items: [
        { name: "Radio Web Players", href: "/players", icon: Globe },
        { name: "Embed Widgets & API", href: "/widgets", icon: Code2 },
        { name: "Station Branding", href: "/branding", icon: Palette },
      ],
    },
    {
      title: "INFRASTRUCTURE & ACCOUNT",
      items: [
        { name: "Team & Permissions", href: "/team", icon: Users },
        { name: "API & Stream Relays", href: "/relays", icon: Network },
        { name: "Billing & Capacity", href: "/billing", icon: CreditCard },
        { name: "Settings", href: "/settings", icon: Settings },
      ],
    },
  ];

  return (
    <aside className="fixed left-0 top-0 h-screen w-72 bg-surface-container-lowest border-r border-border-subtle z-40 flex flex-col justify-between select-none hidden md:flex">
      {/* Top Header / Brand */}
      <div className="flex flex-col min-h-0">
        <div className="h-16 px-4 flex items-center justify-between border-b border-border-subtle bg-surface-container-lowest/80 backdrop-blur-md">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded bg-primary-container/20 border border-primary-container/40 flex items-center justify-center text-primary-container">
              <Radio className="w-5 h-5 text-primary-container animate-pulse" />
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-1.5">
                <span className="font-semibold text-sm text-on-surface tracking-tight leading-none">
                  AetherCast
                </span>
                <span className="px-1.5 py-0.5 rounded bg-surface-container-high text-primary font-mono text-[10px] leading-none uppercase font-bold">
                  v4.2
                </span>
              </div>
              <span className="text-[10px] font-semibold text-on-surface-variant uppercase tracking-wider mt-0.5">
                BROADCAST OS
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1.5 px-2 py-1 rounded bg-surface-container-low border border-border-subtle">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-tertiary-container opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-tertiary-container"></span>
            </span>
            <span className="font-mono text-[10px] text-tertiary font-bold uppercase tracking-wider">
              ONLINE
            </span>
          </div>
        </div>

        {/* Scrollable Navigation */}
        <div className="overflow-y-auto px-3 py-3 space-y-4 max-h-[calc(100vh-10rem)]">
          {navSections.map((sec, idx) => (
            <div key={idx} className="space-y-1">
              <div className="px-2 pb-1 text-[10px] font-semibold text-on-surface-variant/70 tracking-wider uppercase">
                {sec.title}
              </div>
              {sec.items.map((item) => {
                const isActive = pathname === item.href;
                const Icon = item.icon;

                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={`flex items-center justify-between px-2.5 py-1.5 rounded text-xs transition-colors group ${
                      isActive
                        ? "bg-primary-container text-on-primary-container font-semibold shadow-photonic"
                        : "text-on-surface-variant hover:bg-surface-container hover:text-on-surface font-normal"
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <Icon
                        className={`w-4 h-4 shrink-0 ${
                          isActive
                            ? "text-on-primary-container"
                            : item.isLive
                            ? "text-live-tally-red"
                            : "text-on-surface-variant group-hover:text-primary-container"
                        }`}
                      />
                      <span className="truncate">{item.name}</span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      {item.isLive && (
                        <span className="w-2 h-2 rounded-full bg-live-tally-red animate-pulse" />
                      )}
                      {item.badge && (
                        <span
                          className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-bold uppercase ${
                            isActive
                              ? "bg-black/20 text-on-primary-container"
                              : "bg-surface-container-high text-primary"
                          }`}
                        >
                          {item.badge}
                        </span>
                      )}
                      {item.tag && (
                        <span className="text-[9px] font-mono text-on-surface-variant/70 px-1 py-0.5 rounded bg-surface-container">
                          {item.tag}
                        </span>
                      )}
                      {item.count !== undefined && (
                        <span className="font-mono text-xs px-1.5 py-0.2 rounded bg-surface-container-high text-on-surface-variant">
                          {item.count}
                        </span>
                      )}
                    </div>
                  </Link>
                );
              })}
            </div>
          ))}
        </div>
      </div>

      {/* Footer Edge Status */}
      <div className="p-3 border-t border-border-subtle bg-surface-container-lowest/80 backdrop-blur-md">
        <div className="p-2 rounded bg-surface-panel border border-border-subtle flex flex-col gap-1.5 text-xs">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-semibold text-on-surface-variant uppercase tracking-wider">
              STREAM ENCODER
            </span>
            <span className="font-mono text-[10px] text-tertiary font-bold">LOCAL</span>
          </div>
          <div className="flex items-center justify-between text-[11px]">
            <span className="text-on-surface flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-tertiary-container inline-block" />
              Broadcaster console
            </span>
          </div>
          <div className="flex items-center justify-between text-[10px] font-mono text-on-surface-variant pt-1 border-t border-border-subtle/50">
            <span>STREAMING NODE</span>
            <span className="text-primary-container">⚡</span>
          </div>
        </div>
      </div>
    </aside>
  );
}
