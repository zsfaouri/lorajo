import Image from "next/image";

import { SectionFrame } from "@/components/sections/section-frame";
import { text } from "@/components/sections/section-content";
import type { ArticleDto, CmsSection } from "@/types/cms";

function formatDate(value?: string | null) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export function AnnouncementListSection({ section, articles }: { section: CmsSection; articles: ArticleDto[] }) {
  return (
    <SectionFrame section={section}>
      <div className="mx-auto max-w-7xl">
        <div className="mb-10 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--color-heritage-green)]">LORA</p>
            <h2 className="mt-4 text-[clamp(2.4rem,6vw,5rem)] font-[var(--font-heading-weight)] uppercase leading-[0.9]">
              {text(section.content, "title", "Announcements")}
            </h2>
          </div>
          <p className="max-w-md text-sm leading-6 text-black/55">{text(section.content, "subtitle", "Latest updates from LORA.")}</p>
        </div>

        {articles.length ? (
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {articles.map((article) => (
              <article key={article.id} className="overflow-hidden rounded-[var(--radius-card)] border border-black/10 bg-white shadow-sm">
                {article.image ? (
                  <div className="relative aspect-video bg-black/5">
                    <Image src={article.image.src} alt={article.image.alt} fill sizes="(min-width: 1280px) 30vw, 50vw" className="object-cover" unoptimized={article.image.src.startsWith("http")} />
                  </div>
                ) : null}
                <div className="p-5">
                  <p className="text-xs uppercase tracking-[0.16em] text-black/42">{formatDate(article.publishedAt) || "Announcement"}</p>
                  <h3 className="mt-3 text-2xl font-semibold">{article.title}</h3>
                  <p className="mt-3 text-sm leading-6 text-black/58">{article.excerpt ?? article.body}</p>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="rounded-[var(--radius-card)] border border-black/10 bg-white p-8 text-sm text-black/55">No published announcements yet.</div>
        )}
      </div>
    </SectionFrame>
  );
}
