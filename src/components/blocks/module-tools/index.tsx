import React from "react";
import { getToolsByModule, type ModuleId } from "@/services/tools";
import { getTranslations } from "next-intl/server";
import { AnimatedToolsGrid } from "./animated-tools-grid";

interface ModuleToolsSectionProps {
  module: ModuleId;
  title: string;
  description?: string;
  showBackground?: boolean;
  headingLevel?: "h1" | "h2";
  excludeSlug?: string;
}

export default async function ModuleToolsSection({
  module,
  title,
  description,
  showBackground = true,
  headingLevel = "h2",
  excludeSlug,
}: ModuleToolsSectionProps) {
  const t = await getTranslations();
  const tools = getToolsByModule(module).filter((tool) =>
    excludeSlug ? tool.slug !== excludeSlug : true
  );

  if (!tools.length) {
    return null;
  }

  const HeadingTag = headingLevel;
  const badgeCategoryLabel = t("ai_tools.badge_category");
  const buttonLabel = t("ai_tools.button_use_now");

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
    <section
      id={`${module}-tools`}
      className="relative py-32 lg:py-48 overflow-hidden"
    >
      {showBackground && (
        <div className="absolute inset-0 pointer-events-none">
           <div className="absolute inset-0 bg-background" />
           
           {/* Subtle Grid Pattern */}
           <div className="absolute inset-0 bg-[linear-gradient(to_right,#8882_1px,transparent_1px),linear-gradient(to_bottom,#8882_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] opacity-[0.05]" />
           
           {/* Premium Noise Texture */}
           <div className="absolute inset-0 bg-noise opacity-[0.03] mix-blend-overlay" />
        </div>
      )}

      <div className="container relative z-10 px-4 md:px-6 mx-auto">
        <div className="mx-auto mb-20 flex max-w-3xl flex-col items-center gap-6 text-center">
          <HeadingTag className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight">
            <span className="text-foreground">
              {title}
            </span>
          </HeadingTag>
          
          {description && (
            <p className="max-w-2xl text-lg sm:text-xl text-muted-foreground/80 leading-relaxed font-light">
              {description}
            </p>
          )}
        </div>

        <AnimatedToolsGrid
          tools={toolCards}
          badgeCategoryLabel={badgeCategoryLabel}
          buttonLabel={buttonLabel}
        />
      </div>
    </section>
  );
}
