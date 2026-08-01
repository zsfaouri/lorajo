import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";

import { getSession } from "@/lib/auth";
import { getPrisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { currentPassword, newPassword } = await req.json();
  if (!currentPassword || !newPassword || newPassword.length < 6) {
    return NextResponse.json({ error: "New password must be at least 6 characters" }, { status: 400 });
  }

  const prisma = getPrisma();
  if (!prisma) return NextResponse.json({ error: "Database unavailable" }, { status: 500 });

  const admin = await prisma.adminUser.findUnique({ where: { email: session.email } });
  if (!admin) return NextResponse.json({ error: "User not found" }, { status: 404 });

  const valid = await bcrypt.compare(currentPassword, admin.passwordHash);
  if (!valid) return NextResponse.json({ error: "Current password is incorrect" }, { status: 401 });

  const passwordHash = await bcrypt.hash(newPassword, 12);
  await prisma.adminUser.update({ where: { id: admin.id }, data: { passwordHash } });

  return NextResponse.json({ ok: true });
}
