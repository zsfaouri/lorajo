export const locales = ["en", "ar"] as const;

export const defaultLocale = "en";

export const sectionTypes = [
  "hero",
  "video_scroll_hero",
  "rich_text",
  "image_text",
  "gallery_grid",
  "gallery_masonry",
  "project_grid",
  "event_list",
  "member_grid",
  "quote",
  "timeline",
  "stats",
  "map",
  "contact_form",
  "newsletter_signup",
  "cta",
  "heritage_story",
  "text_marquee",
  "image_carousel",
] as const;

export const sectionVariants = {
  hero: ["editorial_fullscreen", "split_text_image", "centered_minimal", "video_scroll_scale"],
  gallery: ["masonry", "carousel", "lightbox_grid"],
  members: ["editorial_portraits", "clean_cards", "compact_list"],
  textImage: ["image_left", "image_right", "overlapping_editorial", "full_bleed_image"],
} as const;

export function normalizeLocale(value: string | undefined): "en" | "ar" {
  return value === "ar" ? "ar" : "en";
}

export function normalizeSlug(slug: string[] | string | undefined) {
  const parts = Array.isArray(slug) ? slug : slug ? [slug] : [];
  return parts.length ? parts.join("/") : "home";
}
