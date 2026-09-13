"use client";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
  navigationMenuTriggerStyle,
} from "@/components/ui/navigation-menu";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";

import { Header as HeaderType } from "@/types/blocks/header";
import Icon from "@/components/icon";
import { Link, usePathname } from "@/i18n/navigation";
import LocaleToggle from "@/components/locale/toggle";
import { Menu } from "lucide-react";
import SignToggle from "@/components/sign/toggle";
import ThemeToggle from "@/components/theme/toggle";
import { cn } from "@/lib/utils";
import { useTranslations } from "next-intl";
import { buildAiWriteHeaderNav } from "@/components/ai-write/workbench/_lib";
import {
  getToolsByModule,
  type Tool,
  type ToolCategory,
} from "@/services/tools";

const AI_WRITE_TOOL_HUB_URL = "/ai-write-tool";

const COLUMN_GROUP: Record<ToolCategory, 0 | 1 | 2> = {
  story: 0,
  character: 0,
  title: 1,
  plot: 1,
  poem: 1,
  social: 2,
  name: 2,
  utility: 2,
};

const COLUMN_DEFS: Array<{ icon: string; labelKey: string }> = [
  { icon: "RiBookOpenLine", labelKey: "ai_tools.column_story" },
  { icon: "RiQuillPenLine", labelKey: "ai_tools.column_title_structure" },
  { icon: "RiChat3Line", labelKey: "ai_tools.column_creative" },
];

type HeaderToolItem = {
  tool: Tool;
  name: string;
  description: string;
  href: string;
  icon: string;
  badge?: "hot" | "new";
};

function useHeaderToolColumns() {
  const t = useTranslations();
  const all = getToolsByModule("ai-write");
  // story-generator 的 href 是主页 "/",Header 下拉里再放一次属于冗余入口
  const forHeader = all.filter((tool) => tool.slug !== "story-generator");
  const columns: HeaderToolItem[][] = [[], [], []];
  for (const tool of forHeader) {
    const colIdx = COLUMN_GROUP[tool.category];
    columns[colIdx].push({
      tool,
      name: t(tool.nameKey),
      description: t(tool.shortDescKey),
      href: tool.href,
      icon: tool.icon,
      badge: tool.badges?.includes("hot")
        ? "hot"
        : tool.badges?.includes("new")
        ? "new"
        : undefined,
    });
  }
  return { columns, total: all.length };
}

