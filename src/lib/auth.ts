import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { cookies } from "next/headers";
import { prisma } from "./prisma";
import { UserRole } from "@prisma/client";

const JWT_SECRET = process.env.JWT_SECRET || "radiofy_default_jwt_secret_change_in_production";
const COOKIE_NAME = "radiofy_auth_token";

export interface TokenPayload {
  userId: string;
  email: string;
  role: UserRole;
  orgId?: string;
}

export async function hashPassword(password: string): Promise<string> {
  const salt = await bcrypt.genSalt(12);
  return bcrypt.hash(password, salt);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export function generateToken(payload: TokenPayload, expiresIn = "7d"): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn } as jwt.SignOptions);
}

export function verifyToken(token: string): TokenPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as TokenPayload;
  } catch {
    return null;
  }
}

export async function getSessionUser() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(COOKIE_NAME)?.value;
    if (!token) return null;

    const decoded = verifyToken(token);
    if (!decoded) return null;

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      include: {
        memberships: {
          include: {
            organization: true,
            customRole: true,
          },
        },
      },
    });

    if (!user || !user.isActive) return null;

    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        avatarUrl: user.avatarUrl,
        phoneNumber: user.phoneNumber,
        isEmailVerified: user.isEmailVerified,
        isActive: user.isActive,
      },
      memberships: user.memberships,
      activeMembership: user.memberships[0] || null,
    };
  } catch (error) {
    console.error("Error getting session user:", error);
    return null;
  }
}

export { COOKIE_NAME };
