import Link from "next/link";

export function MarketingFaqTeaser() {
  return (
    <section className="mt-16 rounded-lg border border-white/10 p-6 bg-white/[0.03]">
      <h2 className="text-lg font-semibold mb-3">Questions</h2>
      <ul className="space-y-3 text-sm text-slate-300">
        <li>
          <strong className="text-slate-200">Is this AzuraCast?</strong> No. Radiofy is our own app; you
          may run Icecast or Liquidsoap as infrastructure.
        </li>
        <li>
          <strong className="text-slate-200">Where do I manage the station?</strong> After you sign in,
          use the broadcaster console for day-to-day operations.
        </li>
      </ul>
      <p className="mt-4 text-sm">
        <Link href="/help" className="text-cyan-300 underline">
          Help
        </Link>{" "}
        ·{" "}
        <Link href="/contact" className="text-cyan-300 underline">
          Contact
        </Link>
      </p>
    </section>
  );
}
