"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select";
import { useParams } from "next/navigation";
import { usePathname, useRouter } from "@/i18n/navigation";

import { MdLanguage } from "react-icons/md";
import { localeNames, localeFlags, locales } from "@/i18n/locale";

export default function ({ isIcon = false }: { isIcon?: boolean }) {
  const params = useParams();
  const locale = params.locale as string;
  const router = useRouter();
  const pathname = usePathname();

  const handleSwitchLanguage = (value: string) => {
    if (value !== locale) {
      // Extract the path without the current locale prefix
      let pathWithoutLocale = pathname;

      // Remove the locale prefix from the pathname if it exists
      const localePattern = new RegExp(`^/(${locales.join('|')})`);
      pathWithoutLocale = pathname.replace(localePattern, '');

      // Ensure the path starts with a slash
      if (!pathWithoutLocale.startsWith('/')) {
        pathWithoutLocale = '/' + pathWithoutLocale;
      }

      // Use i18n-aware router with the clean path
      router.replace(pathWithoutLocale, { locale: value });
    }
  };

  return (
    <Select value={locale} onValueChange={handleSwitchLanguage}>
      <SelectTrigger className="flex items-center gap-2 border-none text-muted-foreground outline-hidden hover:bg-transparent focus:ring-0 focus:ring-offset-0">
        <span className="text-xl">{localeFlags[locale]}</span>
        {!isIcon && (
          <span className="hidden md:block">{localeNames[locale]}</span>
        )}
      </SelectTrigger>
      <SelectContent className="z-50 bg-background">
        {Object.keys(localeNames).map((key: string) => {
          const name = localeNames[key];
          const flag = localeFlags[key];
          return (
            <SelectItem className="cursor-pointer px-4" key={key} value={key}>
              <span className="flex items-center gap-2">
                <span className="text-base">{flag}</span>
                <span>{name}</span>
              </span>
            </SelectItem>
          );
        })}
      </SelectContent>
    </Select>
  );
}
