import type { Metadata } from "next";
import { MarketingShell } from "@/components/marketing/MarketingShell";

export const metadata: Metadata = {
  title: "Help — Radiofy",
  description: "How to start with Radiofy.",
};

export default function HelpPage() {
  return (
    <MarketingShell title="Help">
      <ol className="max-w-2xl space-y-3 text-slate-300 list-decimal pl-5">
        <li>Create an account and organization.</li>
        <li>Open the broadcaster console and create a station.</li>
        <li>Upload media and build a playlist.</li>
        <li>Start the station from the studio. Point a public player at the stream base URL.</li>
        <li>Invite teammates from Team and assign a role. The API enforces that role.</li>
      </ol>
      <p className="mt-6 text-sm text-slate-400">
        Streaming audio requires Icecast (and Liquidsoap when that mode is enabled) on your
        infrastructure. The web app does not invent a live encoder connection.
      </p>
    </MarketingShell>
  );
}
