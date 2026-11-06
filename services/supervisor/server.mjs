#!/usr/bin/env node
/**
 * Optional long-running stream supervisor (Liquidsoap process manager).
 * Start: STREAM_SUPERVISOR_TOKEN=dev node services/supervisor/server.mjs
 * Point Next.js STREAM_SUPERVISOR_URL=http://127.0.0.1:4010
 */
import http from "http";
import { spawn } from "child_process";
import fs from "fs/promises";
import path from "path";

const PORT = Number(process.env.STREAM_SUPERVISOR_PORT || 4010);
const TOKEN = process.env.STREAM_SUPERVISOR_TOKEN || "";
const STORAGE = process.env.STORAGE_LOCAL_PATH || "./storage";
const processes = new Map();

function auth(req) {
  if (!TOKEN) return true;
  const h = req.headers.authorization || "";
  return h === `Bearer ${TOKEN}`;
}

async function startStation(stationId) {
  const configPath = path.join(STORAGE, "liquidsoap", stationId, "station.liq");
  try {
    await fs.access(configPath);
  } catch {
    throw new Error(`Missing liquidsoap config at ${configPath}`);
  }

  if (processes.has(stationId)) {
    return { alreadyRunning: true, pid: processes.get(stationId)?.pid };
  }

  const bin = process.env.LIQUIDSOAP_BIN || "liquidsoap";
  const child = spawn(bin, [configPath], { stdio: "ignore", detached: true });
  child.unref();
  processes.set(stationId, child);
  child.on("exit", () => processes.delete(stationId));
  return { pid: child.pid, configPath };
}

function stopStation(stationId) {
  const child = processes.get(stationId);
  if (!child?.pid) return { stopped: false };
  try {
    process.kill(child.pid);
  } catch {
    /* noop */
  }
  processes.delete(stationId);
  return { stopped: true };
}

const server = http.createServer(async (req, res) => {
  if (!auth(req)) {
    res.writeHead(401);
    res.end(JSON.stringify({ error: "Unauthorized" }));
    return;
  }

  const match = req.url?.match(/^\/stations\/([^/]+)\/(start|stop|restart)$/);
  if (req.method !== "POST" || !match) {
    res.writeHead(404);
    res.end(JSON.stringify({ error: "Not found" }));
    return;
  }

  const [, stationId, action] = match;
  try {
    let result;
    if (action === "start") result = await startStation(stationId);
    else if (action === "stop") result = stopStation(stationId);
    else {
      stopStation(stationId);
      result = await startStation(stationId);
    }
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ success: true, result }));
  } catch (e) {
    res.writeHead(400, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ error: e.message || "Failed" }));
  }
});

server.listen(PORT, () => {
  console.log(`Radiofy stream supervisor listening on :${PORT}`);
});
