import { Prisma, PrismaClient, Locale, MediaType, PublishState } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const now = new Date();

function json(value: unknown): Prisma.InputJsonValue {
  return value as Prisma.InputJsonValue;
}

const themeTokens = {
  colors: {
    softWhite: "#f2faf6",
    black: "#0a0a0a",
    heritageGreen: "#01963c",
    lightNeutral: "#f0f0f0",
    stone: "#c4b9a3",
    parchment: "#f7f3eb",
    terracotta: "#b8704a",
    olive: "#6b7c4e",
    jasmine: "#f5f0d0",
    stoneLight: "#ede8df",
  },
  typography: {
    fontSans: "Avenir-lt-w01_35-light1475496, Avenir, Avenir Next, Inter, sans-serif",
    headingWeight: "300",
    bodyWeight: "300",
    uppercaseTracking: "0.16em",
  },
  spacing: {
    sectionSmall: "4rem",
    sectionMedium: "7rem",
    sectionLarge: "10rem",
    pageX: "clamp(1rem, 4vw, 4rem)",
  },
  radii: {
    card: "0.375rem",
    media: "0.25rem",
    button: "999px",
  },
};

const media = [
  {
    key: "lora-logo",
    type: MediaType.IMAGE,
    url: "/lora/brand/lora-logo.png",
    alt: "LORA logo",
    source: "lorajo.org",
  },
  {
    key: "luweibdeh-flower",
    type: MediaType.IMAGE,
    url: "/lora/gallery/luweibdeh-flower.jpg",
    alt: "Luweibdeh flower",
    source: "lorajo.org",
  },
  {
    key: "square-de-paris",
    type: MediaType.IMAGE,
    url: "/lora/gallery/square-de-paris.jpg",
    alt: "Paris Square in Jabal Al-Luweibdeh",
    source: "local import",
  },
  {
    key: "dar-al-anda",
    type: MediaType.IMAGE,
    url: "/lora/gallery/dar-al-anda-art-gallery.jpg",
    alt: "Dar Al-Anda art gallery",
    source: "local import",
  },
  {
    key: "blue-house",
    type: MediaType.IMAGE,
    url: "/lora/gallery/blue-house-4.jpg",
    alt: "Blue House in Jabal Al-Luweibdeh",
    source: "local import",
  },
  {
    key: "alsaadi-mosque",
    type: MediaType.IMAGE,
    url: "/lora/gallery/alsaadi-mosque.jpg",
    alt: "Al Saadi Mosque",
    source: "local import",
  },
  {
    key: "wael-hamza-smadi",
    type: MediaType.IMAGE,
    url: "/lora/founders/wael-hamza-smadi.jpg",
    alt: "Wael Hamza Smadi",
    source: "local import",
  },
  {
    key: "saleem-quna",
    type: MediaType.IMAGE,
    url: "/lora/founders/saleem-quna.jpg",
    alt: "Saleem Quna",
    source: "local import",
  },
  {
    key: "reem-farkouh",
    type: MediaType.IMAGE,
    url: "/lora/founders/reem-farkouh.jpg",
    alt: "Reem Farkouh",
    source: "local import",
  },
  {
    key: "rami-daher",
    type: MediaType.IMAGE,
    url: "/lora/founders/rami-daher.jpg",
    alt: "Rami Daher",
    source: "local import",
  },
  {
    key: "muneer-al-kurdi",
    type: MediaType.IMAGE,
    url: "/lora/founders/muneer-al-kurdi.jpg",
    alt: "Muneer Al Kurdi",
    source: "local import",
  },
  {
    key: "marwan-al-manha",
    type: MediaType.IMAGE,
    url: "/lora/founders/marwan-al-manha.jpg",
    alt: "Marwan Al Manha",
    source: "local import",
  },
  {
    key: "ali-al-manha",
    type: MediaType.IMAGE,
    url: "/lora/founders/ali-al-manha.jpg",
    alt: "Ali Al Manha",
    source: "local import",
  },
  {
    key: "majdolin-ghazawi",
    type: MediaType.IMAGE,
    url: "/lora/founders/majdolin-ghazawi.jpg",
    alt: "Majdolin Ghazawi",
    source: "local import",
  },
];

