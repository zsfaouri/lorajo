import { NextResponse } from "next/server";
import { requirePrisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import type { PrismaClient } from "@prisma/client";

export type ApiContext = {
  prisma: PrismaClient;
  email: string;
};

/** Wrap an admin API handler with auth + prisma checks. */
export async function withAdmin<T>(
  handler: (ctx: ApiContext) => Promise<T>,
): Promise<NextResponse> {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const prisma = requirePrisma();
    const result = await handler({ prisma, email: session.email });
    return NextResponse.json(result);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal error";
    console.error("Admin API error:", err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

/** Parse JSON body safely. */
export async function parseBody<T>(request: Request): Promise<T> {
  return request.json() as Promise<T>;
}

/** Create a slug from a string. */
export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

/** Audit log helper */
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
