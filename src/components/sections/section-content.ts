import { isRecord } from "@/lib/utils";

export function text(content: Record<string, unknown>, key: string, fallback = "") {
  const value = content[key];
  return typeof value === "string" ? value : fallback;
}

export function numberSetting(settings: Record<string, unknown>, key: string, fallback: number) {
  const value = settings[key];
  return typeof value === "number" ? value : fallback;
}

export function cta(content: Record<string, unknown>) {
  const value = content.cta;
  if (!isRecord(value)) return null;
  const label = typeof value.label === "string" ? value.label : "";
  const href = typeof value.href === "string" ? value.href : "";
  return label && href ? { label, href } : null;
}

export function imageSrc(content: Record<string, unknown>, fallback = "/lora/gallery/luweibdeh-flower.jpg") {
  return typeof content.image === "string" ? content.image : fallback;
}

export function logoSrc(content: Record<string, unknown>, fallback = "/lora/brand/lora-logo.png") {
  return typeof content.logo === "string" ? content.logo : fallback;
}

export function stringArray(content: Record<string, unknown>, key: string) {
  const value = content[key];
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : [];
}

export function bodyParagraphs(content: Record<string, unknown>) {
  const body = content.body;
  if (Array.isArray(body)) return body.filter((item): item is string => typeof item === "string");
  if (typeof body === "string") return [body];
  return [];
}
