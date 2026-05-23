import React from "react";
import { getToolsByModule, type ModuleId } from "@/services/tools";
import { getTranslations } from "next-intl/server";
import { AnimatedToolsGrid } from "./animated-tools-grid";
import { type AccentColor } from "@/components/sections/accent";

interface ModuleToolsSectionProps {
  module: ModuleId;
  title: string;
  description?: string;
  excludeSlug?: string;
  accent?: AccentColor;
}

export default async function ModuleToolsSection({
  module,
  title,
  description,
  excludeSlug,
  accent = "orange",
}: ModuleToolsSectionProps) {
  const t = await getTranslations();
  const tools = getToolsByModule(module).filter((tool) =>
    excludeSlug ? tool.slug !== excludeSlug : true
  );

  if (!tools.length) return null;

  const badgeCategoryLabel = t("ai_tools.badge_category");

  const toolCards = tools.map((tool) => ({
    slug: tool.slug,
    icon: tool.icon,
    href: tool.href,
    name: t(tool.nameKey),
    description: t(tool.shortDescKey),
    badges: tool.badges?.map((badge) => ({
      type: badge,
      label: badge === "hot" ? t("ai_tools.badge_hot") : t("ai_tools.badge_new"),
    })),
  }));

  return (
    <section className="relative overflow-hidden py-20 sm:py-24">
      <div className="relative mx-auto max-w-screen-xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            {title}
          </h2>
          {description && (
            <p className="mt-4 text-base leading-relaxed text-muted-foreground">
              {description}
            </p>
          )}
        </div>

        <AnimatedToolsGrid
          tools={toolCards}
          badgeCategoryLabel={badgeCategoryLabel}
          accent={accent}
        />
      </div>
    </section>
  );
}
