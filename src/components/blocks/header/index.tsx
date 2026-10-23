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
import { useEffect, useState } from "react";

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
  ToolsMegaMenu,
  ToolsMobileMenu,
  useWritingToolsMenu,
} from "@/components/blocks/header/tools-menu";

const AI_WRITE_TOOL_HUB_URL = "/ai-write-tool";

export default function Header({ header }: { header: HeaderType }) {
  const t = useTranslations();
  const navItems = buildAiWriteHeaderNav(header.nav?.items || []);
  const { rows: toolRows, total: toolTotal } = useWritingToolsMenu();
  const mobileDrawerItemClassName =
    "mx-5 flex items-center gap-3 rounded-[2px] px-5 py-3 font-semibold transition-colors hover:bg-accent hover:text-accent-foreground";

  // 移动端抽屉受控：路由变化后自动关闭,避免点击导航项跳转后抽屉仍残留
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  if (header.disabled) {
    return null;
  }

  return (
    <header className="sticky top-0 z-50 border-b border-border/70 bg-background/85 backdrop-blur-xl supports-[backdrop-filter]:bg-background/70">
      <div className="container py-4">
        <nav className="hidden justify-between xl:flex">
          <div className="flex items-center gap-4">
            <Link
              href={(header.brand?.url as any) || "/"}
              className="flex shrink-0 items-center gap-2"
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
                <span className="truncate whitespace-nowrap font-display text-[1.05rem] tracking-[-0.03em] text-foreground">
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
                          <NavigationMenuTrigger className="text-[12px] uppercase tracking-[0.08em] text-muted-foreground">
                            {item.icon && (
                              <Icon
                                name={item.icon}
                                className="mr-2 hidden size-4 shrink-0"
                              />
                            )}
                            <span>{item.title}</span>
                          </NavigationMenuTrigger>
                          <NavigationMenuContent>
                            <ToolsMegaMenu
                              rows={toolRows}
                              total={toolTotal}
                              hubHref={AI_WRITE_TOOL_HUB_URL}
                            />
                          </NavigationMenuContent>
                        </NavigationMenuItem>
                      );
                    }

                    return (
                      <NavigationMenuItem key={i}>
                        <Link
                          className={cn(
                            "text-[12px] uppercase tracking-[0.08em] text-muted-foreground",
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
                              className="hidden size-4 shrink-0"
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
                        "text-[12px] uppercase tracking-[0.08em] text-muted-foreground",
                        navigationMenuTriggerStyle,
                        buttonVariants({
                          variant: "ghost",
                        })
                      )}
                      href={"/community" as any}
                    >
                      <Icon name="RiCommunityLine" className="hidden size-4 shrink-0" />
                      {t("community.title")}
                    </Link>
                  </NavigationMenuItem>
                  <NavigationMenuItem>
                    <Link
                      className={cn(
                        "text-[12px] uppercase tracking-[0.08em] text-muted-foreground",
                        navigationMenuTriggerStyle,
                        buttonVariants({
                          variant: "ghost",
                        })
                      )}
                      href={"/ai-tools" as any}
                    >
                      <Icon name="RiToolsLine" className="hidden size-4 shrink-0" />
                      {t("ai_tools.tools_hub_nav")}
                    </Link>
                  </NavigationMenuItem>
                  <NavigationMenuItem>
                    <Link
                      className={cn(
                        "text-[12px] uppercase tracking-[0.08em] text-muted-foreground",
                        navigationMenuTriggerStyle,
                        buttonVariants({
                          variant: "ghost",
                        })
                      )}
                      href={"/pricing" as any}
                    >
                      <Icon name="RiPriceTag3Line" className="hidden size-4 shrink-0" />
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

        <div className="block xl:hidden">
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
                <span className="truncate whitespace-nowrap font-display text-[1.05rem] tracking-[-0.03em] text-foreground">
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
                        <span className="truncate whitespace-nowrap font-display text-[1.05rem] tracking-[-0.03em] text-foreground">
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
                              <ToolsMobileMenu
                                rows={toolRows}
                                total={toolTotal}
                                hubHref={AI_WRITE_TOOL_HUB_URL}
                              />
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
