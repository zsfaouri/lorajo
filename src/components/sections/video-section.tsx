import Image from "next/image";

import { SectionFrame } from "@/components/sections/section-frame";
import { text } from "@/components/sections/section-content";
import type { CmsSection } from "@/types/cms";

function embedUrl(url: string) {
  const youtube = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&?/]+)/i)?.[1];
  if (youtube) return `https://www.youtube.com/embed/${youtube}`;

  const vimeo = url.match(/vimeo\.com\/(\d+)/i)?.[1];
  if (vimeo) return `https://player.vimeo.com/video/${vimeo}`;

  return "";
}

function isDirectVideo(url: string) {
  return /\.(mp4|webm|ogg)(?:\?.*)?$/i.test(url);
}

export function VideoSection({ section }: { section: CmsSection }) {
  const videoUrl = text(section.content, "videoUrl");
  const poster = text(section.content, "image");
  const embedded = embedUrl(videoUrl);

  return (
    <SectionFrame section={section}>
      <div className="mx-auto grid max-w-6xl gap-8 md:grid-cols-[0.75fr_1.25fr] md:items-center">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--color-heritage-green)]">Video</p>
          <h2 className="mt-4 text-[clamp(2.2rem,5vw,4.8rem)] font-[var(--font-heading-weight)] uppercase leading-[0.9]">
            {text(section.content, "title", "Video")}
          </h2>
          <p className="mt-5 text-base leading-7 text-black/60">{text(section.content, "body")}</p>
        </div>
        <div className="overflow-hidden rounded-[var(--radius-card)] border border-black/10 bg-black shadow-sm">
          <div className="relative aspect-video">
            {embedded ? (
              <iframe
                src={embedded}
                title={text(section.content, "title", "Video")}
                className="absolute inset-0 h-full w-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
              />
            ) : isDirectVideo(videoUrl) ? (
              <video src={videoUrl} poster={poster || undefined} controls className="h-full w-full object-cover" />
            ) : poster ? (
              <Image src={poster} alt={text(section.content, "title", "Video poster")} fill sizes="(min-width: 768px) 55vw, 100vw" className="object-cover" unoptimized={poster.startsWith("http")} />
            ) : (
              <div className="flex h-full items-center justify-center p-8 text-center text-sm text-white/60">Add a video URL or poster image in the admin page editor.</div>
            )}
          </div>
        </div>
      </div>
    </SectionFrame>
  );
}
