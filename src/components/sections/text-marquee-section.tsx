import { SectionFrame } from "@/components/sections/section-frame";
import { stringArray } from "@/components/sections/section-content";
import type { CmsSection } from "@/types/cms";

export function TextMarqueeSection({ section }: { section: CmsSection }) {
  const items = stringArray(section.content, "items");
  const line = [...items, ...items, ...items];

  return (
    <SectionFrame section={section} className="overflow-hidden border-y border-black/10 py-6">
      <div className="flex w-max animate-[lora-marquee_42s_linear_infinite] gap-8">
        {line.map((item, index) => (
          <span key={`${item}-${index}`} className="text-sm uppercase tracking-[0.18em] text-black/58">
            {item}
          </span>
        ))}
      </div>
      <style>{`@keyframes lora-marquee { from { transform: translateX(0); } to { transform: translateX(-33.333%); } }`}</style>
    </SectionFrame>
  );
}
