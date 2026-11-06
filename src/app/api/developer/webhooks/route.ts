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

  const webhooks = await prisma.webhookEndpoint.findMany({
    where: { orgId },
    include: {
      deliveryLogs: {
        take: 5,
        orderBy: { createdAt: "desc" },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ webhooks });
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
  const { url, eventSubscriptions } = body;

  if (!url) {
    return NextResponse.json({ error: "Webhook URL is required" }, { status: 400 });
  }

  const secret = `whsec_${crypto.randomBytes(24).toString("hex")}`;

  const webhook = await prisma.webhookEndpoint.create({
    data: {
      orgId,
      url,
      secret,
      eventSubscriptions: eventSubscriptions || ["station.started", "track.played"],
      isActive: true,
    },
  });

  return NextResponse.json({ success: true, webhook });
}
