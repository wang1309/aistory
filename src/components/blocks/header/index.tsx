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

import type { NavItem } from "@/types/blocks/base";
import { Header as HeaderType } from "@/types/blocks/header";
import Icon from "@/components/icon";
import { Link } from "@/i18n/navigation";
import LocaleToggle from "@/components/locale/toggle";
import { Menu } from "lucide-react";
import SignToggle from "@/components/sign/toggle";
import ThemeToggle from "@/components/theme/toggle";
import { cn } from "@/lib/utils";
import { useTranslations } from "next-intl";
import { buildAiWriteHeaderNav } from "@/components/ai-write/workbench/_lib";

type GroupedNavCategory = {
  key: "featured" | "writing" | "creative" | "other";
  label?: string;
  description?: string;
  icon?: string;
  items: NavItem[];
};

function groupNavChildren(children: NavItem[] = []): GroupedNavCategory[] {
  const buckets: Record<GroupedNavCategory["key"], NavItem[]> = {
    featured: [],
    writing: [],
    creative: [],
    other: [],
  };

  for (const child of children) {
    const key = (child.category as GroupedNavCategory["key"] | undefined) ?? "other";
    if (key === "featured" || key === "writing" || key === "creative") {
      buckets[key].push(child);
    } else {
      buckets.other.push(child);
    }
  }

  const groups: GroupedNavCategory[] = [];
  if (buckets.featured.length) {
    groups.push({
      key: "featured",
      icon: "RiCompassesFill",
      items: buckets.featured,
    });
  }
  if (buckets.writing.length) {
    groups.push({
      key: "writing",
      icon: "RiQuillPenLine",
      items: buckets.writing,
    });
  }
  if (buckets.creative.length) {
    groups.push({
      key: "creative",
      icon: "RiSparkling2Line",
      items: buckets.creative,
    });
  }
  if (buckets.other.length) {
    groups.push({
      key: "other",
      items: buckets.other,
    });
  }

  return groups;
}

