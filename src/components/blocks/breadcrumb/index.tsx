"use client";

import { House } from "lucide-react";

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils";

interface PageBreadcrumbProps {
  homeText: string;
  currentText: string;
  hubText?: string;
  hubHref?: string;
  className?: string;
}

/**
 * Public-page breadcrumb: house icon + Home, chevron, optional hub, copper dot,
 * then the current page in semibold. Deliberately chrome-free so it reads as
 * part of the page rather than a floating pill.
 */
export default function PageBreadcrumb({
  homeText,
  currentText,
  hubText,
  hubHref = "/ai-tools",
  className,
}: PageBreadcrumbProps) {
  return (
    <Breadcrumb className={cn("min-w-0", className)}>
      <BreadcrumbList className="gap-2 text-[13px] sm:gap-2.5 sm:text-sm">
        <BreadcrumbItem className="shrink-0">
          <BreadcrumbLink asChild>
            <Link
              href="/"
              aria-label={homeText}
              className="group inline-flex items-center gap-2 font-medium text-muted-foreground"
            >
              <House
                aria-hidden="true"
                className="size-[17px] shrink-0 text-muted-foreground/80 transition-colors duration-200 group-hover:text-accent-copper"
                strokeWidth={1.6}
              />
              <span>{homeText}</span>
            </Link>
          </BreadcrumbLink>
        </BreadcrumbItem>

        {hubText ? (
          <>
            <BreadcrumbSeparator className="hidden shrink-0 sm:block" />
            <BreadcrumbItem className="hidden min-w-0 shrink sm:inline-flex">
              <BreadcrumbLink asChild>
                <Link href={hubHref} className="truncate font-medium text-muted-foreground">
                  {hubText}
                </Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
          </>
        ) : null}

        <BreadcrumbSeparator className="shrink-0" />
        <BreadcrumbItem className="min-w-0">
          <BreadcrumbPage className="min-w-0">
            <span className="block min-w-0 truncate">{currentText}</span>
          </BreadcrumbPage>
        </BreadcrumbItem>
      </BreadcrumbList>
    </Breadcrumb>
  );
}
