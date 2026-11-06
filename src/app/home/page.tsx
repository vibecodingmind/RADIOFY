import type { Metadata } from "next";
import Link from "next/link";
import { MarketingShell } from "@/components/marketing/MarketingShell";

export const metadata: Metadata = {
  title: "Radiofy — Internet radio hosting",
  description:
    "Host internet radio stations with a broadcaster console, AutoDJ, live ingest, and organization billing.",
};

export default function MarketingHomePage() {
  return (
    <MarketingShell>
      <section className="max-w-3xl">
        <p className="text-cyan-300 text-sm font-medium mb-3">Internet radio control plane</p>
        <h1 className="text-4xl md:text-5xl font-semibold tracking-tight leading-tight">
          Run your station from one broadcaster console.
        </h1>
        <p className="mt-4 text-slate-300 text-lg">
          Radiofy is our own hosting software for organizations that publish internet radio:
          stations, media, playlists, schedules, team roles, and subscriptions. Streaming uses
          Icecast and optional Liquidsoap on infrastructure you control.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link
            href="/register"
            className="px-4 py-2 rounded bg-cyan-400 text-slate-950 font-semibold"
          >
            Create an account
          </Link>
          <Link href="/pricing" className="px-4 py-2 rounded border border-white/15">
            View plans
          </Link>
        </div>
      </section>
      <section className="grid md:grid-cols-3 gap-4 mt-14">
        {[
          ["Stations", "Create stations, mounts, and public player pages."],
          ["Library", "Upload audio, edit metadata, and build playlists."],
          ["Access", "Invite staff with roles that the API enforces."],
        ].map(([title, body]) => (
          <div key={title} className="rounded-lg border border-white/10 p-4 bg-white/5">
            <h2 className="font-semibold">{title}</h2>
            <p className="text-sm text-slate-300 mt-2">{body}</p>
          </div>
        ))}
      </section>
    </MarketingShell>
  );
}