export default function Header({ header }: { header: HeaderType }) {
  const t = useTranslations();
  const navItems = buildAiWriteHeaderNav(header.nav?.items || []);

  if (header.disabled) {
    return null;
  }

  const renderCategoryHeader = (group: GroupedNavCategory) => {
    if (group.key === "other") {
      return null;
    }
    const labelKey =
      group.key === "featured"
        ? "ai_tools.category_featured"
        : group.key === "writing"
        ? "ai_tools.category_writing"
        : "ai_tools.category_creative";

    return (
      <div className="flex items-center gap-2 px-2 pb-2 pt-1">
        {group.icon && (
          <span className="flex size-6 items-center justify-center rounded-full bg-amber-500/10 text-amber-600 ring-1 ring-amber-500/20 dark:bg-amber-400/10 dark:text-amber-300 dark:ring-amber-400/20">
            <Icon name={group.icon} className="size-3.5" />
          </span>
        )}
        <span className="text-[10px] font-semibold uppercase tracking-[0.22em] text-amber-700/90 dark:text-amber-300/90">
          {t(labelKey)}
        </span>
      </div>
    );
  };

  return (
    <section className="py-3 relative z-50">
      <div className="container">
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
                  loading="lazy"
                />
              )}
              {header.brand?.title && (
                <span className="text-[1.3rem] font-display font-bold tracking-tight bg-gradient-to-r from-stone-600 via-amber-700 to-amber-600 dark:from-amber-200 dark:via-amber-300/90 dark:to-amber-200 bg-clip-text text-transparent transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)]">
                  {header.brand?.title || ""}
                </span>
              )}
            </Link>
            <div className="flex items-center">
              <NavigationMenu>
                <NavigationMenuList>
                  {navItems.map((item, i) => {
                    if (item.children && item.children.length > 0) {
                      const groups = groupNavChildren(item.children);
                      const featured =
                        groups.find((g) => g.key === "featured")?.items[0] ?? null;
                      const columnGroups = groups.filter(
                        (g) => g.key !== "featured"
                      );
                      const hasSingleColumn = columnGroups.length <= 1;

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
                            <div
                              className={cn(
                                "relative overflow-hidden rounded-[1.6rem] border border-black/[0.06] bg-popover/95 p-3 shadow-[0_24px_60px_-24px_rgba(38,28,12,0.28)] backdrop-blur-2xl dark:border-white/[0.06]",
                                hasSingleColumn ? "w-[22rem]" : "w-[40rem]"
                              )}
                            >
                              <div
                                aria-hidden
                                className="pointer-events-none absolute -top-24 -right-16 h-56 w-56 rounded-full bg-gradient-to-br from-amber-300/30 via-amber-500/15 to-transparent blur-3xl dark:from-amber-400/20 dark:via-amber-500/10"
                              />
                              {featured && (
                                <Link
                                  href={featured.url as any}
                                  target={featured.target}
                                  className="group/featured relative flex items-center gap-4 overflow-hidden rounded-[1.2rem] border border-amber-500/15 bg-gradient-to-br from-amber-50 via-white to-amber-50/60 p-4 transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] hover:border-amber-500/30 hover:shadow-[0_18px_40px_-22px_rgba(217,119,6,0.45)] dark:border-amber-400/15 dark:from-amber-500/[0.08] dark:via-background dark:to-amber-500/[0.04] dark:hover:border-amber-400/30"
                                >
                                  <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-500 to-amber-700 text-white shadow-[inset_0_1px_1px_rgba(255,255,255,0.4)] transition-transform duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover/featured:scale-[1.04]">
                                    <Icon
                                      name={featured.icon || "RiCompassesFill"}
                                      className="size-5"
                                    />
                                  </span>
                                  <div className="min-w-0 flex-1">
                                    <div className="flex items-center gap-2">
                                      <span className="text-[10px] font-semibold uppercase tracking-[0.22em] text-amber-700/90 dark:text-amber-300/90">
                                        {t("ai_tools.category_featured")}
                                      </span>
                                      <span className="h-1 w-1 rounded-full bg-amber-500/60" />
                                      <span className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground/70">
                                        {item.title}
                                      </span>
                                    </div>
                                    <div className="mt-1 text-sm font-semibold text-foreground">
                                      {featured.title}
                                    </div>
                                  </div>
                                  <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-amber-500/10 text-amber-700 ring-1 ring-amber-500/20 transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover/featured:translate-x-0.5 group-hover/featured:-translate-y-0.5 group-hover/featured:bg-amber-500/15 dark:bg-amber-400/10 dark:text-amber-300 dark:ring-amber-400/25">
                                    <Icon name="RiArrowRightUpLine" className="size-4" />
                                  </span>
                                </Link>
                              )}

                              <div
                                className={cn(
                                  "mt-3 grid gap-3 items-start",
                                  hasSingleColumn ? "grid-cols-1" : "grid-cols-2"
                                )}
                              >
                                {columnGroups.map((group) => (
                                  <div
                                    key={group.key}
                                    className="rounded-[1.1rem] border border-black/[0.04] bg-gradient-to-b from-white/80 to-white/40 p-2 dark:border-white/[0.04] dark:from-white/[0.03] dark:to-transparent"
                                  >
                                    {renderCategoryHeader(group)}
                                    <ul className="flex flex-col">
                                      {group.items.map((iitem, ii) => (
                                        <li key={ii}>
                                          <NavigationMenuLink asChild>
                                            <Link
                                              className={cn(
                                                "group/item flex select-none items-center gap-3 rounded-lg px-2.5 py-2 leading-none no-underline outline-hidden transition-all duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] hover:bg-amber-500/[0.07] hover:pl-3 focus:bg-amber-500/[0.07] dark:hover:bg-amber-400/[0.07]"
                                              )}
                                              href={iitem.url as any}
                                              target={iitem.target}
                                            >
                                              {iitem.icon && (
                                                <span className="flex size-7 shrink-0 items-center justify-center rounded-md bg-black/[0.04] text-muted-foreground transition-colors duration-300 group-hover/item:bg-amber-500/15 group-hover/item:text-amber-700 dark:bg-white/[0.04] dark:group-hover/item:bg-amber-400/15 dark:group-hover/item:text-amber-300">
                                                  <Icon
                                                    name={iitem.icon}
                                                    className="size-3.5"
                                                  />
                                                </span>
                                              )}
                                              <span className="text-[13px] font-medium text-foreground/90 group-hover/item:text-foreground">
                                                {iitem.title}
                                              </span>
                                            </Link>
                                          </NavigationMenuLink>
                                        </li>
                                      ))}
                                    </ul>
                                  </div>
                                ))}
                              </div>
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
                  loading="lazy"
                />
              )}
              {header.brand?.title && (
                <span className="text-[1.3rem] font-display font-bold tracking-tight bg-gradient-to-r from-stone-600 via-amber-700 to-amber-600 dark:from-amber-200 dark:via-amber-300/90 dark:to-amber-200 bg-clip-text text-transparent">
                  {header.brand?.title || ""}
                </span>
              )}
            </Link>
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="default" size="icon">
                  <Menu className="size-4" />
                </Button>
              </SheetTrigger>
              <SheetContent className="overflow-y-auto">
                <SheetHeader>
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
                          loading="lazy"
                        />
                      )}
                      {header.brand?.title && (
                        <span className="text-[1.3rem] font-display font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-stone-600 via-amber-700 to-amber-600 dark:from-amber-200 dark:via-amber-300/90 dark:to-amber-200">
                          {header.brand?.title || ""}
                        </span>
                      )}
                    </Link>
                  </SheetTitle>
                </SheetHeader>
                <div className="mb-8 mt-8 flex flex-col gap-4">
                  <Accordion type="single" collapsible className="w-full">
                    {navItems.map((item, i) => {
                      if (item.children && item.children.length > 0) {
                        const groups = groupNavChildren(item.children);
                        return (
                          <AccordionItem
                            key={i}
                            value={item.title || ""}
                            className="border-b-0"
                          >
                            <AccordionTrigger className="mb-4 py-0 font-semibold hover:no-underline text-left">
                              {item.title}
                            </AccordionTrigger>
                            <AccordionContent className="mt-2 flex flex-col gap-3">
                              {groups.map((group) => (
                                <div
                                  key={group.key}
                                  className="rounded-xl border border-black/[0.04] bg-black/[0.015] p-2 dark:border-white/[0.04] dark:bg-white/[0.02]"
                                >
                                  {group.key !== "other" && (
                                    <div className="mb-1 flex items-center gap-2 px-2 pt-1">
                                      {group.icon && (
                                        <span className="flex size-5 items-center justify-center rounded-full bg-amber-500/10 text-amber-700 dark:bg-amber-400/10 dark:text-amber-300">
                                          <Icon
                                            name={group.icon}
                                            className="size-3"
                                          />
                                        </span>
                                      )}
                                      <span className="text-[10px] font-semibold uppercase tracking-[0.22em] text-amber-700/90 dark:text-amber-300/90">
                                        {group.key === "featured"
                                          ? t("ai_tools.category_featured")
                                          : group.key === "writing"
                                          ? t("ai_tools.category_writing")
                                          : t("ai_tools.category_creative")}
                                      </span>
                                    </div>
                                  )}
                                  {group.items.map((iitem, ii) => (
                                    <Link
                                      key={ii}
                                      className={cn(
                                        "flex select-none gap-3 rounded-md p-2.5 leading-none outline-hidden transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground"
                                      )}
                                      href={iitem.url as any}
                                      target={iitem.target}
                                    >
                                      {iitem.icon && (
                                        <Icon
                                          name={iitem.icon}
                                          className="size-4 shrink-0"
                                        />
                                      )}
                                      <div className="text-sm font-semibold">
                                        {iitem.title}
                                      </div>
                                    </Link>
                                  ))}
                                </div>
                              ))}
                            </AccordionContent>
                          </AccordionItem>
                        );
                      }
                      return (
                        <Link
                          key={i}
                          href={item.url as any}
                          target={item.target}
                          className="font-semibold my-4 flex items-center gap-2 px-4"
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
                    className="font-semibold my-4 flex items-center gap-2 px-4"
                  >
                    <Icon name="RiCommunityLine" className="size-4 shrink-0" />
                    {t("community.title")}
                  </Link>
                  <Link
                    href={"/pricing" as any}
                    className="font-semibold my-4 flex items-center gap-2 px-4"
                  >
                    <Icon name="RiPriceTag3Line" className="size-4 shrink-0" />
                    {t("pricing.title")}
                  </Link>
                </div>
                <div className="flex-1"></div>
                <div className="border-t pt-4">
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
    </section>
  );
}
