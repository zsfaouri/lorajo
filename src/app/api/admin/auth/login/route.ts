import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";

import { getPrisma } from "@/lib/prisma";
import { createSessionToken } from "@/lib/auth";

const COOKIE_NAME = "lora_admin_session";

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json({ error: "Email and password required" }, { status: 400 });
    }

    const prisma = getPrisma();
    if (!prisma) {
      return NextResponse.json({ error: "Database not available" }, { status: 500 });
    }

    const admin = await prisma.adminUser.findUnique({ where: { email } });
    if (!admin) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }

    const valid = await bcrypt.compare(password, admin.passwordHash);
    if (!valid) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }

    const token = await createSessionToken(email);

    const response = NextResponse.json({ ok: true, email: admin.email, name: admin.name });
    response.cookies.set(COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 7 * 24 * 60 * 60,
    });

    return response;
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
