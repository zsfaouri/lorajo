"use client";

import Image from "next/image";
import { Search } from "lucide-react";
import { useMemo, useState } from "react";

import { SectionFrame } from "@/components/sections/section-frame";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import type { CmsSection, NeighborhoodArchiveItem } from "@/types/cms";

function ArchiveImage({ item }: { item: NeighborhoodArchiveItem }) {
  if (item.mediaType === "VIDEO") {
    return (
      <iframe
        src={item.src}
        title={item.name}
        className="h-full w-full border-0"
        allow="autoplay; encrypted-media; picture-in-picture"
        allowFullScreen
      />
    );
  }

  if (item.src.includes("supabase.co/storage/")) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={item.src} alt={item.name} className="h-full w-full object-cover" />;
  }

  return <Image src={item.src} alt={item.name} fill className="object-cover" sizes="(min-width: 1024px) 33vw, 100vw" />;
}

export function NeighborhoodArchiveSection({
  section,
  items,
}: {
  section: CmsSection;
  items: NeighborhoodArchiveItem[];
}) {
  const [query, setQuery] = useState("");
  const title = typeof section.content.title === "string" ? section.content.title : "Neighborhood Archive";
  const subtitle =
    typeof section.content.subtitle === "string"
      ? section.content.subtitle
      : "A searchable library of neighborhood names, photographs, videos, and memory fragments from Jabal Al-Luweibdeh.";

  const names = useMemo(() => [...new Set(items.map((item) => item.name).filter(Boolean))].sort((a, b) => a.localeCompare(b)), [items]);
  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return items;
    return items.filter((item) => `${item.name} ${item.text ?? ""} ${item.folder ?? ""}`.toLowerCase().includes(normalized));
  }, [items, query]);

  return (
    <SectionFrame section={section} className="bg-[var(--color-soft-white)] pt-32">
      <div className="mx-auto grid max-w-7xl gap-10">
        <div className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-end">
          <div>
            <p className="text-xs uppercase tracking-[0.22em] text-[var(--color-heritage-green)]">LORA archive</p>
            <h1 className="mt-5 text-[clamp(3.2rem,8vw,7.5rem)] font-[var(--font-heading-weight)] uppercase leading-[0.88]">
              {title}
            </h1>
          </div>
          <div className="grid gap-5">
            <p className="max-w-2xl text-lg leading-8 text-black/62">{subtitle}</p>
            <label className="relative block" aria-label="Search archive by name">
              <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-black/38" />
              <Input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search by name"
                className="h-14 rounded-full border-black/15 bg-white pl-12 text-base shadow-sm"
              />
            </label>
          </div>
        </div>

        <div className="grid gap-8 lg:grid-cols-[280px_1fr]">
          <aside className="h-fit rounded-md border border-black/10 bg-white p-4 shadow-sm">
            <div className="flex items-center justify-between border-b border-black/10 pb-3">
              <p className="text-sm font-medium text-black">Names library</p>
              <span className="text-xs text-black/42">{names.length}</span>
            </div>
            <div className="mt-3 grid max-h-[420px] gap-1 overflow-auto">
              {names.map((name) => (
                <button
                  key={name}
                  type="button"
                  onClick={() => setQuery(name)}
                  className={cn(
                    "rounded-md px-3 py-2 text-left text-sm transition-colors",
                    query === name ? "bg-[var(--color-heritage-green)] text-white" : "text-black/62 hover:bg-black/[0.04] hover:text-black",
                  )}
                >
                  {name}
                </button>
              ))}
            </div>
          </aside>

          <main className="grid gap-5">
            <div className="flex items-center justify-between border-b border-black/10 pb-3">
              <p className="text-sm uppercase tracking-[0.16em] text-black/45">Archive records</p>
              <span className="text-sm text-black/50">{filtered.length} shown</span>
            </div>

            {filtered.length === 0 ? (
              <div className="rounded-md border border-dashed border-black/15 bg-white p-10 text-center text-sm text-black/50">
                No archive records match this name.
              </div>
            ) : (
              <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
                {filtered.map((item) => (
                  <article key={item.id} className="overflow-hidden rounded-md border border-black/10 bg-white shadow-sm">
                    <div className="relative aspect-[4/3] bg-black">
                      <ArchiveImage item={item} />
                      <span className="absolute left-3 top-3 rounded-full bg-white/88 px-3 py-1 text-[11px] uppercase tracking-[0.14em] text-black">
                        {item.mediaType === "VIDEO" ? "Video" : "Picture"}
                      </span>
                    </div>
                    <div className="grid gap-2 p-4">
                      <h2 className="text-xl font-medium leading-tight text-black">{item.name}</h2>
                      {item.text ? <p className="text-sm leading-6 text-black/58">{item.text}</p> : null}
                    </div>
                  </article>
                ))}
              </div>
            )}
          </main>
        </div>
      </div>
    </SectionFrame>
  );
}
