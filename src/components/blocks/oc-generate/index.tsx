"use client";

import type { OcGenerate } from "@/types/blocks/oc-generate";

/**
 * Minimal stub renderer. The full workbench (mode selector, concept cards,
 * profile editor, reroll/lock, history drawer, exports) is implemented in the
 * follow-up workbench task. This placeholder keeps the route shell and type
 * contract compilable in the meantime.
 */
export default function OcGenerate({ section }: { section: OcGenerate }) {
  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-16 md:px-6">
      <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">
        {section.ui.title}
      </h1>
      <p className="mt-3 text-base text-muted-foreground">
        {section.ui.subtitle}
      </p>
    </div>
  );
}
