import { ContactSection } from "@/components/sections/contact-section";
import { GalleryCollectionsSection } from "@/components/sections/gallery-collections-section";
import { GalleryGridSection } from "@/components/sections/gallery-grid-section";
import { HeritageStorySection } from "@/components/sections/heritage-story-section";
import { HeroSection } from "@/components/sections/hero-section";
import { ImageCarouselSection } from "@/components/sections/image-carousel-section";
import { MemberGridSection } from "@/components/sections/member-grid-section";
import { NewsletterSection } from "@/components/sections/newsletter-section";
import { RichTextSection } from "@/components/sections/rich-text-section";
import { SectionFrame } from "@/components/sections/section-frame";
import { TextMarqueeSection } from "@/components/sections/text-marquee-section";
import { VideoScrollHeroSection } from "@/components/sections/video-scroll-hero-section";
import { getGalleryCollections, getMembers } from "@/lib/cms-data";
import type { CmsSection, LocaleCode } from "@/types/cms";

export async function SectionRenderer({ section, locale }: { section: CmsSection; locale: LocaleCode }) {
  if (!section.isVisible) return null;

  switch (section.type) {
    case "hero":
      return <HeroSection section={section} />;
    case "video_scroll_hero":
      return <VideoScrollHeroSection section={section} />;
    case "rich_text":
      return <RichTextSection section={section} />;
    case "heritage_story":
    case "image_text":
      return <HeritageStorySection section={section} />;
    case "text_marquee":
      return <TextMarqueeSection section={section} />;
    case "gallery_grid":
      return <GalleryGridSection section={section} />;
    case "gallery_masonry": {
      const collections = await getGalleryCollections(locale);
      return <GalleryCollectionsSection section={section} collections={collections} />;
    }
    case "member_grid": {
      const members = await getMembers(locale);
      return <MemberGridSection section={section} members={members} />;
    }
    case "newsletter_signup":
      return <NewsletterSection section={section} />;
    case "contact_form":
      return <ContactSection section={section} />;
    case "image_carousel":
      return <ImageCarouselSection section={section} />;
    default:
      return (
        <SectionFrame section={section}>
          <div className="mx-auto max-w-4xl rounded-[var(--radius-card)] border border-black/10 bg-white p-6">
            <p className="text-sm uppercase tracking-[0.16em] text-black/45">Unsupported section</p>
            <p className="mt-2 text-lg">{section.type}</p>
          </div>
        </SectionFrame>
      );
  }
}