const memberNames = [
  ["omar-t-alfaouri", "Omar T. Alfaouri", undefined],
  ["wael-hamza-smadi", "Wael Hamza Smadi", "wael-hamza-smadi"],
  ["saleem-quna", "Saleem Quna", "saleem-quna"],
  ["reem-farkouh", "Reem Farkouh", "reem-farkouh"],
  ["rami-daher", "Rami Daher", "rami-daher"],
  ["muneer-al-kurdi", "Muneer Al Kurdi", "muneer-al-kurdi"],
  ["marwan-al-manha", "Marwan Al Manha", "marwan-al-manha"],
  ["ali-al-manha", "Ali Al Manha", "ali-al-manha"],
  ["majdolin-ghazawi", "Majdolin Ghazawi", "majdolin-ghazawi"],
  ["marwan-abuazzam", "Marwan Abuazzam", undefined],
] as const;

const sectionTypes = [
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
];

const variants = [
  ["hero", "editorial_fullscreen"],
  ["hero", "split_text_image"],
  ["hero", "centered_minimal"],
  ["hero", "video_scroll_scale"],
  ["gallery", "masonry"],
  ["gallery", "carousel"],
  ["gallery", "lightbox_grid"],
  ["gallery", "interactive_selector"],
  ["gallery", "staggered_grid"],
  ["members", "editorial_portraits"],
  ["members", "clean_cards"],
  ["members", "compact_list"],
  ["members", "team_showcase"],
  ["text_image", "image_left"],
  ["text_image", "image_right"],
  ["text_image", "overlapping_editorial"],
  ["text_image", "full_bleed_image"],
] as const;

async function upsertTheme() {
  const theme = await prisma.siteTheme.upsert({
    where: { id: "lora-active-theme" },
    update: { isActive: true, tokens: json(themeTokens) },
    create: {
      id: "lora-active-theme",
      name: "LORA Heritage Editorial",
      isActive: true,
      tokens: json(themeTokens),
    },
  });

  for (const [category, values] of Object.entries(themeTokens)) {
    for (const [key, value] of Object.entries(values as Record<string, string>)) {
      await prisma.designToken.upsert({
        where: { themeId_key: { themeId: theme.id, key: `${category}.${key}` } },
        update: { value: String(value), category },
        create: {
          themeId: theme.id,
          category,
          key: `${category}.${key}`,
          label: key,
          value: String(value),
        },
      });
    }
  }
}

async function upsertSystemRecords() {
  const role = await prisma.role.upsert({
    where: { name: "ADMIN" },
    update: {
      permissions: json({
        pages: "manage",
        theme: "manage",
        media: "manage",
        messages: "manage",
        users: "manage",
      }),
    },
    create: {
      name: "ADMIN",
      permissions: json({
        pages: "manage",
        theme: "manage",
        media: "manage",
        messages: "manage",
        users: "manage",
      }),
    },
  });

  const email = process.env.ADMIN_EMAIL ?? "admin@lorajo.org";
  const password = process.env.ADMIN_PASSWORD ?? "change-this-password";

  await prisma.user.upsert({
    where: { email },
    update: { roleId: role.id },
    create: {
      email,
      name: "LORA Admin",
      passwordHash: await bcrypt.hash(password, 12),
      roleId: role.id,
    },
  });

  for (const key of sectionTypes) {
    await prisma.componentVariant.upsert({
      where: { component_key: { component: "section_type", key } },
      update: { isEnabled: true },
      create: {
        component: "section_type",
        key,
        label: key.replaceAll("_", " "),
        config: json({}),
      },
    });
  }

  for (const [component, key] of variants) {
    await prisma.componentVariant.upsert({
      where: { component_key: { component, key } },
      update: { isEnabled: true },
      create: {
        component,
        key,
        label: key.replaceAll("_", " "),
        config: json({}),
      },
    });
  }

  const presets = [
    {
      key: "none",
      label: "None",
      config: { enabled: false },
    },
    {
      key: "fade_up",
      label: "Fade Up",
      config: { enabled: true, type: "fade", y: 28, duration: 0.6 },
    },
    {
      key: "editorial_reveal",
      label: "Editorial Reveal",
      config: { enabled: true, type: "clip", duration: 0.8 },
    },
    {
      key: "media_parallax",
      label: "Media Parallax",
      config: { enabled: true, type: "parallax", amount: 32 },
    },
  ];

  for (const preset of presets) {
    await prisma.animationPreset.upsert({
      where: { key: preset.key },
      update: { ...preset, config: json(preset.config) },
      create: { ...preset, config: json(preset.config) },
    });
  }
}

