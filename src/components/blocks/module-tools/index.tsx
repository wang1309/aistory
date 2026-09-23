import React from "react";
import {
  getAllTools,
  getToolGroup,
  getToolsByModule,
  type ModuleId,
} from "@/services/tools";
import { getTranslations } from "next-intl/server";
import { ToolsExplorer } from "./tools-explorer";
import {
  ToolsDirectory,
  CATEGORY_LABEL_KEYS,
  CATEGORY_ORDER,
} from "./tools-directory";
import type { ToolCardVariant } from "./animated-tools-grid";
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
  /**
   * compact 时渲染无图紧凑卡,且封面图 URL 不进入客户端 payload
   * (首页用,避免 20+ R2 图片拖慢加载)。
   */
  variant?: ToolCardVariant;
  /**
   * explorer(默认):搜索 + 筛选 chips + 交互过滤网格;
   * grouped:无搜索/筛选,按分类分组的静态目录(AI Write 目录页用)。
   */
  layout?: "explorer" | "grouped";
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
  variant = "media",
  layout = "explorer",
}: ModuleToolsSectionProps) {
  const t = locale
    ? await getTranslations({ locale })
    : await getTranslations();
  const moduleTools =
    module === "all" ? getAllTools() : getToolsByModule(module);
  const tools = moduleTools.filter((tool) =>
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
    group: getToolGroup(tool),
    accent: tool.accent,
    // compact 变体零图片:封面 URL 根本不下发给客户端。
    ...(variant === "compact" ? {} : { image: tool.image }),
    badges: tool.badges?.map((badge) => ({
      type: badge,
      label: badge === "hot" ? t("ai_tools.badge_hot") : t("ai_tools.badge_new"),
    })),
  });

  const toolCards = tools.map(toCard);

  let list: React.ReactNode;
  if (layout === "grouped") {
    const groups = CATEGORY_ORDER.map((id) => ({
      id,
      label: t(CATEGORY_LABEL_KEYS[id]),
      tools: toolCards.filter((card) => card.category === id),
    })).filter((group) => group.tools.length > 0);
    list = (
      <ToolsDirectory
        groups={groups}
        accent={accent}
        variant={variant}
        hubLabel={t("ai_tools.tools_hub_nav")}
      />
    );
  } else {
    list = (
      <ToolsExplorer
        tools={toolCards}
        accent={accent}
        groupedChips={groupedChips}
        variant={variant}
      />
    );
  }

  // Single continuous grid (new tools are flagged via badges instead of being
  // carved out into a separate cluster — a partial cluster row leaves ragged
  // empty cells mid-section). A tail CTA tile fills the last row's remainder.
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

        {list}
      </div>
    </section>
  );
}
