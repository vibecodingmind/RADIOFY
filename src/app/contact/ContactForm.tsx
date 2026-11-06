"use client";

import { useState } from "react";

export function ContactForm() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setStatus(null);
    try {
      const res = await fetch("/api/public/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, message }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not send");
      setStatus("Message received.");
      setMessage("");
    } catch (err: unknown) {
      setStatus(err instanceof Error ? err.message : "Could not send");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="max-w-lg space-y-3">
      <input
        required
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Name"
        className="w-full rounded bg-white/5 border border-white/10 px-3 py-2"
      />
      <input
        required
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Email"
        className="w-full rounded bg-white/5 border border-white/10 px-3 py-2"
      />
      <textarea
        required
        minLength={10}
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        placeholder="How can we help?"
        className="w-full min-h-32 rounded bg-white/5 border border-white/10 px-3 py-2"
      />
      <button
        type="submit"
        disabled={loading}
        className="px-4 py-2 rounded bg-cyan-400 text-slate-950 font-semibold disabled:opacity-60"
      >
        {loading ? "Sending…" : "Send"}
      </button>
      {status ? <p className="text-sm text-slate-300">{status}</p> : null}
    </form>
  );
}
