"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

import { isRecord } from "@/lib/utils";
import type { CmsSection } from "@/types/cms";

gsap.registerPlugin(ScrollTrigger);

const PIN_VH_MULTIPLE = 3.2;
const IMMERSE_OVERFILL = 1.04;
const ENTRY_DELAY = 0.2;
const CARD_START_SCALE_DESKTOP = 0.6;
const CARD_START_SCALE_MOBILE = 0.82;
const CARD_VIEWPORT_HEIGHT = 0.58;

type HeroScrubProps = {
  frameCount: number;
  frameUrl: (index: number) => string;
  titleTop: string;
  titleBottom: string;
  bgClassName?: string;
  accentHex?: string;
  defaultAspect?: number;
};

function usePrefersReducedMotion() {
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReduced(mq.matches);
    update();
    mq.addEventListener?.("change", update);
    return () => mq.removeEventListener?.("change", update);
  }, []);

  return reduced;
}

export function HeroScrub({
  frameCount,
  frameUrl,
  titleTop,
  titleBottom,
  bgClassName = "bg-black",
  accentHex = "#01963c",
  defaultAspect = 16 / 9,
}: HeroScrubProps) {
  const sectionRef = useRef<HTMLElement>(null);
  const stickyRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imagesRef = useRef<HTMLImageElement[]>([]);
  const lastDrawnRef = useRef<number>(-1);
  const bgRef = useRef<HTMLDivElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const titleTopRef = useRef<HTMLHeadingElement>(null);
  const titleBottomRef = useRef<HTMLHeadingElement>(null);

  const [ready, setReady] = useState(false);
  const [framesOk, setFramesOk] = useState(true);
  const [aspect, setAspect] = useState<number>(defaultAspect);
  const reduced = usePrefersReducedMotion();

  useEffect(() => {
    if (reduced) return;
    let cancelled = false;
    let errored = 0;
    const images: HTMLImageElement[] = new Array(frameCount);
    imagesRef.current = images;

    const onFirstReady = (img: HTMLImageElement) => {
      if (cancelled) return;
      const canvas = canvasRef.current;
      if (canvas && img.naturalWidth && img.naturalHeight) {
        canvas.width = img.naturalWidth;
        canvas.height = img.naturalHeight;
        const ctx = canvas.getContext("2d");
        ctx?.drawImage(img, 0, 0);
        lastDrawnRef.current = 0;
        setAspect(img.naturalWidth / img.naturalHeight);
      }
      setReady(true);
    };

    const onErr = () => {
      errored++;
      if (!cancelled && errored >= 5) setFramesOk(false);
    };

    const loadOne = (i: number) => {
      const img = new window.Image();
      img.decoding = "async";
      if (i < 4) {
        (img as HTMLImageElement & { fetchPriority?: string }).fetchPriority = "high";
      }
      img.onerror = onErr;
      if (i === 0) img.onload = () => onFirstReady(img);
      img.src = frameUrl(i);
      images[i] = img;
    };

    const initial = Math.min(20, frameCount);
    for (let i = 0; i < initial; i++) loadOne(i);

    const batch = 20;
    let cursor = initial;
    let timer: ReturnType<typeof setTimeout> | null = null;
    const loadNext = () => {
      if (cancelled) return;
      const end = Math.min(frameCount, cursor + batch);
      for (let i = cursor; i < end; i++) loadOne(i);
      cursor = end;
      if (cursor < frameCount) timer = setTimeout(loadNext, 80);
    };
    timer = setTimeout(loadNext, 200);

    const fallbackTimer = window.setTimeout(() => {
      if (!cancelled && !images[0]?.complete) setFramesOk(false);
    }, 4500);

    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
      window.clearTimeout(fallbackTimer);
    };
  }, [reduced, frameCount, frameUrl]);

  useEffect(() => {
    if (reduced) return;
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ delay: ENTRY_DELAY });
      tl.from(bgRef.current, { opacity: 0, duration: 1.4, ease: "power2.out" });
      tl.from(cardRef.current, { opacity: 0, duration: 1.1, ease: "power3.out" }, 0.35);
      tl.from(titleTopRef.current, { opacity: 0, y: 30, duration: 1, ease: "expo.out" }, 0.5);
      tl.from(titleBottomRef.current, { opacity: 0, y: -30, duration: 1, ease: "expo.out" }, 0.62);
    }, sectionRef);
    return () => ctx.revert();
  }, [reduced]);

  useEffect(() => {
    if (reduced || !ready || !framesOk) return;
    const section = sectionRef.current;
    if (!section) return;

    const ctx = gsap.context(() => {
      const startScale = () => (window.innerWidth < 768 ? CARD_START_SCALE_MOBILE : CARD_START_SCALE_DESKTOP);

      const immerseScale = () => {
        const vw = window.innerWidth;
        const vh = window.innerHeight;
        const baseW = Math.min(vw * 0.92, vh * CARD_VIEWPORT_HEIGHT * aspect);
        const baseH = Math.min(vh * CARD_VIEWPORT_HEIGHT, (vw * 0.92) / aspect);
        if (baseW <= 0 || baseH <= 0) return 1.5;
        return Math.max(vw / baseW, vh / baseH) * IMMERSE_OVERFILL;
      };

      const isLoaded = (i: number) => {
        const img = imagesRef.current[i];
        return !!img && img.complete && img.naturalWidth > 0;
      };

      const drawFrame = (index: number) => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        let useIdx = index;
        if (!isLoaded(useIdx)) {
          let found = -1;
          for (let d = 1; d < frameCount; d++) {
            if (useIdx - d >= 0 && isLoaded(useIdx - d)) {
              found = useIdx - d;
              break;
            }
            if (useIdx + d < frameCount && isLoaded(useIdx + d)) {
              found = useIdx + d;
              break;
            }
          }
          if (found === -1) return;
          useIdx = found;
        }
        if (lastDrawnRef.current === useIdx) return;
        const img = imagesRef.current[useIdx];
        const ctx2 = canvas.getContext("2d");
        if (!ctx2 || !img) return;
        ctx2.drawImage(img, 0, 0, canvas.width, canvas.height);
        lastDrawnRef.current = useIdx;
      };

      gsap.set([cardRef.current, titleTopRef.current, titleBottomRef.current], { opacity: 1 });
      gsap.set(cardRef.current, { scale: startScale(), transformOrigin: "50% 50%" });

      const master = gsap.timeline({
        scrollTrigger: {
          trigger: section,
          start: "top top",
          end: "bottom bottom",
          scrub: 0.4,
          invalidateOnRefresh: true,
          onUpdate: (self) => {
            const p = self.progress;
            const mapped = gsap.utils.clamp(0, 1, (p - 0.15) / 0.63);
            const frameIdx = Math.min(frameCount - 1, Math.floor(mapped * frameCount));
            drawFrame(frameIdx);
          },
        },
      });

      master.to(cardRef.current, { scale: 1, ease: "power2.out", duration: 0.15 }, 0);
      master.to(
        titleTopRef.current,
        {
          x: () => (window.innerWidth < 768 ? "-70vw" : "-60vw"),
          letterSpacing: "0.02em",
          ease: "power2.inOut",
          duration: 0.15,
        },
        0,
      );
      master.to(
        titleBottomRef.current,
        {
          x: () => (window.innerWidth < 768 ? "70vw" : "60vw"),
          letterSpacing: "0.02em",
          ease: "power2.inOut",
          duration: 0.15,
        },
        0,
      );

      master.to(cardRef.current, { scale: immerseScale(), ease: "power2.in", duration: 0.63 }, 0.15);
      master.to(titleTopRef.current, { opacity: 0, ease: "power1.in", duration: 0.22 }, 0.15);
      master.to(titleBottomRef.current, { opacity: 0, ease: "power1.in", duration: 0.22 }, 0.15);

      master.to(cardRef.current, { scale: startScale(), ease: "power3.inOut", duration: 0.22 }, 0.78);
      master.to(
        titleTopRef.current,
        { x: 0, opacity: 1, letterSpacing: "-0.04em", ease: "power2.inOut", duration: 0.22 },
        0.78,
      );
      master.to(
        titleBottomRef.current,
        { x: 0, opacity: 1, letterSpacing: "-0.04em", ease: "power2.inOut", duration: 0.22 },
        0.78,
      );

      ScrollTrigger.refresh();
    }, sectionRef);

    return () => ctx.revert();
  }, [ready, framesOk, reduced, aspect, frameCount]);

  const tallHeight = `${(PIN_VH_MULTIPLE + 1) * 100}vh`;

  return (
    <section
      ref={sectionRef}
      className={`relative w-full overflow-clip text-white ${bgClassName}`}
      style={{ height: tallHeight }}
      aria-label="Cinematic scroll-scrubbed hero"
    >
      <div
        ref={stickyRef}
        className="sticky top-20 flex h-[calc(100svh-5rem)] w-full flex-col items-center justify-center overflow-hidden"
      >
        <div ref={bgRef} aria-hidden className="absolute inset-0 z-0" style={{ backgroundColor: accentHex }} />
        <div aria-hidden className="absolute inset-0 z-0 bg-black/30" />
        <div
          aria-hidden
          className="absolute inset-0 z-0"
          style={{
            background: "radial-gradient(ellipse at 50% 35%, rgba(255,255,255,0.08) 0%, rgba(0,0,0,0) 55%)",
          }}
        />
        <div
          aria-hidden
          className="absolute inset-0 z-0"
          style={{
            background: "radial-gradient(ellipse at center, transparent 55%, rgba(0,0,0,0.55) 100%)",
          }}
        />

        <div className="relative z-10 flex h-full w-full flex-col items-center justify-center gap-2 px-5 md:gap-3">
          <h2
            ref={titleTopRef}
            aria-hidden
            className="relative z-30 font-black uppercase text-white"
            style={{
              fontSize: "clamp(3.25rem, 10vw, 8.5rem)",
              lineHeight: 0.85,
              letterSpacing: "-0.04em",
              opacity: 1,
            }}
          >
            {titleTop}
          </h2>

          <div
            ref={cardRef}
            className="relative z-20 overflow-hidden rounded-[12px] bg-black/25 shadow-[0_20px_80px_rgba(0,0,0,0.55)] ring-1 ring-white/10 will-change-transform md:rounded-[16px]"
            style={{
              width: `min(92vw, calc(${CARD_VIEWPORT_HEIGHT * 100}svh * ${aspect}))`,
              height: `min(${CARD_VIEWPORT_HEIGHT * 100}svh, calc(92vw / ${aspect}))`,
              aspectRatio: aspect,
              opacity: 1,
            }}
          >
            <div aria-hidden className="pointer-events-none absolute inset-0 z-20 shadow-[inset_0_0_120px_rgba(0,0,0,0.45)]" />
            {framesOk ? <canvas ref={canvasRef} aria-hidden className="absolute inset-0 h-full w-full object-cover" /> : null}
            {!ready || !framesOk ? (
              <Image
                src={frameUrl(0)}
                alt=""
                aria-hidden
                draggable={false}
                fill
                priority
                sizes="96vw"
                className="object-cover"
              />
            ) : null}
          </div>

          <h2
            ref={titleBottomRef}
            aria-hidden
            className="relative z-30 font-black uppercase text-white"
            style={{
              fontSize: "clamp(3.25rem, 10vw, 8.5rem)",
              lineHeight: 0.85,
              letterSpacing: "-0.04em",
              opacity: 1,
            }}
          >
            {titleBottom}
          </h2>
        </div>
      </div>
    </section>
  );
}

