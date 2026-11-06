"use client";

import { useState } from "react";
import { Loader2, Save } from "lucide-react";

interface OrgSettings {
  id: string;
  name: string;
  slug: string;
  contactEmail: string;
  timezone: string;
  defaultLanguage: string;
}

export function SettingsClient({
  org,
  operatorName,
  operatorEmail,
}: {
  org: OrgSettings;
  operatorName: string;
  operatorEmail: string;
}) {
  const [name, setName] = useState(org.name);
  const [contactEmail, setContactEmail] = useState(org.contactEmail);
  const [timezone, setTimezone] = useState(org.timezone);
  const [defaultLanguage, setDefaultLanguage] = useState(org.defaultLanguage);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setNotice(null);
    try {
      const res = await fetch(`/api/orgs/${org.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, contactEmail, timezone, defaultLanguage }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Update failed");
      setNotice("Organization settings saved.");
    } catch (err) {
      setNotice(err instanceof Error ? err.message : "Update failed");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-mono">
        <div>
          <label className="block text-[11px] text-on-surface-variant mb-1">ORGANIZATION NAME</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full p-2.5 rounded bg-surface-container border border-border-subtle font-bold text-on-surface"
          />
        </div>
        <div>
          <label className="block text-[11px] text-on-surface-variant mb-1">SYSTEM SLUG</label>
          <div className="p-2.5 rounded bg-surface-container border border-border-subtle text-primary-container">
            {org.slug}
          </div>
        </div>
        <div>
          <label className="block text-[11px] text-on-surface-variant mb-1">CONTACT EMAIL</label>
          <input
            type="email"
            value={contactEmail}
            onChange={(e) => setContactEmail(e.target.value)}
            className="w-full p-2.5 rounded bg-surface-container border border-border-subtle text-on-surface"
          />
        </div>
        <div>
          <label className="block text-[11px] text-on-surface-variant mb-1">TIMEZONE</label>
          <input
            value={timezone}
            onChange={(e) => setTimezone(e.target.value)}
            className="w-full p-2.5 rounded bg-surface-container border border-border-subtle text-on-surface"
          />
        </div>
        <div>
          <label className="block text-[11px] text-on-surface-variant mb-1">DEFAULT LANGUAGE</label>
          <input
            value={defaultLanguage}
            onChange={(e) => setDefaultLanguage(e.target.value)}
            className="w-full p-2.5 rounded bg-surface-container border border-border-subtle text-on-surface"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-mono pt-2 border-t border-border-subtle">
        <div>
          <span className="text-[11px] text-on-surface-variant block mb-1">OPERATOR</span>
          <div className="p-2.5 rounded bg-surface-container border border-border-subtle">{operatorName}</div>
        </div>
        <div>
          <span className="text-[11px] text-on-surface-variant block mb-1">EMAIL</span>
          <div className="p-2.5 rounded bg-surface-container border border-border-subtle">{operatorEmail}</div>
        </div>
      </div>

      {notice && <p className="text-xs text-primary-container">{notice}</p>}

      <button
        type="submit"
        disabled={saving}
        className="flex items-center gap-2 px-4 py-2 rounded bg-primary-container text-on-primary-container text-xs font-semibold"
      >
        {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
        Save settings
      </button>
    </form>
  );
}
