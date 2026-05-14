import { FeaturedPhotoGallery } from "@/components/sections/featured-photo-gallery";
import type { CmsSection, GalleryCollectionDto } from "@/types/cms";

export function GalleryCollectionsSection({
  section,
  collections,
}: {
  section: CmsSection;
  collections: GalleryCollectionDto[];
}) {
  return <FeaturedPhotoGallery section={section} collections={collections} />;
}
