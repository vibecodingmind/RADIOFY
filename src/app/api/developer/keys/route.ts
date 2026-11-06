import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";
import { AuthorizationService } from "@/lib/permissions";
import crypto from "crypto";

export async function GET() {
  const session = await getSessionUser();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const orgId = session.activeMembership?.orgId;
  if (!orgId) return NextResponse.json({ error: "No active organization" }, { status: 400 });

  const keys = await prisma.apiKey.findMany({
    where: { orgId },
    select: {
      id: true,
      name: true,
      keyPrefix: true,
      scopes: true,
      lastUsedAt: true,
      createdAt: true,
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ keys });
}

export async function POST(req: Request) {
  const session = await getSessionUser();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const orgId = session.activeMembership?.orgId;
  if (!orgId) return NextResponse.json({ error: "No active organization" }, { status: 400 });

  const canManage = AuthorizationService.can(session.user, "MANAGE_API_KEYS", {
    membership: session.activeMembership
      ? { orgId, role: session.activeMembership.role }
      : undefined,
    targetOrgId: orgId,
  });

  if (!canManage && session.user.role !== "SUPER_ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const { name, scopes } = body;

  if (!name) {
    return NextResponse.json({ error: "Key name is required" }, { status: 400 });
  }

  // Generate real API key: rf_live_...
  const rawSecret = crypto.randomBytes(24).toString("hex");
  const fullKey = `rf_live_${rawSecret}`;
  const keyPrefix = fullKey.substring(0, 12);
  const keyHash = crypto.createHash("sha256").update(fullKey).digest("hex");

  const apiKey = await prisma.apiKey.create({
    data: {
      orgId,
      name,
      keyPrefix,
      keyHash,
      scopes: scopes || ["stations:read", "telemetry:read"],
    },
  });

  return NextResponse.json({
    success: true,
    apiKey: {
      id: apiKey.id,
      name: apiKey.name,
      keyPrefix: apiKey.keyPrefix,
      fullKey, // Return only once
      scopes: apiKey.scopes,
      createdAt: apiKey.createdAt,
    },
  });
}
