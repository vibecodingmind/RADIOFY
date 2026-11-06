import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { rateLimit } from "@/lib/rate-limit";

const schema = z.object({
  name: z.string().min(2).max(80),
  email: z.string().email(),
  message: z.string().min(10).max(4000),
});

export async function POST(req: Request) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
  const limited = rateLimit(`contact:${ip}`, 5, 60 * 60 * 1000);
  if (!limited.ok) {
    return NextResponse.json({ error: "Too many messages. Try again later." }, { status: 429 });
  }

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Check name, email, and message." }, { status: 400 });
  }

  await prisma.auditLog.create({
    data: {
      action: "contact.submit",
      resourceType: "Contact",
      ipAddress: ip,
      metadata: JSON.stringify(parsed.data),
    },
  });

  return NextResponse.json({ success: true });
}
