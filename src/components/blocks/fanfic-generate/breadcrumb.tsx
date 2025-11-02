"use client";

import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Link } from "@/i18n/navigation";
import { useLocale } from "next-intl";

interface FanficBreadcrumbProps {
  homeText: string;
  currentText: string;
}

export default function FanficBreadcrumb({ homeText, currentText }: FanficBreadcrumbProps) {
  const locale = useLocale();

  // Build home URL based on locale
  const homeUrl = locale === "en" ? "/" : `/${locale}`;

  return (
    <Breadcrumb>
      <BreadcrumbList>
        <BreadcrumbItem>
          <BreadcrumbLink asChild>
            <Link href={homeUrl as any}>
              {homeText}
            </Link>
          </BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbSeparator />
        <BreadcrumbItem>
          <BreadcrumbPage>{currentText}</BreadcrumbPage>
        </BreadcrumbItem>
      </BreadcrumbList>
    </Breadcrumb>
  );
}