function ToolColumn({
  colIdx,
  colItems,
  renderBadge,
}: {
  colIdx: number;
  colItems: HeaderToolItem[];
  renderBadge: (badge?: "hot" | "new") => ReactNode;
}) {
  const t = useTranslations();
  const listRef = useRef<HTMLUListElement>(null);
  const [canScrollDown, setCanScrollDown] = useState(false);

  const checkScroll = useCallback(() => {
    const el = listRef.current;
    if (!el) return;
    const distanceFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
    setCanScrollDown(distanceFromBottom > 8);
  }, []);

  const scrollDown = useCallback(() => {
    const el = listRef.current;
    if (!el) return;
    el.scrollTo({
      top: el.scrollTop + el.clientHeight * 0.75,
      behavior: "smooth",
    });
  }, []);

  useEffect(() => {
    checkScroll();
  }, [colItems, checkScroll]);

  return (
    <div className="relative rounded-xl border border-border bg-card p-2">
      <div className="flex items-center gap-2 px-2 pb-2 pt-1">
        <span className="flex size-6 items-center justify-center rounded-full bg-primary/10 text-primary">
          <Icon name={COLUMN_DEFS[colIdx].icon} className="size-3.5" />
        </span>
        <span className="text-[10px] font-semibold uppercase tracking-[0.22em] text-muted-foreground">
          {t(COLUMN_DEFS[colIdx].labelKey)}
        </span>
      </div>
      <ul
        ref={listRef}
        onScroll={checkScroll}
        className="flex max-h-[28rem] flex-col overflow-y-auto scroll-smooth pr-1"
      >
        {colItems.map((wt) => (
          <li key={wt.tool.slug}>
            <NavigationMenuLink asChild>
              <Link
                className="group/item relative flex select-none items-center gap-3 rounded-lg px-2.5 py-2 leading-none no-underline outline-hidden transition-colors duration-200 hover:bg-accent focus:bg-accent"
                href={wt.href as any}
              >
                <span className="flex size-7 shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground transition-colors duration-200 group-hover/item:bg-primary/10 group-hover/item:text-primary">
                  <Icon name={wt.icon} className="size-3.5" />
                </span>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span
                      className="min-w-0 flex-1 truncate pr-7 text-[13px] font-medium text-foreground/90 group-hover/item:text-foreground"
                      tabIndex={-1}
                    >
                      {wt.name}
                    </span>
                  </TooltipTrigger>
                  <TooltipContent side="top" className="max-w-[16rem]">
                    {wt.name}
                  </TooltipContent>
                </Tooltip>
                {renderBadge(wt.badge)}
              </Link>
            </NavigationMenuLink>
          </li>
        ))}
      </ul>
      {canScrollDown && (
        <button
          type="button"
          onClick={scrollDown}
          aria-label={t("ai_tools.scroll_down")}
          className="absolute bottom-1 left-1/2 z-20 flex size-7 -translate-x-1/2 items-center justify-center rounded-full border border-border bg-popover text-foreground shadow-md transition hover:bg-accent"
        >
          <Icon name="RiArrowDownSLine" className="size-4" />
        </button>
      )}
    </div>
  );
}

