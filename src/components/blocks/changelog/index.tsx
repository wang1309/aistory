"use client";

import { Changelog as ChangelogType } from "@/types/blocks/changelog";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Link } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { CheckCircle2, Bug, Zap, Shield } from "lucide-react";

export default function Changelog({ changelog }: { changelog: ChangelogType }) {
  const t = useTranslations();

  if (changelog.disabled) {
    return null;
  }

  const getChangeTypeConfig = (type: string) => {
    switch (type) {
      case "feature":
        return {
          label: t("changelog.types.feature"),
          variant: "default" as const,
          icon: CheckCircle2,
          className: "bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20",
        };
      case "fix":
        return {
          label: t("changelog.types.fix"),
          variant: "destructive" as const,
          icon: Bug,
          className: "bg-red-500/10 text-red-700 dark:text-red-400 border-red-500/20",
        };
      case "improvement":
        return {
          label: t("changelog.types.improvement"),
          variant: "secondary" as const,
          icon: Zap,
          className: "bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/20",
        };
      case "security":
        return {
          label: t("changelog.types.security"),
          variant: "outline" as const,
          icon: Shield,
          className: "bg-yellow-500/10 text-yellow-700 dark:text-yellow-400 border-yellow-500/20",
        };
      default:
        return {
          label: type,
          variant: "outline" as const,
          icon: CheckCircle2,
          className: "",
        };
    }
  };

  const getChangeLink = (text: string) => {
    const lower = text.toLowerCase();

    // 故事广场 / Story Square -> 社区故事广场
    if (text.includes("故事广场") || lower.includes("story square")) {
      return "/community";
    }

    // 我的故事 / My Stories -> 用户中心我的故事
    if (
      text.includes("我的故事") ||
      lower.includes("my stories") ||
      lower.includes("my-stories") ||
      lower.includes("meine geschichten") ||
      lower.includes("мои истории")
    ) {
      return "/my-stories";
    }

    // 创作概览 / Creation Overview / 创作总览 / 创作サマリー / 창작 현황 / Schreibübersicht / Обзор творчества
    if (
      text.includes("创作概览") ||
      text.includes("创作总览") ||
      lower.includes("creation overview") ||
      text.includes("創作サマリー") ||
      text.includes("창작 현황") ||
      lower.includes("schreibübersicht") ||
      text.includes("Обзор творчества")
    ) {
      return "/creator-dashboard";
    }

    return null;
  };

  return (
    <section className="container py-16">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          {changelog.label && (
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-4">
              {changelog.label}
            </p>
          )}
          <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-foreground via-foreground/90 to-foreground/80 bg-clip-text text-transparent">
            {changelog.title}
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            {changelog.description}
          </p>
        </div>

        {/* Timeline */}
        <div className="relative">
          {/* Vertical line */}
          <div className="absolute left-[100px] top-0 bottom-0 w-0.5 bg-border hidden md:block" />

          {/* Changelog items */}
          <div className="space-y-12">
            {changelog.items?.map((item, index) => (
              <div key={index} className="relative">
                {/* Version badge on the left */}
                <div className="md:absolute md:left-0 md:w-[100px] md:text-right md:pr-8 mb-4 md:mb-0">
                  <div className="inline-flex flex-col items-end">
                    <Badge className="mb-2 font-mono font-bold text-sm">
                      {item.version}
                    </Badge>
                    <time className="text-xs text-muted-foreground">
                      {new Date(item.date).toLocaleDateString(undefined, {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                      })}
                    </time>
                  </div>
                </div>

                {/* Timeline dot */}
                <div className="hidden md:block absolute left-[100px] top-2 w-3 h-3 rounded-full bg-primary border-4 border-background transform -translate-x-1/2" />

                {/* Content card */}
                <div className="md:ml-[132px]">
                  <Card className="overflow-hidden">
                    <CardContent className="p-6">
                      <div className="space-y-6">
                        {item.changes.map((change, changeIndex) => {
                          const config = getChangeTypeConfig(change.type);
                          const Icon = config.icon;

                          return (
                            <div key={changeIndex}>
                              <div className="flex items-center gap-2 mb-3">
                                <Badge
                                  variant={config.variant}
                                  className={config.className}
                                >
                                  <Icon className="w-3 h-3 mr-1" />
                                  {config.label}
                                </Badge>
                              </div>
                              <ul className="space-y-2 ml-1">
                                {change.items.map((changeItem, itemIndex) => {
                                  const href = getChangeLink(changeItem);

                                  const content = (
                                    <>
                                      <span className="text-muted-foreground mt-1">•</span>
                                      <span>{changeItem}</span>
                                    </>
                                  );

                                  if (!href) {
                                    return (
                                      <li
                                        key={itemIndex}
                                        className="flex items-start gap-2 text-sm text-foreground/90"
                                      >
                                        {content}
                                      </li>
                                    );
                                  }

                                  return (
                                    <li
                                      key={itemIndex}
                                      className="flex items-start gap-2 text-sm text-foreground/90"
                                    >
                                      <Link
                                        href={href as any}
                                        className="inline-flex items-start gap-2 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                                      >
                                        {content}
                                      </Link>
                                    </li>
                                  );
                                })}
                              </ul>
                            </div>
                          );
                        })}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
