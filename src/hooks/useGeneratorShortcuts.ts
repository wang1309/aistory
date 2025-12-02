import { useEffect } from "react";

interface GeneratorShortcutsOptions {
  onGenerate?: () => void;
  onFocusInput?: () => void;
  onQuickSave?: () => void;
  enabled?: boolean;
}

export function useGeneratorShortcuts(options: GeneratorShortcutsOptions) {
  const { onGenerate, onFocusInput, onQuickSave, enabled = true } = options;

  useEffect(() => {
    if (!enabled) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      // Only respond to Cmd/Ctrl combinations
      if (!event.metaKey && !event.ctrlKey) return;

      const key = event.key;

      if (key === "Enter") {
        if (!onGenerate) return;
        event.preventDefault();
        onGenerate();
        return;
      }

      if ((key === "s" || key === "S") && onQuickSave) {
        event.preventDefault();
        onQuickSave();
        return;
      }

      if ((key === "f" || key === "F") && onFocusInput) {
        event.preventDefault();
        onFocusInput();
        return;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [enabled, onGenerate, onFocusInput, onQuickSave]);
}
