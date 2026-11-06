"use client";

import { useState } from "react";
import {
  Users2,
  PlusCircle,
  Shield,
  Key,
  Radio,
  Copy,
  Check,
  CheckCircle2,
  Trash2,
} from "lucide-react";

interface DjAccount {
  id: string;
  stationId: string;
  username: string;
  mountAllowed: string;
  isActive: boolean;
  createdAt: Date | string;
}

interface StationWithDjs {
  id: string;
  name: string;
  portIngest: number;
  djAccounts: DjAccount[];
}

export function DjManagerClient({ stations }: { stations: StationWithDjs[] }) {
  const [selectedStationId, setSelectedStationId] = useState(stations[0]?.id || "");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [mountAllowed, setMountAllowed] = useState("/live");
  const [loading, setLoading] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  const activeStation = stations.find((s) => s.id === selectedStationId) || stations[0];
  const [djs, setDjs] = useState<DjAccount[]>(activeStation?.djAccounts || []);

  async function handleCreateDj(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch(`/api/stations/${selectedStationId}/djs`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password, mountAllowed }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to create DJ credentials");

      setDjs([data.dj, ...djs]);
      setUsername("");
      setPassword("");
      setNotice(`Provisioned live harbor credentials for DJ ${data.dj.username}`);
      setTimeout(() => setNotice(null), 4000);
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Error creating credentials");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      {notice && (
        <div className="p-3 rounded bg-surface-panel border border-border-focus text-primary-container text-xs flex items-center gap-2 shadow-photonic">
          <CheckCircle2 className="w-4 h-4 text-primary-container" />
          <span className="font-mono">{notice}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border-subtle pb-4">
        <div>
          <h1 className="text-xl font-bold text-on-surface flex items-center gap-2">
            <Users2 className="w-5 h-5 text-primary-container" />
            <span>DJs & Live Presenter Accounts</span>
          </h1>
          <p className="text-xs text-on-surface-variant">
            Generate dedicated live source harbor logins for OBS, BUTT, Mixxx, and remote presenters
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Radio className="w-4 h-4 text-primary-container" />
          <select
            value={selectedStationId}
            onChange={(e) => {
              setSelectedStationId(e.target.value);
              const st = stations.find((s) => s.id === e.target.value);
              setDjs(st?.djAccounts || []);
            }}
            className="px-3 py-1.5 rounded bg-surface-panel border border-border-subtle text-xs text-on-surface focus:outline-none focus:border-border-focus font-mono"
          >
            {stations.map((st) => (
              <option key={st.id} value={st.id}>
                {st.name} (Port {st.portIngest})
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* DJ Accounts List (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="p-5 rounded-lg bg-surface-panel border border-border-subtle space-y-4 shadow-panel">
            <div className="flex items-center justify-between border-b border-border-subtle pb-3">
              <span className="text-xs font-bold text-on-surface uppercase tracking-wider font-mono">
                Active Presenter Logins ({djs.length})
              </span>
              <span className="text-xs font-mono text-tertiary">PORT {activeStation?.portIngest}</span>
            </div>

            {djs.length === 0 ? (
              <div className="p-6 rounded bg-surface-container text-center text-xs text-on-surface-variant">
                No dedicated DJ accounts configured for this station. Presenters can also connect via the master station source credentials.
              </div>
            ) : (
              <div className="divide-y divide-border-subtle/50 font-mono text-xs">
                {djs.map((dj) => (
                  <div key={dj.id} className="py-3 flex items-center justify-between">
                    <div>
                      <div className="font-bold text-on-surface text-sm">{dj.username}</div>
                      <div className="text-[11px] text-on-surface-variant">
                        Allowed Mount: <span className="text-primary-container">{dj.mountAllowed}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded bg-tertiary-container/20 text-tertiary text-[10px] font-bold">
                        ACTIVE
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Quick Setup Instructions */}
          <div className="p-5 rounded-lg bg-surface-panel border border-border-subtle space-y-3 shadow-panel text-xs">
            <h3 className="font-bold text-on-surface uppercase tracking-wider font-mono text-xs">
              Live Software Connection Guide
            </h3>
            <div className="space-y-2 text-on-surface-variant text-[11px]">
              <div>
                <strong className="text-on-surface">OBS Studio / BUTT:</strong> Set Server Type to{" "}
                <span className="text-primary-container font-mono">Icecast</span>, Host to{" "}
                <span className="text-primary-container font-mono">localhost</span>, Port to{" "}
                <span className="text-primary-container font-mono">{activeStation?.portIngest}</span>,
                Mount to <span className="text-primary-container font-mono">/live</span>, and Password to the presenter password.
              </div>
            </div>
          </div>
        </div>

        {/* Create DJ Account Form (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="p-5 rounded-lg bg-surface-panel border border-border-subtle space-y-4 shadow-panel">
            <div className="flex items-center gap-2 border-b border-border-subtle pb-2">
              <Key className="w-4 h-4 text-primary-container" />
              <h2 className="text-xs font-bold text-on-surface uppercase tracking-wider font-mono">
                Create Presenter Credentials
              </h2>
            </div>

            <form onSubmit={handleCreateDj} className="space-y-3 text-xs">
              <div>
                <label className="block text-[11px] font-semibold text-on-surface-variant mb-1 uppercase tracking-wider">
                  DJ Handle / Username
                </label>
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="e.g. dj_sarah"
                  className="w-full px-3 py-1.5 rounded bg-surface-container border border-border-subtle text-xs text-on-surface focus:outline-none focus:border-border-focus font-mono"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-on-surface-variant mb-1 uppercase tracking-wider">
                  Harbor Streaming Password
                </label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full px-3 py-1.5 rounded bg-surface-container border border-border-subtle text-xs text-on-surface focus:outline-none focus:border-border-focus font-mono"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-on-surface-variant mb-1 uppercase tracking-wider">
                  Allowed Ingest Mountpoint
                </label>
                <input
                  type="text"
                  value={mountAllowed}
                  onChange={(e) => setMountAllowed(e.target.value)}
                  placeholder="/live"
                  className="w-full px-3 py-1.5 rounded bg-surface-container border border-border-subtle text-xs text-on-surface focus:outline-none focus:border-border-focus font-mono"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2 px-3 rounded bg-primary-container hover:bg-primary text-on-primary-container font-semibold text-xs transition-all shadow-photonic disabled:opacity-50"
              >
                {loading ? "Generating Harbor Pass..." : "Create Live DJ Login"}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
