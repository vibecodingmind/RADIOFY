"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { X, Radio, LayoutDashboard, PlusCircle, Music2, Activity, Settings } from "lucide-react";

const links = [
  { href: "/", label: "Overview", icon: LayoutDashboard },
  { href: "/stations", label: "Stations", icon: Radio },
  { href: "/stations/create", label: "Create Station", icon: PlusCircle },
  { href: "/media", label: "Media Library", icon: Music2 },
  { href: "/analytics", label: "Analytics", icon: Activity },
  { href: "/settings", label: "Settings", icon: Settings },
];

export function MobileSidebar({
  open,
  onClose,
  stationCount,
}: {
  open: boolean;
  onClose: () => void;
  stationCount?: number;
}) {
  const pathname = usePathname();
  if (!open) return null;

  return (
    <div className="md:hidden fixed inset-0 z-50">
      <button
        type="button"
        className="absolute inset-0 bg-black/60"
        aria-label="Close menu overlay"
        onClick={onClose}
      />
      <aside className="absolute left-0 top-0 h-full w-72 bg-surface-container-lowest border-r border-border-subtle p-4 flex flex-col">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Radio className="w-5 h-5 text-primary-container" />
            <span className="font-semibold text-sm">Radiofy</span>
            {stationCount != null && (
              <span className="text-[10px] font-mono text-on-surface-variant">{stationCount} ST</span>
            )}
          </div>
          <button type="button" onClick={onClose} aria-label="Close menu">
            <X className="w-5 h-5" />
          </button>
        </div>
        <nav className="space-y-1">
          {links.map((item) => {
            const Icon = item.icon;
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
                className={`flex items-center gap-2 px-3 py-2 rounded text-sm ${
                  active
                    ? "bg-primary-container text-on-primary-container font-semibold"
                    : "text-on-surface-variant hover:bg-surface-container"
                }`}
              >
                <Icon className="w-4 h-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>
      </aside>
    </div>
  );
}
