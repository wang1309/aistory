"use client";

import { useLocale } from "next-intl";
import { cn } from "@/lib/utils";

interface GeneratorShortcutHintsProps {
  showQuickSave?: boolean;
  className?: string;
}

export function GeneratorShortcutHints({ showQuickSave = false, className }: GeneratorShortcutHintsProps) {
  const locale = useLocale();
  const isZh = locale === "zh" || locale.startsWith("zh-");

  const containerClass = cn(
    "mt-3 flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-xs text-muted-foreground/70 text-center",
    className,
  );

  const prefix = isZh ? "快捷键：" : "Shortcuts:";
  const generate = isZh ? "生成" : "Generate";
  const focus = isZh ? "聚焦输入框" : "Focus input";
  const quickSave = isZh ? "快速保存" : "Quick save";

  return (
    <div className={containerClass}>
      <span className="font-semibold">{prefix}</span>
      <span>
        {generate} ⌘⏎ / Ctrl⏎
      </span>
      <span>
        · {focus} ⌘F / CtrlF
      </span>
      {showQuickSave && (
        <span>
          · {quickSave} ⌘S / CtrlS
        </span>
      )}
    </div>
  );
}
