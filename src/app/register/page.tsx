"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Radio, Lock, Mail, User, Building2, ArrowRight } from "lucide-react";

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [orgName, setOrgName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password, orgName }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to register");
      }

      router.push("/");
      router.refresh();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-surface-container-lowest text-on-surface flex flex-col justify-center items-center px-4 py-12 relative overflow-hidden">
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 bg-primary-container/10 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md z-10 space-y-6">
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-surface-panel border border-border-subtle">
            <Radio className="w-4 h-4 text-primary-container" />
            <span className="text-xs font-semibold uppercase tracking-wider text-primary-container">
              AetherCast Broadcast OS v4.2
            </span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-on-surface">
            Broadcaster Registration
          </h1>
          <p className="text-sm text-on-surface-variant">
            Provision your high-availability radio hosting organization
          </p>
        </div>

        <div className="p-6 rounded-lg bg-surface-panel border border-border-subtle shadow-panel space-y-5">
          {error && (
            <div className="p-3 rounded bg-error-container/30 border border-error/50 text-error text-xs flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-error" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleRegister} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-on-surface-variant uppercase tracking-wider mb-1.5">
                Full Name
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-on-surface-variant absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Sarah Jenkins"
                  className="w-full pl-9 pr-3 py-2 rounded bg-surface-container-lowest border border-border-subtle text-sm text-on-surface placeholder:text-on-surface-variant/50 focus:outline-none focus:border-border-focus transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-on-surface-variant uppercase tracking-wider mb-1.5">
                Work / Station Email
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-on-surface-variant absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="sarah@chilloutradio.fm"
                  className="w-full pl-9 pr-3 py-2 rounded bg-surface-container-lowest border border-border-subtle text-sm text-on-surface placeholder:text-on-surface-variant/50 focus:outline-none focus:border-border-focus transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-on-surface-variant uppercase tracking-wider mb-1.5">
                Radio Station / Group Name
              </label>
              <div className="relative">
                <Building2 className="w-4 h-4 text-on-surface-variant absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  value={orgName}
                  onChange={(e) => setOrgName(e.target.value)}
                  placeholder="Chillout Sound Network"
                  className="w-full pl-9 pr-3 py-2 rounded bg-surface-container-lowest border border-border-subtle text-sm text-on-surface placeholder:text-on-surface-variant/50 focus:outline-none focus:border-border-focus transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-on-surface-variant uppercase tracking-wider mb-1.5">
                Master Security Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-on-surface-variant absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  required
                  minLength={8}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Minimum 8 characters"
                  className="w-full pl-9 pr-3 py-2 rounded bg-surface-container-lowest border border-border-subtle text-sm text-on-surface placeholder:text-on-surface-variant/50 focus:outline-none focus:border-border-focus transition-colors"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-2 px-4 rounded bg-primary-container text-on-primary-container font-semibold text-sm hover:bg-primary transition-all shadow-photonic disabled:opacity-50"
            >
              {loading ? (
                <span>Provisioning Account...</span>
              ) : (
                <>
                  <span>Create Organization & Start</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        </div>

        <div className="text-center text-xs text-on-surface-variant">
          Already have an account?{" "}
          <Link
            href="/login"
            className="text-primary-container hover:underline font-semibold"
          >
            Sign in to Console
          </Link>
        </div>
      </div>
    </div>
  );
}
