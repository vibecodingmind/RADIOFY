import Link from "next/link";

export function MarketingHomeHero() {
  return (
    <section className="max-w-3xl">
      <p className="text-cyan-300 text-sm font-medium mb-3">Internet radio control plane</p>
      <h1 className="text-4xl md:text-5xl font-semibold tracking-tight leading-tight">
        Run your station from one broadcaster console.
      </h1>
      <p className="mt-4 text-slate-300 text-lg">
        Radiofy is independent hosting software for organizations that publish internet radio: stations,
        media, playlists, schedules, team roles, and subscriptions. Streaming uses Icecast and optional
        Liquidsoap on infrastructure you control.
      </p>
      <div className="mt-8 flex flex-wrap gap-3">
        <Link href="/register" className="px-4 py-2 rounded bg-cyan-400 text-slate-950 font-semibold">
          Create an account
        </Link>
        <Link href="/pricing" className="px-4 py-2 rounded border border-white/15">
          View plans
        </Link>
      </div>
    </section>
  );
}