async function upsertMedia() {
  const result = new Map<string, string>();

  for (const asset of media) {
    const saved = await prisma.mediaAsset.upsert({
      where: { url: asset.url },
      update: asset,
      create: asset,
    });
    result.set(asset.key, saved.id);
  }

  return result;
}

async function upsertNavigationAndFooter() {
  const nav = [
    ["WHO WE ARE", "/en/who-we-are", Locale.EN, 1],
    ["WHAT WE DO", "/en/what-we-do", Locale.EN, 2],
    ["FOUNDING MEMBERS", "/en/founding-members", Locale.EN, 3],
    ["PHOTO GALLERY", "/en/photo-gallery", Locale.EN, 4],
    ["من نحن", "/ar/who-we-are", Locale.AR, 1],
    ["ماذا نفعل", "/ar/what-we-do", Locale.AR, 2],
    ["الأعضاء المؤسسون", "/ar/founding-members", Locale.AR, 3],
    ["معرض الصور", "/ar/photo-gallery", Locale.AR, 4],
  ] as const;

  await prisma.navigationItem.deleteMany({});
  for (const [label, path, locale, sortOrder] of nav) {
    await prisma.navigationItem.create({
      data: { label, path, locale, sortOrder, isVisible: true },
    });
  }

  await prisma.footerColumn.deleteMany({});
  const footers = [
    {
      locale: Locale.EN,
      title: "LORA",
      sortOrder: 1,
      content: {
        text: "Luweibdeh old residents association",
        location: "Amman, Paris square",
        phone: "+962 7 7930 6500",
        email: "info@lorajo.org",
        credit: "Website built by Zworks, Dubai",
      },
      links: [],
    },
    {
      locale: Locale.AR,
      title: "لورا",
      sortOrder: 1,
      content: {
        text: "جمعية سكان جبل اللويبدة القدامى",
        location: "عمان، ميدان باريس",
        phone: "+962 7 7930 6500",
        email: "info@lorajo.org",
        credit: "Website built by Zworks, Dubai",
      },
      links: [],
    },
  ];

  for (const footer of footers) {
    await prisma.footerColumn.create({
      data: {
        ...footer,
        content: json(footer.content),
        links: json(footer.links),
      },
    });
  }
}

async function upsertMembers(mediaIds: Map<string, string>) {
  await prisma.member.deleteMany({});

  let index = 1;
  for (const [slug, name, imageKey] of memberNames) {
    await prisma.member.create({
      data: {
        locale: Locale.EN,
        slug,
        name,
        title: "Founding member",
        isFounder: true,
        sortOrder: index++,
        status: PublishState.PUBLISHED,
        bio: json({ en: "", ar: "" }),
        mediaAssetId: imageKey ? mediaIds.get(imageKey) : undefined,
      },
    });
  }
}

async function upsertGallery(mediaIds: Map<string, string>) {
  await prisma.galleryImage.deleteMany({});
  await prisma.galleryCollection.deleteMany({});

  const collections = [
    {
      slug: "historical-photos",
      title: "HISTORICAL PHOTOS",
      description: "Archival views and memory fragments from Jabal Al-Luweibdeh.",
      mediaKeys: ["square-de-paris", "luweibdeh-flower", "blue-house"],
      sortOrder: 1,
    },
    {
      slug: "landmarks",
      title: "LANDMARKS",
      description: "Civic, cultural, and architectural landmarks in the neighborhood.",
      mediaKeys: ["dar-al-anda", "alsaadi-mosque"],
      sortOrder: 2,
    },
    {
      slug: "famous-figures",
      title: "FAMOUS FIGURES",
      description: "Residents and public figures connected to Luweibdeh history.",
      mediaKeys: ["wael-hamza-smadi", "reem-farkouh", "saleem-quna"],
      sortOrder: 3,
    },
  ];

  for (const collection of collections) {
    const saved = await prisma.galleryCollection.create({
      data: {
        locale: Locale.EN,
        title: collection.title,
        slug: collection.slug,
        description: collection.description,
        sortOrder: collection.sortOrder,
        status: PublishState.PUBLISHED,
      },
    });

    let imageIndex = 1;
    for (const key of collection.mediaKeys) {
      const mediaAssetId = mediaIds.get(key);
      if (!mediaAssetId) continue;
      await prisma.galleryImage.create({
        data: {
          collectionId: saved.id,
          mediaAssetId,
          alt: collection.title,
          caption: collection.title,
          sortOrder: imageIndex++,
        },
      });
    }
  }
}