const defaultFrames = [
  "/lora/gallery/luweibdeh-flower.jpg",
  "/lora/gallery/square-de-paris.jpg",
  "/lora/gallery/dar-al-anda-art-gallery.jpg",
  "/lora/gallery/blue-house-4.jpg",
  "/lora/gallery/alsaadi-mosque.jpg",
  "/lora/gallery/luzmila-hospital.jpg",
  "/lora/gallery/dscf0022.jpg",
  "/lora/gallery/luweibdeh-flower-2.jpg",
].filter(Boolean);

function getStringSetting(settings: Record<string, unknown>, key: string, fallback: string) {
  const value = settings[key];
  return typeof value === "string" ? value : fallback;
}

function getNumberSetting(settings: Record<string, unknown>, key: string, fallback: number) {
  const value = settings[key];
  return typeof value === "number" ? value : fallback;
}

function getFrameUrls(section: CmsSection) {
  const configured = section.settings.heroScrubFrames;
  if (!Array.isArray(configured)) return defaultFrames;

  const urls = configured
    .map((item) => {
      if (typeof item === "string") return item;
      if (isRecord(item) && typeof item.src === "string") return item.src;
      return null;
    })
    .filter((item): item is string => Boolean(item));

  return urls.length > 0 ? urls : defaultFrames;
}

export function HeroScrubSection({ section }: { section: CmsSection }) {
  const frames = useMemo(() => getFrameUrls(section), [section]);
  const titleTop = getStringSetting(section.settings, "titleTop", String(section.content.title ?? "LORA"));
  const titleBottom = getStringSetting(section.settings, "titleBottom", "LUWEIBDEH");
  const accentHex = getStringSetting(section.settings, "accentHex", "#01963c");
  const defaultAspect = getNumberSetting(section.settings, "defaultAspect", 16 / 9);

  return (
    <HeroScrub
      frameCount={frames.length}
      frameUrl={(index) => frames[index % frames.length]}
      titleTop={titleTop}
      titleBottom={titleBottom}
      bgClassName="bg-[var(--color-black)]"
      accentHex={accentHex}
      defaultAspect={defaultAspect}
    />
  );
}
