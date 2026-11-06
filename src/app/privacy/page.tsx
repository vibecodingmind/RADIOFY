import type { Metadata } from "next";
import { MarketingShell } from "@/components/marketing/MarketingShell";

export const metadata: Metadata = {
  title: "Privacy Policy — Radiofy",
  description: "How Radiofy handles account and station data.",
};

export default function PrivacyPage() {
  return (
    <MarketingShell title="Privacy Policy">
      <div className="max-w-2xl space-y-3 text-sm text-slate-300">
        <p>
          Accounts store name, email, and a password hash. Organizations store station
          configuration, media metadata, team membership, and billing records.
        </p>
        <p>
          Payment card data is handled by Stripe, PayPal, or PesaPal. Radiofy stores gateway
          references and invoice amounts, not full card numbers.
        </p>
        <p>
          Contact form messages are stored as audit records so operators can reply. Do not submit
          passwords or stream keys in that form.
        </p>
        <p>Replace this page with a counsel-approved policy before a public commercial launch.</p>
      </div>
    </MarketingShell>
  );
}