async function createPageWithSections(input: {
  locale: Locale;
  slug: string;
  title: string;
  seoDescription: string;
  sections: Array<{
    type: string;
    variant: string;
    content: Record<string, unknown>;
    settings?: Record<string, unknown>;
    spacing?: Record<string, unknown>;
    background?: Record<string, unknown>;
    alignment?: string;
  }>;
}) {
  const page = await prisma.page.upsert({
    where: { locale_slug: { locale: input.locale, slug: input.slug } },
    update: {
      title: input.title,
      seoTitle: input.title,
      seoDescription: input.seoDescription,
      status: PublishState.PUBLISHED,
      publishedAt: now,
    },
    create: {
      locale: input.locale,
      slug: input.slug,
      title: input.title,
      seoTitle: input.title,
      seoDescription: input.seoDescription,
      status: PublishState.PUBLISHED,
      publishedAt: now,
    },
  });

  await prisma.pageSection.deleteMany({ where: { pageId: page.id } });

  let sortOrder = 1;
  for (const section of input.sections) {
    await prisma.pageSection.create({
      data: {
        pageId: page.id,
        sortOrder: sortOrder++,
        isVisible: true,
        type: section.type,
        variant: section.variant,
        content: json(section.content),
        settings: json(section.settings ?? {}),
        spacing: json(section.spacing ?? { top: "large", bottom: "large" }),
        background: json(section.background ?? { token: "parchment" }),
        alignment: section.alignment ?? "left",
      },
    });
  }
}

