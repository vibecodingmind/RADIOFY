import type { Metadata } from "next";
import { MarketingShell } from "@/components/marketing/MarketingShell";

export const metadata: Metadata = {
  title: "Terms of Service — Radiofy",
  description: "Terms for using Radiofy.",
};

export default function TermsPage() {
  return (
    <MarketingShell title="Terms of Service">
      <div className="max-w-2xl space-y-3 text-sm text-slate-300">
        <p>These terms govern use of the Radiofy hosting application.</p>
        <p>
          You are responsible for the audio you upload and broadcast, including rights and licenses.
          Station limits follow the subscription plan attached to your organization.
        </p>
        <p>
          Platform administrators may suspend organizations or stations that abuse the service.
          Payment entitlements change only after a verified payment notification from the gateway.
        </p>
        <p>Replace this page with counsel-approved terms before a public commercial launch.</p>
      </div>
    </MarketingShell>
  );
}
