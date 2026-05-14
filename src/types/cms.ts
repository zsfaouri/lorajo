export type LocaleCode = "en" | "ar";

export type PublishState = "DRAFT" | "PUBLISHED" | "ARCHIVED";

export type ThemeTokens = {
  colors: Record<string, string>;
  typography: Record<string, string>;
  spacing: Record<string, string>;
  radii: Record<string, string>;
};

export type CmsImage = {
  src: string;
  alt: string;
  caption?: string;
};

export type CmsCta = {
  label: string;
  href: string;
};

export type CmsSection = {
  id: string;
  type: string;
  variant: string;
  sortOrder: number;
  isVisible: boolean;
  content: Record<string, unknown>;
  settings: Record<string, unknown>;
  spacing?: Record<string, unknown> | null;
  background?: Record<string, unknown> | null;
  alignment?: string | null;
};

export type CmsPage = {
  id: string;
  locale: LocaleCode;
  slug: string;
  title: string;
  seoTitle?: string | null;
  seoDescription?: string | null;
  seoImage?: string | null;
  status: PublishState;
  sections: CmsSection[];
};

export type NavigationItemDto = {
  id: string;
  label: string;
  path: string;
  sortOrder: number;
  isVisible: boolean;
};

export type FooterColumnDto = {
  id: string;
  title: string;
  sortOrder: number;
  content: Record<string, unknown>;
  links: Array<{ label: string; href: string }>;
};

export type MemberDto = {
  id: string;
  name: string;
  slug: string;
  title?: string | null;
  image?: CmsImage | null;
  sortOrder: number;
};

export type GalleryCollectionDto = {
  id: string;
  title: string;
  slug: string;
  description?: string | null;
  sortOrder: number;
  images: CmsImage[];
};

export type NeighborhoodArchiveItem = {
  id: string;
  name: string;
  text?: string | null;
  mediaType: "IMAGE" | "VIDEO";
  src: string;
  thumbnail?: string | null;
  folder?: string | null;
};

export type EventDto = {
  id: string;
  title: string;
  slug: string;
  summary?: string | null;
  body?: string | null;
  startsAt?: string | null;
  endsAt?: string | null;
  location?: string | null;
  actionLabel?: string | null;
  invitationUrl?: string | null;
  videoUrl?: string | null;
  image?: CmsImage | null;
};

export type ArticleDto = {
  id: string;
  title: string;
  slug: string;
  excerpt?: string | null;
  body?: string | null;
  publishedAt?: string | null;
  image?: CmsImage | null;
};
