import { NextResponse } from "next/server";
import type { PrismaClient } from "@prisma/client";

import { requirePrisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { tokenVersionFor } from "@/lib/session";

export type ApiContext = {
  prisma: PrismaClient;
  email: string;
};

/**
 * Wraps an admin API handler with authentication, session-revocation checks,
 * and consistent error handling.
 */
export async function withAdmin<T>(
  handler: (ctx: ApiContext) => Promise<T>,
): Promise<NextResponse> {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const prisma = requirePrisma();

    // Revocation: a password change rotates the token version, so sessions
    // issued before the change stop working immediately.
    const admin = await prisma.adminUser.findUnique({
      where: { email: session.email },
      select: { passwordHash: true },
    });
    if (!admin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const currentVersion = await tokenVersionFor(admin.passwordHash);
    if (currentVersion !== session.version) {
      return NextResponse.json({ error: "Session expired" }, { status: 401 });
    }

    const result = await handler({ prisma, email: session.email });
    return NextResponse.json(result);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal error";
    console.error("Admin API error:", err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function parseBody<T>(request: Request): Promise<T> {
  return request.json() as Promise<T>;
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

/** Whitelist helper: keep only the fields a model allows clients to set. */
export function pickFields<T extends Record<string, unknown>>(
  body: Record<string, unknown>,
  allowed: readonly string[],
): T {
  const out: Record<string, unknown> = {};
  for (const key of allowed) {
    if (key in body && body[key] !== undefined) out[key] = body[key];
  }
  return out as T;
}

export async function logAudit(
  prisma: PrismaClient,
  opts: {
    action: string;
    entity: string;
    entityId?: string;
    before?: unknown;
    after?: unknown;
    metadata?: unknown;
  },
) {
  await prisma.auditLog.create({
    data: {
      action: opts.action,
      entity: opts.entity,
      entityId: opts.entityId,
      before: opts.before ? JSON.parse(JSON.stringify(opts.before)) : undefined,
      after: opts.after ? JSON.parse(JSON.stringify(opts.after)) : undefined,
      metadata: opts.metadata ? JSON.parse(JSON.stringify(opts.metadata)) : undefined,
    },
  });
}
