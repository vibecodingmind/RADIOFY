import type { Metadata } from "next";
import { MarketingShell } from "@/components/marketing/MarketingShell";

export const metadata: Metadata = {
  title: "About — Radiofy",
  description: "What Radiofy is and what it is not.",
};

export default function AboutPage() {
  return (
    <MarketingShell title="About">
      <div className="max-w-2xl space-y-4 text-slate-300">
        <p>
          Radiofy is an independent internet radio hosting application. The product, dashboards,
          and business logic are ours. Icecast and Liquidsoap can run as infrastructure beside the
          app. Radiofy does not embed or rebrand another complete radio hosting product.
        </p>
        <p>
          Organizations get a broadcaster console. Platform operators get a separate administration
          area for customers, stations, and payment gateways.
        </p>
      </div>
    </MarketingShell>
  );
}
