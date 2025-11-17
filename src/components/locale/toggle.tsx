"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select";
import { useRouter } from "@/i18n/navigation";
import { useLocale } from "next-intl";
import { MdLanguage } from "react-icons/md";
import { localeNames, localeFlags } from "@/i18n/locale";

export default function LocaleToggle({ isIcon = false }: { isIcon?: boolean }) {
  const router = useRouter();
  const currentLocale = useLocale();

  const handleSwitchLanguage = (newLocale: string) => {
    if (newLocale !== currentLocale) {
      router.replace("/", { locale: newLocale });
    }
  };

  return (
    <Select
      value={currentLocale}
      onValueChange={handleSwitchLanguage}
    >
      <SelectTrigger className="flex items-center gap-2 border-none text-muted-foreground outline-hidden hover:bg-transparent focus:ring-0 focus:ring-offset-0">
        <span className="text-xl">{localeFlags[currentLocale] || '🌐'}</span>
        {!isIcon && (
          <span className="hidden md:block">{localeNames[currentLocale] || 'Language'}</span>
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
