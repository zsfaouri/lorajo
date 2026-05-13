import { z } from "zod";

export const localeSchema = z.enum(["en", "ar"]).default("en");

export const pageSchema = z.object({
  locale: z.enum(["EN", "AR"]),
  slug: z.string().min(1),
  title: z.string().min(1),
  seoTitle: z.string().optional().nullable(),
  seoDescription: z.string().optional().nullable(),
  seoImage: z.string().optional().nullable(),
  status: z.enum(["DRAFT", "PUBLISHED", "ARCHIVED"]).default("DRAFT"),
});

export const sectionSchema = z.object({
  type: z.string().min(1),
  variant: z.string().min(1),
  sortOrder: z.number().int().min(0).default(0),
  isVisible: z.boolean().default(true),
  content: z.record(z.string(), z.unknown()).default({}),
  settings: z.record(z.string(), z.unknown()).default({}),
  spacing: z.record(z.string(), z.unknown()).optional().nullable(),
  background: z.record(z.string(), z.unknown()).optional().nullable(),
  alignment: z.string().optional().nullable(),
});

export const sectionReorderSchema = z.object({
  sectionIds: z.array(z.string().min(1)).min(1),
});

export const themeSchema = z.object({
  tokens: z.record(z.string(), z.unknown()),
});

export const contactSchema = z.object({
  name: z.string().min(2).max(120),
  email: z.string().email(),
  phone: z.string().max(60).optional().nullable(),
  subject: z.string().max(160).optional().nullable(),
  message: z.string().min(5).max(5000),
});

export const newsletterSchema = z.object({
  email: z.string().email(),
  name: z.string().max(120).optional().nullable(),
  locale: z.enum(["EN", "AR"]).optional().nullable(),
});

export const volunteerSchema = z.object({
  name: z.string().min(2).max(120),
  email: z.string().email(),
  phone: z.string().max(60).optional().nullable(),
  interests: z.array(z.string()).default([]),
  message: z.string().max(5000).optional().nullable(),
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

export const collectionSchema = z.object({
  locale: z.enum(["EN", "AR"]),
  title: z.string().min(1),
  slug: z.string().min(1),
  description: z.string().optional().nullable(),
  sortOrder: z.number().int().default(0),
  status: z.enum(["DRAFT", "PUBLISHED", "ARCHIVED"]).default("DRAFT"),
});

export const memberSchema = z.object({
  locale: z.enum(["EN", "AR"]),
  name: z.string().min(1),
  slug: z.string().min(1),
  title: z.string().optional().nullable(),
  mediaAssetId: z.string().min(1).optional().nullable(),
  sortOrder: z.number().int().default(0),
  isFounder: z.boolean().default(false),
  status: z.enum(["DRAFT", "PUBLISHED", "ARCHIVED"]).default("PUBLISHED"),
});

export const contentEntrySchema = z.object({
  locale: z.enum(["EN", "AR"]),
  title: z.string().min(1),
  slug: z.string().min(1),
  summary: z.string().optional().nullable(),
  content: z.record(z.string(), z.unknown()).default({}),
  status: z.enum(["DRAFT", "PUBLISHED", "ARCHIVED"]).default("DRAFT"),
});
