import type { Metadata } from "next";
import { MarketingShell } from "@/components/marketing/MarketingShell";

export const metadata: Metadata = {
  title: "Features — Radiofy",
  description: "Station management, media library, AutoDJ, live ingest, team roles, and billing.",
};

const items = [
  ["Station studio", "Create and configure stations, branding, and public players."],
  ["Media library", "Upload audio, read ID3 tags, and enforce storage quotas."],
  ["Playlists and schedules", "Rotations, shows, and calendar entries stored per station."],
  ["Live and AutoDJ", "Source credentials plus generated Liquidsoap configs when enabled."],
  ["Team roles", "Owner, managers, DJs, analytics, and billing roles checked on the server."],
  ["Billing", "Stripe, PayPal, and PesaPal checkouts activated only after verified webhooks."],
];

export default function FeaturesPage() {
  return (
    <MarketingShell title="Features">
      <ul className="grid md:grid-cols-2 gap-4">
        {items.map(([title, body]) => (
          <li key={title} className="rounded-lg border border-white/10 p-4 bg-white/5">
            <h2 className="font-semibold">{title}</h2>
            <p className="text-sm text-slate-300 mt-2">{body}</p>
          </li>
        ))}
      </ul>
    </MarketingShell>
  );
}
