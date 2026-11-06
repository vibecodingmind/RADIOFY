"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, CreditCard, Radio, Shield } from "lucide-react";

export function AdminSidebar({
  role,
}: {
  role: "SUPER_ADMIN" | "SUPPORT_ADMIN" | "BILLING_ADMIN" | "BROADCASTER";
}) {
  const pathname = usePathname();
  const items = [
    { href: "/admin", label: "Platform", icon: LayoutDashboard },
    ...(role === "SUPER_ADMIN" || role === "BILLING_ADMIN"
      ? [{ href: "/admin/gateways", label: "Payment gateways", icon: CreditCard }]
      : []),
  ];

  return (
    <aside className="hidden md:flex w-64 shrink-0 flex-col border-r border-white/10 bg-[#0B0E14]">
      <div className="h-16 px-4 flex items-center gap-2 border-b border-white/10">
        <Shield className="w-5 h-5 text-amber-300" />
        <div>
          <div className="text-sm font-semibold">Radiofy Admin</div>
          <div className="text-[10px] uppercase tracking-wider text-slate-400">Platform</div>
        </div>
      </div>
      <nav className="p-3 space-y-1">
        {items.map((item) => {
          const active = pathname === item.href;
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-2 px-3 py-2 rounded text-sm ${
                active ? "bg-amber-300 text-slate-950 font-semibold" : "text-slate-300 hover:bg-white/5"
              }`}
            >
              <Icon className="w-4 h-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>
      <div className="mt-auto p-3 border-t border-white/10">
        <Link
          href="/stations"
          className="flex items-center gap-2 px-3 py-2 rounded text-sm text-slate-300 hover:bg-white/5"
        >
          <Radio className="w-4 h-4" />
          Inspect broadcaster tools
        </Link>
      </div>
    </aside>
  );
}
