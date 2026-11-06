import type { Metadata } from "next";
import { MarketingShell } from "@/components/marketing/MarketingShell";
import { ContactForm } from "./ContactForm";

export const metadata: Metadata = {
  title: "Contact — Radiofy",
  description: "Contact the Radiofy operators.",
};

export default function ContactPage() {
  return (
    <MarketingShell title="Contact">
      <p className="text-slate-300 mb-6 max-w-xl">
        Send a message to the platform operators. This stores the request on the server. It does
        not send email unless outbound mail is configured later.
      </p>
      <ContactForm />
    </MarketingShell>
  );
}
