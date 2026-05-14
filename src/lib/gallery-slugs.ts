export function canonicalGallerySlug(value: string): string {
  const slug = value
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  if (["famous", "famous-figures", "famous-figuers"].includes(slug)) return "famous-figures";
  if (["landmark", "landmarks"].includes(slug)) return "landmarks";
  if (["historical-pic", "historical-pics", "historical-photo", "historical-photos", "historcal-pic", "historcal-pics", "history"].includes(slug)) {
    return "historical-photos";
  }
  if (["founders", "founding-members"].includes(slug)) return "founding-members";
  if (["hero", "hero-pics", "hero-pictures"].includes(slug)) return "hero-pics";
  if (["archive", "neighborhood", "neighborhood-archive", "names-library", "name-library"].includes(slug)) return "neighborhood-archive";
  return slug;
}
