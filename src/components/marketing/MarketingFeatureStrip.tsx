export function MarketingFeatureStrip() {
  const cards = [
    ["Stations", "Create stations, mounts, and public player pages."],
    ["Library", "Upload audio, edit metadata, and build playlists."],
    ["Access", "Invite staff with roles that the API enforces."],
  ] as const;
  return (
    <section className="grid md:grid-cols-3 gap-4 mt-14">
      {cards.map(([title, body]) => (
        <div key={title} className="rounded-lg border border-white/10 p-4 bg-white/5">
          <h2 className="font-semibold">{title}</h2>
          <p className="text-sm text-slate-300 mt-2">{body}</p>
        </div>
      ))}
    </section>
  );
}
