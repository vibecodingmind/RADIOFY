import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashPassword, generateToken, COOKIE_NAME } from "@/lib/auth";
import { z } from "zod";

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8, "Password must be at least 8 characters"),
  name: z.string().min(2, "Name must be at least 2 characters"),
  orgName: z.string().min(2, "Station or Organization name required"),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parsed = registerSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || "Invalid input" },
        { status: 400 }
      );
    }

    const { email, password, name, orgName } = parsed.data;

    // Check existing user
    const existing = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (existing) {
      return NextResponse.json(
        { error: "An account with this email already exists" },
        { status: 409 }
      );
    }

    const passwordHash = await hashPassword(password);

    // Create user and initial organization in transaction
    const slugBase = orgName.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
    const randomSuffix = Math.random().toString(36).substring(2, 6);
    const slug = `${slugBase}-${randomSuffix}`;

    const { user, organization } = await prisma.$transaction(async (tx) => {
      const newUser = await tx.user.create({
        data: {
          email: email.toLowerCase(),
          passwordHash,
          name,
          role: "BROADCASTER",
          isEmailVerified: false,
          isActive: true,
        },
      });

      const newOrg = await tx.organization.create({
        data: {
          name: orgName,
          slug,
          contactEmail: email.toLowerCase(),
          storageQuotaBytes: BigInt(15 * 1024 * 1024 * 1024), // 15GB Starter
          maxStations: 2,
        },
      });

      await tx.organizationMember.create({
        data: {
          orgId: newOrg.id,
          userId: newUser.id,
          role: "OWNER",
        },
      });

      return { user: newUser, organization: newOrg };
    });

    const token = generateToken({
      userId: user.id,
      email: user.email,
      role: user.role,
      orgId: organization.id,
    });

    const response = NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
      organization: {
        id: organization.id,
        name: organization.name,
        slug: organization.slug,
      },
    });

    response.cookies.set({
      name: COOKIE_NAME,
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60,
      path: "/",
    });

    return response;
  } catch (error) {
    console.error("Registration error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