async function upsertPages() {
  await createPageWithSections({
    locale: Locale.EN,
    slug: "home",
    title: "LORA",
    seoDescription: "Luweibdeh Old Residents Association preserves heritage, greenery, and community life in Jabal Al-Luweibdeh.",
    sections: [
      {
        type: "hero",
        variant: "editorial_fullscreen",
        content: {
          eyebrow: "Luweibdeh Old Residents Association",
          title: "LORA",
          subtitle: "Luweibdeh Old Residents Association",
          tagline: "Our cultural heritage is our identity",
          body: "A community association preserving Jabal Al-Luweibdeh's historical architecture, greenery, cultural memory, and civic life.",
          image: "/lora/gallery/luweibdeh-flower.jpg",
          logo: "/lora/brand/lora-logo.png",
          cta: { label: "Read More", href: "/en/who-we-are" },
        },
        settings: {
          imagePlacement: "background",
          overlayOpacity: 0.45,
          parallax: true,
          buttonStyle: "outline_green",
          titleTop: "LORA",
          titleBottom: "LUWEIBDEH",
          accentHex: "#01963c",
          defaultAspect: 16 / 9,
          heroScrubFrames: [
            "/lora/gallery/luweibdeh-flower.jpg",
            "/lora/gallery/square-de-paris.jpg",
            "/lora/gallery/dar-al-anda-art-gallery.jpg",
            "/lora/gallery/blue-house-4.jpg",
            "/lora/gallery/alsaadi-mosque.jpg",
            "/lora/gallery/luzmila-hospital.jpg",
            "/lora/gallery/dscf0022.jpg",
            "/lora/gallery/luweibdeh-flower-2.jpg",
          ],
        },
        background: { token: "black" },
      },
      {
        type: "text_marquee",
        variant: "heritage_line",
        content: {
          items: ["Heritage Preservation", "Community Engagement", "Sustainability", "Equity"],
        },
        settings: { speed: 32 },
        spacing: { top: "small", bottom: "small" },
      },
      {
        type: "heritage_story",
        variant: "overlapping_editorial",
        content: {
          label: "What we do ?",
          title: "Protecting a neighborhood without freezing it in time.",
          body: "LORA aims to enhance community engagement and improve services in the neighborhood in cultural, environmental, and heritage aspects.",
          image: "/lora/gallery/square-de-paris.jpg",
          cta: { label: "Read More", href: "/en/what-we-do" },
        },
        settings: { imagePlacement: "right", cardStyle: "stone_border" },
      },
      {
        type: "gallery_grid",
        variant: "lightbox_grid",
        content: {
          title: "Luweibdeh in fragments",
          items: [
            { src: "/lora/gallery/square-de-paris.jpg", alt: "Paris Square", caption: "Paris Square" },
            { src: "/lora/gallery/dar-al-anda-art-gallery.jpg", alt: "Dar Al-Anda", caption: "Dar Al-Anda" },
            { src: "/lora/gallery/blue-house-4.jpg", alt: "Blue House", caption: "Blue House" },
            { src: "/lora/gallery/alsaadi-mosque.jpg", alt: "Al Saadi Mosque", caption: "Al Saadi Mosque" },
            { src: "/lora/gallery/luweibdeh-flower.jpg", alt: "Luweibdeh Flower", caption: "Luweibdeh Flower" },
            { src: "/lora/gallery/luzmila-hospital.jpg", alt: "Luzmila Hospital", caption: "Luzmila Hospital" },
            { src: "/lora/gallery/dscf0022.jpg", alt: "Luweibdeh street detail", caption: "Street detail" },
          ],
        },
        settings: { columns: 4, lightbox: true },
      },
      {
        type: "newsletter_signup",
        variant: "centered_minimal",
        content: {
          title: "Stay close to the neighborhood.",
          body: "Receive LORA updates on cultural, environmental, and heritage initiatives.",
          buttonLabel: "Subscribe",
        },
        spacing: { top: "medium", bottom: "large" },
      },
    ],
  });

  await createPageWithSections({
    locale: Locale.EN,
    slug: "who-we-are",
    title: "LORA JO",
    seoDescription: "The Association of Old Residents of Jabal Al-Luweibdeh.",
    sections: [
      {
        type: "hero",
        variant: "centered_minimal",
        content: {
          title: "LORA JO",
          subtitle: "The Association of Old Residents of Jabal Al-Luweibdeh (LORA)",
        },
      },
      {
        type: "rich_text",
        variant: "editorial_body",
        content: {
          body: [
            "Established in 2024 at the initiative of a group of long-time residents, LORA is dedicated to preserving Luweibdeh's historical buildings, natural landscape, streets, and greenery in the face of the assault of modern trends of architectural urbanization and serving its community members.",
            "Its main activities include supporting all private and public initiatives to make this neighborhood attractive for cultural and artistic activities.",
            "LORA aspires to create a dynamic, engaged community that honors its past while looking forward to a sustainable and promising future.",
            "LORA voluntarily and equitably provides services to all its members, with no intention of generating financial profit or offering personal benefits, either directly or indirectly to its board members. It consciously avoids political, sectarian, and personal agendas.",
          ],
        },
      },
    ],
  });

  await createPageWithSections({
    locale: Locale.EN,
    slug: "what-we-do",
    title: "What we do ?",
    seoDescription: "LORA community, heritage, environmental, and local economic initiatives.",
    sections: [
      {
        type: "rich_text",
        variant: "what_we_do_gallery",
        content: {
          title: "What we do ?",
          subtitle: "LORA strengthens belonging, protects shared heritage, and supports practical community initiatives.",
          images: [
            { src: "/lora/gallery/dar-al-anda-art-gallery.jpg", alt: "Dar Al-Anda", caption: "Cultural activity" },
            { src: "/lora/gallery/square-de-paris.jpg", alt: "Paris Square", caption: "Public space" },
            { src: "/lora/gallery/alsaadi-mosque.jpg", alt: "Al Saadi Mosque", caption: "Heritage landmark" },
            { src: "/lora/gallery/blue-house-4.jpg", alt: "Blue House", caption: "Historical architecture" },
          ],
          body: [
            "The founding committee has outlined two primary objectives:",
            "1. Fostering a Sense of Belonging: LORA aims to enhance community engagement and improve services in the neighborhood in cultural, environmental, and heritage aspects.",
            "This will be achieved through research, documentation, skill development programs, lectures, seminars, and workshops tailored to the community, especially younger generations.",
            "LORA will spare no effort to analyze the neighborhood's challenges and issues and work with proper authorities to address them.",
            "2. Organizing Small Income-Generating Projects: LORA seeks to collaborate with residents to operate small-scale projects that benefit the community and individual participants.",
            "Programs include enhancing the economic well-being of Al-Luweibdeh residents, creating new job opportunities, and hosting a seasonal bazaar in collaboration with specialized local organizations.",
          ],
        },
      },
    ],
  });

  await createPageWithSections({
    locale: Locale.EN,
    slug: "founding-members",
    title: "LORA",
    seoDescription: "LORA founding members.",
    sections: [
      {
        type: "member_grid",
        variant: "team_showcase",
        content: {
          title: "Founding members",
          subtitle: "Dedication. Expertise. Passion.",
          oldImportedContent:
            "This is your Team section. It's a great place to introduce your team and talk about what makes it special, such as your culture or work philosophy. Don't be afraid to illustrate personality and character to help users connect with your team.",
          source: "members",
        },
        settings: { showOldImportedContent: false },
      },
    ],
  });

  await createPageWithSections({
    locale: Locale.EN,
    slug: "photo-gallery",
    title: "PHOTO GALLERY",
    seoDescription: "Historical photos, landmarks, and famous figures connected to Jabal Al-Luweibdeh.",
    sections: [
      {
        type: "gallery_masonry",
        variant: "staggered_grid",
        content: {
          title: "PHOTO GALLERY",
          subtitle: "Historical photos, landmarks, and public memory from Jabal Al-Luweibdeh.",
          collections: ["HISTORICAL PHOTOS", "LANDMARKS", "FAMOUS FIGURES"],
        },
      },
    ],
  });

  await createPageWithSections({
    locale: Locale.AR,
    slug: "home",
    title: "لورا",
    seoDescription: "جمعية سكان جبل اللويبدة القدامى.",
    sections: [
      {
        type: "hero",
        variant: "editorial_fullscreen",
        content: {
          eyebrow: "جمعية سكان جبل اللويبدة القدامى",
          title: "لورا",
          subtitle: "جمعية سكان جبل اللويبدة القدامى",
          tagline: "تراثنا الثقافي هو هويتنا",
          body: "جمعية مجتمعية تعمل على حفظ عمارة جبل اللويبدة التاريخية وخضرته وذاكرته الثقافية.",
          image: "/lora/gallery/luweibdeh-flower.jpg",
          logo: "/lora/brand/lora-logo.png",
          cta: { label: "اقرأ المزيد", href: "/ar/who-we-are" },
        },
        settings: {
          imagePlacement: "background",
          overlayOpacity: 0.45,
          parallax: true,
          titleTop: "LORA",
          titleBottom: "LUWEIBDEH",
          accentHex: "#01963c",
          defaultAspect: 16 / 9,
          heroScrubFrames: [
            "/lora/gallery/luweibdeh-flower.jpg",
            "/lora/gallery/square-de-paris.jpg",
            "/lora/gallery/dar-al-anda-art-gallery.jpg",
            "/lora/gallery/blue-house-4.jpg",
            "/lora/gallery/alsaadi-mosque.jpg",
            "/lora/gallery/luzmila-hospital.jpg",
            "/lora/gallery/dscf0022.jpg",
            "/lora/gallery/luweibdeh-flower-2.jpg",
          ],
        },
        background: { token: "black" },
      },
      {
        type: "heritage_story",
        variant: "overlapping_editorial",
        content: {
          label: "ماذا نفعل؟",
          title: "حفظ الحي مع إبقائه حيا.",
          body: "تسعى لورا إلى تعزيز انتماء المجتمع وتحسين الخدمات في الجوانب الثقافية والبيئية والتراثية.",
          image: "/lora/gallery/square-de-paris.jpg",
          cta: { label: "اقرأ المزيد", href: "/ar/what-we-do" },
        },
      },
    ],
  });
}

async function main() {
  await upsertTheme();
  await upsertSystemRecords();
  const mediaIds = await upsertMedia();
  await upsertNavigationAndFooter();
  await upsertMembers(mediaIds);
  await upsertGallery(mediaIds);
  await upsertPages();
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