export default function Header({ header }: { header: HeaderType }) {
  const t = useTranslations();
  const navItems = buildAiWriteHeaderNav(header.nav?.items || []);
  const { columns: toolColumns, total: toolTotal } = useHeaderToolColumns();
  const mobileDrawerItemClassName =
    "mx-5 flex items-center gap-3 rounded-xl px-5 py-3 font-semibold transition-colors hover:bg-accent hover:text-accent-foreground";

  // 移动端抽屉受控：路由变化后自动关闭,避免点击导航项跳转后抽屉仍残留
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  if (header.disabled) {
    return null;
  }

  const renderToolBadge = (badge?: "hot" | "new") => {
    if (!badge) return null;
    const label = badge === "hot" ? t("ai_tools.badge_hot") : t("ai_tools.badge_new");
    return (
      <span
        className={cn(
          "pointer-events-none absolute right-1.5 top-1.5 z-10 inline-flex items-center rounded-full px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wider",
          badge === "hot"
            ? "bg-rose-500/15 text-rose-600 dark:bg-rose-400/15 dark:text-rose-300"
            : "bg-emerald-500/15 text-emerald-600 dark:bg-emerald-400/15 dark:text-emerald-300"
        )}
      >
        {label}
      </span>
    );
  };

  return (
    <header className="sticky top-0 z-50 border-b border-border/40 bg-background/80 backdrop-blur-xl supports-[backdrop-filter]:bg-background/65">
      <div className="container py-3">
        <nav className="hidden justify-between lg:flex">
          <div className="flex items-center gap-6">
            <Link
              href={(header.brand?.url as any) || "/"}
              className="flex items-center gap-2"
            >
              {header.brand?.logo?.src && (
                <img
                  src={header.brand.logo.src}
                  alt={header.brand.logo.alt || header.brand.title}
                  className="w-8"
                  width={32}
                  height={32}
                />
              )}
              {header.brand?.title && (
                <span className="text-[1.3rem] font-display font-bold tracking-tight text-foreground">
                  {header.brand?.title || ""}
                </span>
              )}
            </Link>
            <div className="flex items-center">
              <NavigationMenu>
                <NavigationMenuList>
                  {navItems.map((item, i) => {
                    if (item.url === AI_WRITE_TOOL_HUB_URL) {
                      return (
                        <NavigationMenuItem
                          key={i}
                          className="text-muted-foreground"
                        >
                          <NavigationMenuTrigger>
                            {item.icon && (
                              <Icon
                                name={item.icon}
                                className="size-4 shrink-0 mr-2"
                              />
                            )}
                            <span>{item.title}</span>
                          </NavigationMenuTrigger>
                          <NavigationMenuContent>
                            <div className="relative w-[42rem] max-w-[calc(100vw-2.5rem)] overflow-hidden rounded-2xl border border-border bg-popover p-2.5 shadow-xl xl:w-[48rem] xl:p-3 2xl:w-[52rem]">
                              <div className="relative grid grid-cols-3 gap-2 xl:gap-3">
                                {toolColumns.map((colItems, colIdx) => (
                                  <ToolColumn
                                    key={colIdx}
                                    colIdx={colIdx}
                                    colItems={colItems}
                                    renderBadge={renderToolBadge}
                                  />
                                ))}
                              </div>

                              <Link
                                href={AI_WRITE_TOOL_HUB_URL as any}
                                className="group/cta mt-3 flex items-center gap-3 rounded-xl border border-border bg-card px-3 py-2.5 no-underline outline-hidden transition-colors duration-200 hover:border-foreground/20 hover:bg-accent"
                              >
                                <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-foreground text-background">
                                  <Icon name="RiGridLine" className="size-4" />
                                </span>
                                <div className="min-w-0 flex-1">
                                  <div className="text-[13px] font-semibold text-foreground">
                                    {t("ai_tools.view_all_cta", { count: toolTotal })}
                                  </div>
                                  <div className="text-[10px] text-muted-foreground">
                                    {t("ai_tools.view_all_sub")}
                                  </div>
                                </div>
                                <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-muted text-foreground transition-transform duration-200 group-hover/cta:translate-x-0.5">
                                  <Icon name="RiArrowRightLine" className="size-4" />
                                </span>
                              </Link>
                            </div>
                          </NavigationMenuContent>
                        </NavigationMenuItem>
                      );
                    }

                    return (
                      <NavigationMenuItem key={i}>
                        <Link
                          className={cn(
                            "text-muted-foreground",
                            navigationMenuTriggerStyle,
                            buttonVariants({
                              variant: "ghost",
                            })
                          )}
                          href={item.url as any}
                          target={item.target}
                        >
                          {item.icon && (
                            <Icon
                              name={item.icon}
                              className="size-4 shrink-0 mr-0"
                            />
                          )}
                          {item.title}
                        </Link>
                      </NavigationMenuItem>
                    );
                  })}
                  <NavigationMenuItem>
                    <Link
                      className={cn(
                        "text-muted-foreground",
                        navigationMenuTriggerStyle,
                        buttonVariants({
                          variant: "ghost",
                        })
                      )}
                      href={"/community" as any}
                    >
                      <Icon name="RiCommunityLine" className="size-4 shrink-0 mr-0" />
                      {t("community.title")}
                    </Link>
                  </NavigationMenuItem>
                  <NavigationMenuItem>
                    <Link
                      className={cn(
                        "text-muted-foreground",
                        navigationMenuTriggerStyle,
                        buttonVariants({
                          variant: "ghost",
                        })
                      )}
                      href={"/ai-tools" as any}
                    >
                      <Icon name="RiToolsLine" className="size-4 shrink-0 mr-0" />
                      {t("ai_tools.tools_hub_nav")}
                    </Link>
                  </NavigationMenuItem>
                  <NavigationMenuItem>
                    <Link
                      className={cn(
                        "text-muted-foreground",
                        navigationMenuTriggerStyle,
                        buttonVariants({
                          variant: "ghost",
                        })
                      )}
                      href={"/pricing" as any}
                    >
                      <Icon name="RiPriceTag3Line" className="size-4 shrink-0 mr-0" />
                      {t("pricing.title")}
                    </Link>
                  </NavigationMenuItem>
                </NavigationMenuList>
              </NavigationMenu>
            </div>
          </div>
          <div className="shrink-0 flex gap-2 items-center">
            {header.show_locale && <LocaleToggle />}
            {header.show_theme && <ThemeToggle />}

            {header.buttons?.map((item, i) => {
              return (
                <Button key={i} variant={item.variant}>
                  <Link
                    href={item.url as any}
                    target={item.target || ""}
                    className="flex items-center gap-1 cursor-pointer"
                  >
                    {item.title}
                    {item.icon && (
                      <Icon name={item.icon} className="size-4 shrink-0" />
                    )}
                  </Link>
                </Button>
              );
            })}
            {header.show_sign && <SignToggle />}
          </div>
        </nav>

        <div className="block lg:hidden">
          <div className="flex items-center justify-between">
            <Link
              href={(header.brand?.url || "/") as any}
              className="flex items-center gap-2"
            >
              {header.brand?.logo?.src && (
                <img
                  src={header.brand.logo.src}
                  alt={header.brand.logo.alt || header.brand.title}
                  className="w-8"
                  width={32}
                  height={32}
                />
              )}
              {header.brand?.title && (
                <span className="text-[1.3rem] font-display font-bold tracking-tight text-foreground">
                  {header.brand?.title || ""}
                </span>
              )}
            </Link>
            <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="text-foreground">
                  <Menu className="size-5" />
                </Button>
              </SheetTrigger>
              <SheetContent
                onClick={(e) => {
                  // 点击任意导航链接立即收起抽屉,避免等页面加载才关的"点了没反应"感;
                  // Accordion 触发器/语言·主题切换是按钮(closest("a") 为 null),不会误关
                  if ((e.target as HTMLElement).closest("a")) {
                    setMobileOpen(false);
                  }
                }}
                className="w-[min(92vw,24rem)] overflow-y-auto p-0 sm:max-w-sm"
              >
                <SheetHeader className="px-5 pb-4 pr-14 pt-5">
                  <SheetTitle>
                    <Link
                      href={(header.brand?.url || "/") as any}
                      className="flex items-center gap-2"
                    >
                      {header.brand?.logo?.src && (
                        <img
                          src={header.brand.logo.src}
                          alt={header.brand.logo.alt || header.brand.title}
                          className="w-8"
                          width={32}
                          height={32}
                        />
                      )}
                      {header.brand?.title && (
                        <span className="text-[1.3rem] font-display font-bold tracking-tight text-foreground">
                          {header.brand?.title || ""}
                        </span>
                      )}
                    </Link>
                  </SheetTitle>
                </SheetHeader>
                <div className="mb-8 mt-4 flex flex-col gap-3">
                  <Accordion type="single" collapsible className="w-full">
                    {navItems.map((item, i) => {
                      if (item.url === AI_WRITE_TOOL_HUB_URL) {
                        return (
                          <AccordionItem
                            key={i}
                            value={item.title || ""}
                            className="border-b-0"
                          >
                            <AccordionTrigger className="rounded-xl px-5 py-3 text-left text-base font-semibold hover:no-underline [&>svg]:ml-4 [&>svg]:shrink-0 [&>svg]:text-muted-foreground">
                              <span className="flex min-w-0 items-center gap-3">
                                {item.icon && (
                                  <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                                    <Icon
                                      name={item.icon}
                                      className="size-4 shrink-0"
                                    />
                                  </span>
                                )}
                                <span className="truncate">{item.title}</span>
                              </span>
                            </AccordionTrigger>
                            <AccordionContent className="px-5 pb-2 pt-1">
                              <div className="flex flex-col gap-3 rounded-2xl border border-border bg-muted/40 p-3">
                                {toolColumns.map((colItems, colIdx) => (
                                  <div
                                    key={colIdx}
                                    className="rounded-xl border border-border bg-card p-2.5"
                                  >
                                    <div className="mb-1.5 flex items-center gap-2 px-1.5 pt-0.5">
                                      <span className="flex size-6 items-center justify-center rounded-full bg-primary/10 text-primary">
                                        <Icon
                                          name={COLUMN_DEFS[colIdx].icon}
                                          className="size-3.5"
                                        />
                                      </span>
                                      <span className="text-[10px] font-semibold uppercase tracking-[0.22em] text-muted-foreground">
                                        {t(COLUMN_DEFS[colIdx].labelKey)}
                                      </span>
                                    </div>
                                    {colItems.map((wt) => (
                                      <Link
                                        key={wt.tool.slug}
                                        className="relative flex select-none items-center gap-3 rounded-lg px-2.5 py-2.5 leading-none outline-hidden transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground"
                                        href={wt.href as any}
                                      >
                                        <span className="flex size-8 shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground">
                                          <Icon
                                            name={wt.icon}
                                            className="size-4 shrink-0"
                                          />
                                        </span>
                                        <div
                                          className="min-w-0 flex-1 truncate pr-8 text-sm font-semibold"
                                          title={wt.name}
                                        >
                                          {wt.name}
                                        </div>
                                        {renderToolBadge(wt.badge)}
                                      </Link>
                                    ))}
                                  </div>
                                ))}
                                <Link
                                  href={AI_WRITE_TOOL_HUB_URL as any}
                                  className="flex items-center gap-3 rounded-xl border border-border bg-card px-3.5 py-3 text-sm font-semibold text-foreground transition-colors hover:bg-accent"
                                >
                                  <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-foreground text-background">
                                    <Icon
                                      name="RiGridLine"
                                      className="size-4 shrink-0"
                                    />
                                  </span>
                                  {t("ai_tools.view_all_cta", { count: toolTotal })}
                                  <Icon
                                    name="RiArrowRightSLine"
                                    className="ml-auto size-4 shrink-0"
                                  />
                                </Link>
                              </div>
                            </AccordionContent>
                          </AccordionItem>
                        );
                      }
                      return (
                        <Link
                          key={i}
                          href={item.url as any}
                          target={item.target}
                          className={mobileDrawerItemClassName}
                        >
                          {item.icon && (
                            <Icon
                              name={item.icon}
                              className="size-4 shrink-0"
                            />
                          )}
                          {item.title}
                        </Link>
                      );
                    })}
                  </Accordion>
                  <Link
                    href={"/community" as any}
                    className={mobileDrawerItemClassName}
                  >
                    <Icon name="RiCommunityLine" className="size-4 shrink-0" />
                    {t("community.title")}
                  </Link>
                  <Link
                    href={"/ai-tools" as any}
                    className={mobileDrawerItemClassName}
                  >
                    <Icon name="RiToolsLine" className="size-4 shrink-0" />
                    {t("ai_tools.tools_hub_nav")}
                  </Link>
                  <Link
                    href={"/pricing" as any}
                    className={mobileDrawerItemClassName}
                  >
                    <Icon name="RiPriceTag3Line" className="size-4 shrink-0" />
                    {t("pricing.title")}
                  </Link>
                </div>
                <div className="flex-1"></div>
                <div className="border-t px-5 pt-4">
                  <div className="mt-2 flex flex-col gap-3">
                    {header.buttons?.map((item, i) => {
                      return (
                        <Button key={i} variant={item.variant}>
                          <Link
                            href={item.url as any}
                            target={item.target || ""}
                            className="flex items-center gap-1"
                          >
                            {item.title}
                            {item.icon && (
                              <Icon
                                name={item.icon}
                                className="size-4 shrink-0"
                              />
                            )}
                          </Link>
                        </Button>
                      );
                    })}

                    {header.show_sign && <SignToggle />}
                  </div>

                  <div className="mt-4 flex items-center gap-2">
                    {header.show_locale && <LocaleToggle />}
                    <div className="flex-1"></div>

                    {header.show_theme && <ThemeToggle />}
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </header>
  );
}
