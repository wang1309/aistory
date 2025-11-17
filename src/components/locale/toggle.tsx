"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select";
import { useLanguage } from "@/contexts/language-context";

import { MdLanguage } from "react-icons/md";
import { localeNames, localeFlags } from "@/i18n/locale";

export default function ({ isIcon = false }: { isIcon?: boolean }) {
  const { currentLocale, isChanging, isInitialized, changeLanguage } = useLanguage();

  // Show loading state while initializing to prevent flash
  if (!isInitialized) {
    return (
      <div className="flex items-center gap-2 border-none text-muted-foreground outline-hidden opacity-50">
        <span className="text-xl">🌐</span>
        {!isIcon && (
          <span className="hidden md:block">Loading...</span>
        )}
      </div>
    );
  }

  const handleSwitchLanguage = (value: string) => {
    if (value !== currentLocale && !isChanging) {
      changeLanguage(value);
    }
  };

  return (
    <Select
      value={currentLocale}
      onValueChange={handleSwitchLanguage}
      disabled={isChanging}
    >
      <SelectTrigger className="flex items-center gap-2 border-none text-muted-foreground outline-hidden hover:bg-transparent focus:ring-0 focus:ring-offset-0 disabled:opacity-50">
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
