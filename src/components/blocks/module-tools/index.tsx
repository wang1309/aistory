import React from "react";
import {
  getAllTools,
  getToolGroup,
  getToolsByModule,
  type ModuleId,
} from "@/services/tools";
import { getTranslations } from "next-intl/server";
import { ToolsExplorer } from "./tools-explorer";
import { type AccentColor } from "@/components/sections/accent";
import SectionHeader from "@/components/sections/section-header";

interface ModuleToolsSectionProps {
  /** 单模块目录,或 "all" 聚合全站工具(All Tools hub 用)。 */
  module: ModuleId | "all";
  title: string;
  description?: string;
  excludeSlug?: string;
  accent?: AccentColor;
  label?: string;
  /**
   * 筛选 chips 切到粗粒度三大组(Writing/Social/Name)而非细分类目。
   * 仅 module="all" 的 hub 页使用。
   */
  groupedChips?: boolean;
  /**
   * force-static 渲染下无参 getTranslations 会回落 defaultLocale,
   * 调用方须把页面 locale 显式传进来。
   */
  locale?: string;
}

export default async function ModuleToolsSection({
  module,
  title,
  description,
  excludeSlug,
  accent = "orange",
  label,
  groupedChips = false,
  locale,
}: ModuleToolsSectionProps) {
  const t = locale
    ? await getTranslations({ locale })
    : await getTranslations();
  const moduleTools =
    module === "all" ? getAllTools() : getToolsByModule(module);
  const tools = moduleTools.filter((tool) =>
    excludeSlug ? tool.slug !== excludeSlug : true
  );
  const newTools = tools.filter((tool) => tool.badges?.includes("new"));

  if (!tools.length) return null;

  const toCard = (tool: (typeof tools)[number]) => ({
    slug: tool.slug,
    icon: tool.icon,
    href: tool.href,
    name: t(tool.nameKey),
    description: t(tool.shortDescKey),
    category: tool.category,
    group: getToolGroup(tool),
    accent: tool.accent,
    image: tool.image,
    badges: tool.badges?.map((badge) => ({
      type: badge,
      label: badge === "hot" ? t("ai_tools.badge_hot") : t("ai_tools.badge_new"),
    })),
  });

  const toolCards = tools.map(toCard);
  const newToolCards = newTools.map(toCard);

  // Only carve out a "New" cluster when it is a true subset: when every tool in
  // the module is new, the label is meaningless and the main grid would end up
  // empty (every slug excluded), surfacing a false "no results" state.
  // Hub(groupedChips)模式保持单一连续网格,避免 New 区尾行留白断层。
  const splitNewTools =
    !groupedChips &&
    newToolCards.length > 0 &&
    newToolCards.length < toolCards.length;

  return (
    <section className="relative overflow-hidden py-28 sm:py-36">
      <div className="relative mx-auto max-w-screen-xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <SectionHeader
          label={label}
          title={title}
          description={description}
          align="center"
          highlight="AI"
          accent="amber"
          descriptionClassName="font-light"
        />

        <ToolsExplorer
            tools={toolCards}
            newTools={splitNewTools ? newToolCards : []}
            accent={accent}
            groupedChips={groupedChips}
          />
      </div>
    </section>
  );
}
