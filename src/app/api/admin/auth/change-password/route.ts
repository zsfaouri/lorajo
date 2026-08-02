import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";

import { getSession } from "@/lib/auth";
import {
  SESSION_COOKIE,
  SESSION_COOKIE_OPTIONS,
  createSessionToken,
  tokenVersionFor,
} from "@/lib/session";
import { getPrisma } from "@/lib/prisma";

const MIN_PASSWORD_LENGTH = 8;

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { currentPassword, newPassword } = await req.json();

  if (typeof newPassword !== "string" || newPassword.length < MIN_PASSWORD_LENGTH) {
    return NextResponse.json(
      { error: `New password must be at least ${MIN_PASSWORD_LENGTH} characters` },
      { status: 400 },
    );
  }
  if (typeof currentPassword !== "string" || !currentPassword) {
    return NextResponse.json({ error: "Current password is required" }, { status: 400 });
  }
  if (currentPassword === newPassword) {
    return NextResponse.json(
      { error: "New password must be different from the current one" },
      { status: 400 },
    );
  }

  const prisma = getPrisma();
  if (!prisma) return NextResponse.json({ error: "Database unavailable" }, { status: 500 });

  const admin = await prisma.adminUser.findUnique({ where: { email: session.email } });
  if (!admin) return NextResponse.json({ error: "User not found" }, { status: 404 });

  const valid = await bcrypt.compare(currentPassword, admin.passwordHash);
  if (!valid) {
    return NextResponse.json({ error: "Current password is incorrect" }, { status: 401 });
  }

  const passwordHash = await bcrypt.hash(newPassword, 12);
  await prisma.adminUser.update({ where: { id: admin.id }, data: { passwordHash } });

  await prisma.auditLog.create({
    data: {
      action: "UPDATE",
      entity: "AdminUser",
      entityId: admin.id,
      metadata: { email: admin.email, field: "password" },
    },
  });

  // Changing the password revokes every existing session (including this one),
  // so issue a fresh cookie to keep the current browser signed in.
  const response = NextResponse.json({ ok: true });
  const version = await tokenVersionFor(passwordHash);
  const token = await createSessionToken(admin.email, version);
  if (token) response.cookies.set(SESSION_COOKIE, token, SESSION_COOKIE_OPTIONS);

  return response;
}
