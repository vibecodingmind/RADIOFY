import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";
import { AuthorizationService } from "@/lib/permissions";
import { getTenantScope, findStationInTenantScope } from "@/lib/tenant";
import fs from "fs/promises";
import path from "path";
import crypto from "crypto";

const STORAGE_BASE = process.env.STORAGE_LOCAL_PATH || "./storage";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSessionUser();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const { isSuper, orgId } = getTenantScope(session);

  const canEdit =
    isSuper ||
    AuthorizationService.can(session.user, "MANAGE_STATION_SETTINGS", {
      membership: session.activeMembership
        ? { orgId: orgId!, role: session.activeMembership.role }
        : undefined,
      targetOrgId: orgId,
    });

  if (!canEdit) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const station = await findStationInTenantScope(id, isSuper, orgId);
  if (!station) return NextResponse.json({ error: "Station not found" }, { status: 404 });
  const stationId = station.id;

  const formData = await req.formData();
  const logo = formData.get("logo") as File | null;
  const banner = formData.get("banner") as File | null;
  const accentColor = formData.get("playerAccentColor") as string | null;

  const updates: Record<string, string> = {};

  async function saveBrandFile(file: File, kind: "logo" | "banner") {
    const ext = path.extname(file.name).toLowerCase() || ".png";
    const key = `branding/${stationId}/${kind}-${crypto.randomBytes(8).toString("hex")}${ext}`;
    const fullPath = path.join(STORAGE_BASE, key);
    await fs.mkdir(path.dirname(fullPath), { recursive: true });
    const buffer = Buffer.from(await file.arrayBuffer());
    await fs.writeFile(fullPath, buffer);
    return `/api/files/${key}`;
  }

  if (logo && logo.size > 0) {
    updates.logoUrl = await saveBrandFile(logo, "logo");
  }
  if (banner && banner.size > 0) {
    updates.playerBannerUrl = await saveBrandFile(banner, "banner");
  }
  if (accentColor && /^#[0-9A-Fa-f]{6}$/.test(accentColor)) {
    updates.playerAccentColor = accentColor;
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: "No branding fields provided" }, { status: 400 });
  }

  const updated = await prisma.station.update({
    where: { id: stationId },
    data: updates,
  });

  return NextResponse.json({ station: updated });
}
