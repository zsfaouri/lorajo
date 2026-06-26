"use client";

import { useEffect } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Lenis from "lenis";

export function LoraScrollRuntime() {
  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let lenis: Lenis | null = null;

    if (!reduced) {
      lenis = new Lenis({ lerp: 0.075, smoothWheel: true, wheelMultiplier: 0.9 });
      lenis.on("scroll", ScrollTrigger.update);
      gsap.ticker.add((time) => lenis?.raf(time * 1000));
      gsap.ticker.lagSmoothing(0);
    }

    gsap.to(".lora-merged-hero__image", {
      yPercent: 14,
      ease: "none",
      scrollTrigger: { trigger: ".lora-merged-hero", start: "top top", end: "bottom top", scrub: true },
    });

    gsap.to(".lora-merged-bg__image", {
      yPercent: 12,
      ease: "none",
      scrollTrigger: { trigger: ".lora-merged", start: "top top", end: "bottom bottom", scrub: true },
    });

    gsap.utils.toArray<HTMLElement>(".lora-merged-reveal").forEach((element) => {
      gsap.fromTo(element, { opacity: 0, y: reduced ? 0 : 48 }, { opacity: 1, y: 0, duration: 1.05, ease: "power3.out", scrollTrigger: { trigger: element, start: "top 88%" } });
    });

    const track = document.querySelector<HTMLElement>(".lora-merged-track");
    const wrap = document.querySelector<HTMLElement>(".lora-merged-track-wrap");
    const section = document.querySelector<HTMLElement>(".lora-merged-ritual");
    if (!reduced && track && wrap && section) {
      const distance = () => Math.max(1, track.scrollWidth - wrap.clientWidth);
      const timeline = gsap.timeline({
        scrollTrigger: { trigger: section, start: "top top", end: () => `+=${distance() * 1.18}`, scrub: true, pin: true, anticipatePin: 1, invalidateOnRefresh: true },
      });
      timeline.to(track, { x: () => -distance(), ease: "none", duration: 1 });
      timeline.to(track, { x: () => -distance(), ease: "none", duration: 0.18 });
    }

    return () => {
      lenis?.destroy();
      ScrollTrigger.getAll().forEach((trigger) => trigger.kill());
    };
  }, []);

  return null;
}
