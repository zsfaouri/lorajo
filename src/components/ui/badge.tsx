import * as React from "react";

import { cn } from "@/lib/utils";

export function Badge({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "inline-flex items-center rounded-full border border-[var(--color-stone)] px-3 py-1 text-xs uppercase tracking-[0.14em] text-black/70",
        className,
      )}
      {...props}
    />
  );
}
