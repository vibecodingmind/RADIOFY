import { NextResponse } from "next/server";
import { syncStationListenerCountsFromIcecast } from "@/lib/icecast-admin";
import { tickAllAutoDjStations } from "@/lib/autodj-engine";

export async function POST(req: Request) {
  const secret = req.headers.get("x-cron-secret") || req.headers.get("authorization");
  const expected = process.env.CRON_SECRET;

  if (!expected || (secret !== expected && secret !== `Bearer ${expected}`)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const [icecast, autodj] = await Promise.all([
    syncStationListenerCountsFromIcecast(),
    tickAllAutoDjStations(),
  ]);

  return NextResponse.json({
    success: true,
    icecast,
    autodjTracksAdvanced: autodj.length,
  });
}
