"use client";

import { motion, useReducedMotion } from "framer-motion";
import { useEffect, useRef, useState } from "react";

import { numberSetting, text } from "@/components/sections/section-content";
import type { CmsSection } from "@/types/cms";

export function VideoScrollHeroSection({ section }: { section: CmsSection }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const shouldReduceMotion = useReducedMotion();
  const startScale = numberSetting(section.settings, "startScale", 0.25);
  const overlayOpacity = numberSetting(section.settings, "overlayOpacity", 0.28);
  const enableAnimations = section.settings.enableAnimations !== false;
  const videoSrc =
    typeof section.settings.videoSrc === "string"
      ? section.settings.videoSrc
      : "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4";
  const [scrollScale, setScrollScale] = useState(startScale);

  useEffect(() => {
    if (!enableAnimations || shouldReduceMotion) return;

    const handleScroll = () => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const containerHeight = containerRef.current.offsetHeight;
      const windowHeight = window.innerHeight;
      const scrolled = Math.max(0, -rect.top);
      const maxScroll = Math.max(containerHeight - windowHeight, 1);
      const progress = Math.min(scrolled / maxScroll, 1);
      setScrollScale(startScale + progress * (1 - startScale));
    };

    window.addEventListener("scroll", handleScroll);
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, [enableAnimations, shouldReduceMotion, startScale]);

  const shouldAnimate = enableAnimations && !shouldReduceMotion;

  return (
    <section className="relative bg-[var(--color-black)]">
      <div ref={containerRef} className="relative h-[200vh]">
        <div className="sticky top-0 z-10 flex h-screen w-full items-center justify-center overflow-hidden">
          <div
            className="relative flex items-center justify-center will-change-transform"
            style={{
              transform: shouldAnimate ? `scale(${scrollScale})` : "scale(1)",
              transformOrigin: "center center",
            }}
          >
            <video autoPlay loop muted playsInline className="h-[62vh] w-[82vw] max-w-5xl rounded-[var(--radius-media)] object-cover shadow-2xl">
              <source src={videoSrc} type="video/mp4" />
            </video>

            <motion.div
              className="absolute inset-0 flex items-center justify-center rounded-[var(--radius-media)] text-white"
              style={{ backgroundColor: `rgba(10,10,10,${overlayOpacity})` }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.35, duration: 0.8 }}
            >
              <div className="max-w-3xl px-6 text-center">
                <motion.h1
                  className="text-[clamp(3rem,9vw,8rem)] font-[var(--font-heading-weight)] leading-none"
                  initial={{ opacity: 0, y: 28 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.55, duration: 0.8, type: "spring", stiffness: 200, damping: 25 }}
                >
                  {text(section.content, "title", "LORA")}
                </motion.h1>
                <motion.p
                  className="mt-5 text-lg text-white/78 md:text-2xl"
                  initial={{ opacity: 0, y: 18 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.75, duration: 0.8, type: "spring", stiffness: 200, damping: 25 }}
                >
                  {text(section.content, "subtitle", "Luweibdeh Old Residents Association")}
                </motion.p>
                <motion.p
                  className="mt-5 text-xs uppercase tracking-[0.18em] text-[var(--color-jasmine)]"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.95, duration: 0.8 }}
                >
                  {text(section.content, "tagline", "Our cultural heritage is our identity")}
                </motion.p>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
}
