import Link from "next/link";
import { Radio } from "lucide-react";

const links = [
  { href: "/features", label: "Features" },
  { href: "/pricing", label: "Pricing" },
  { href: "/about", label: "About" },
  { href: "/help", label: "Help" },
  { href: "/contact", label: "Contact" },
];

export function MarketingShell({
  title,
  children,
}: {
  title?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[#070b12] text-slate-100">
      <header className="border-b border-white/10">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between gap-4">
          <Link href="/" className="flex items-center gap-2 font-semibold">
            <Radio className="w-5 h-5 text-cyan-300" />
            Radiofy
          </Link>
          <nav className="hidden md:flex items-center gap-5 text-sm text-slate-300">
            {links.map((l) => (
              <Link key={l.href} href={l.href} className="hover:text-white">
                {l.label}
              </Link>
            ))}
          </nav>
          <div className="flex items-center gap-2 text-sm">
            <Link href="/login" className="px-3 py-1.5 text-slate-200">
              Log in
            </Link>
            <Link
              href="/register"
              className="px-3 py-1.5 rounded bg-cyan-400 text-slate-950 font-semibold"
            >
              Start station
            </Link>
          </div>
        </div>
        <nav className="md:hidden px-4 pb-3 flex gap-4 overflow-x-auto text-sm text-slate-300">
          {links.map((l) => (
            <Link key={l.href} href={l.href} className="shrink-0">
              {l.label}
            </Link>
          ))}
        </nav>
      </header>
      <main className="max-w-6xl mx-auto px-4 py-12">
        {title ? <h1 className="text-3xl font-semibold tracking-tight mb-6">{title}</h1> : null}
        {children}
      </main>
      <footer className="border-t border-white/10 py-8 text-sm text-slate-400">
        <div className="max-w-6xl mx-auto px-4 flex flex-wrap gap-4 justify-between">
          <span>Radiofy — independent internet radio hosting.</span>
          <div className="flex gap-4">
            <Link href="/terms">Terms</Link>
            <Link href="/privacy">Privacy</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
