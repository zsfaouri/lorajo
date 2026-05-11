import { NextResponse } from "next/server";
import type { Prisma } from "@prisma/client";
import { ZodError } from "zod";

import { auth } from "@/auth";
import { getPrisma } from "@/lib/prisma";

export function ok<T>(data: T, init?: ResponseInit) {
  return NextResponse.json(data, init);
}

export function error(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

export async function requireAdminApi() {
  const session = await auth();
  if (!session?.user) return null;
  return session;
}

export function requirePrisma() {
  const prisma = getPrisma();
  if (!prisma) return null;
  return prisma;
}

export function auditPayload(value: unknown) {
  return value == null ? undefined : JSON.parse(JSON.stringify(value));
}

export function jsonInput(value: unknown): Prisma.InputJsonValue {
  return value as Prisma.InputJsonValue;
}

export async function parseJson<T>(request: Request, schema: { parse: (value: unknown) => T }) {
  try {
    const body = await request.json();
    return { data: schema.parse(body), response: null };
  } catch (caught) {
    if (caught instanceof ZodError) {
      return { data: null, response: error(caught.issues[0]?.message ?? "Invalid request body", 422) };
    }
    return { data: null, response: error("Invalid JSON body", 400) };
  }
}
