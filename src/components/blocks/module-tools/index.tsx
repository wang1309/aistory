import React from "react";
import { getToolsByModule, getNewTools, type ModuleId } from "@/services/tools";
import { getTranslations } from "next-intl/server";
import { ToolsExplorer } from "./tools-explorer";
import { type AccentColor } from "@/components/sections/accent";

interface ModuleToolsSectionProps {
  module: ModuleId;
  title: string;
  description?: string;
  excludeSlug?: string;
  accent?: AccentColor;
  label?: string;
}

export default async function ModuleToolsSection({
  module,
  title,
  description,
  excludeSlug,
  accent = "orange",
  label,
}: ModuleToolsSectionProps) {
  const t = await getTranslations();
  const tools = getToolsByModule(module).filter((tool) =>
    excludeSlug ? tool.slug !== excludeSlug : true
  );
  const newTools = getNewTools(module).filter((tool) =>
    excludeSlug ? tool.slug !== excludeSlug : true
  );

  if (!tools.length) return null;

  const toCard = (tool: (typeof tools)[number]) => ({
    slug: tool.slug,
    icon: tool.icon,
    href: tool.href,
    name: t(tool.nameKey),
    description: t(tool.shortDescKey),
    category: tool.category,
    badges: tool.badges?.map((badge) => ({
      type: badge,
      label: badge === "hot" ? t("ai_tools.badge_hot") : t("ai_tools.badge_new"),
    })),
  });

  const toolCards = tools.map(toCard);
  const newToolCards = newTools.map(toCard);

  // Split title to highlight "AI"
  const HIGHLIGHT = "AI";
  const titleParts = title.split(new RegExp(`(${HIGHLIGHT})`, "g"));

  return (
    <section className="relative overflow-hidden py-28 sm:py-36">
      {/* Ambient background */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute inset-x-0 top-0 h-[450px] bg-[radial-gradient(ellipse_55%_40%_at_50%_0%,oklch(0.96_0.035_65),transparent)] dark:bg-[radial-gradient(ellipse_55%_40%_at_50%_0%,oklch(0.15_0.02_55),transparent)]" />
        <div
          className="absolute -left-[6%] bottom-[8%] h-[320px] w-[320px] rounded-full opacity-[0.06] dark:opacity-[0.04]"
          style={{ background: "radial-gradient(circle, oklch(0.90 0.06 55) 0%, transparent 70%)" }}
        />
      </div>

      <div className="relative mx-auto max-w-screen-xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mx-auto max-w-xl text-center">
          {label && (
            <span className="inline-flex items-center gap-2 rounded-full border border-border/25 bg-background/80 px-4 py-1.5 text-[10px] uppercase tracking-[0.2em] font-semibold text-muted-foreground">
              <span className="inline-block size-1.5 rounded-full bg-primary opacity-60" />
              {label}
            </span>
          )}

          <h2 className="font-display text-3xl font-bold tracking-tight text-foreground sm:text-4xl leading-[1.1] mt-5">
            {titleParts.map((part, i) =>
              part === HIGHLIGHT ? (
                <span key={i} className="bg-gradient-to-r from-primary via-primary/80 to-primary/60 bg-clip-text text-transparent">
                  {part}
                </span>
              ) : (
                part
              )
            )}
          </h2>

          {/* Decorative brush stroke */}
          <div className="flex justify-center">
            <svg
              className="mt-2 mb-5 h-2.5 w-28 text-primary/25"
              viewBox="0 0 160 12"
              fill="none"
              preserveAspectRatio="none"
            >
              <path
                d="M2 8c30-5 60-6 90-3s40 4 66-1"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
          </div>

          {description && (
            <p className="max-w-md mx-auto text-base leading-relaxed text-muted-foreground/65 font-light">
              {description}
            </p>
          )}
        </div>

        <ToolsExplorer
            tools={toolCards}
            newTools={newToolCards}
            accent={accent}
          />
      </div>
    </section>
  );
}
