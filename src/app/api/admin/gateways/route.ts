import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";
import { PaymentGatewayType } from "@prisma/client";

export async function GET() {
  const session = await getSessionUser();
  if (!session || session.user.role !== "SUPER_ADMIN") {
    return NextResponse.json({ error: "Superadmin access required" }, { status: 403 });
  }

  const configs = await prisma.paymentGatewayConfig.findMany();
  return NextResponse.json({ configs });
}

export async function POST(req: Request) {
  const session = await getSessionUser();
  if (!session || session.user.role !== "SUPER_ADMIN") {
    return NextResponse.json({ error: "Superadmin access required" }, { status: 403 });
  }

  try {
    const body = await req.json();
    const { gateway, isEnabled, isLiveMode, config } = body;

    if (!gateway || !Object.values(PaymentGatewayType).includes(gateway)) {
      return NextResponse.json({ error: "Invalid payment gateway type" }, { status: 400 });
    }

    const updated = await prisma.paymentGatewayConfig.upsert({
      where: { gateway: gateway as PaymentGatewayType },
      update: {
        isEnabled: Boolean(isEnabled),
        isLiveMode: Boolean(isLiveMode),
        configJson: JSON.stringify(config || {}),
      },
      create: {
        gateway: gateway as PaymentGatewayType,
        isEnabled: Boolean(isEnabled),
        isLiveMode: Boolean(isLiveMode),
        configJson: JSON.stringify(config || {}),
      },
    });

    // Record audit log
    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: "admin.gateway.update",
        resourceType: "PaymentGatewayConfig",
        resourceId: updated.id,
        metadata: JSON.stringify({ gateway, isEnabled, isLiveMode }),
      },
    });

    return NextResponse.json({ config: updated });
  } catch (error: any) {
    console.error("Failed to update gateway config:", error);
    return NextResponse.json({ error: error.message || "Failed to update config" }, { status: 500 });
  }
}
