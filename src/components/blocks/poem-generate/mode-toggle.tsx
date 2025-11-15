"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import Icon from "@/components/icon";

interface ModeToggleProps {
  advancedMode: boolean;
  onToggle: (advanced: boolean) => void;
  labels: {
    simple: string;
    advanced: string;
    toggle_hint: string;
    simple_description: string;
    advanced_description: string;
    keyboard_shortcut: string;
    toggle_shortcut: string;
  };
}

export function ModeToggle({ advancedMode, onToggle, labels }: ModeToggleProps) {
  const [showTooltip, setShowTooltip] = useState(false);

  // Keyboard shortcut (Cmd+K or Ctrl+K)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        onToggle(!advancedMode);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [advancedMode, onToggle]);

  const targetMode = advancedMode ? labels.simple : labels.advanced;
  const currentDescription = advancedMode ? labels.advanced_description : labels.simple_description;

  return (
    <div className="relative">
      <Button
        variant="outline"
        size="sm"
        onClick={() => onToggle(!advancedMode)}
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
        className="gap-2 transition-all hover:scale-105"
      >
        <Icon
          name={advancedMode ? "Settings" : "Sparkles"}
          className="w-4 h-4"
        />
        <span className="hidden sm:inline">
          {advancedMode ? labels.advanced : labels.simple}
        </span>
        <span className="text-xs text-muted-foreground hidden md:inline">
          {labels.keyboard_shortcut}
        </span>
      </Button>

      {/* Tooltip */}
      {showTooltip && (
        <div className="absolute z-50 top-full mt-2 right-0 w-64 p-3 bg-popover text-popover-foreground rounded-lg shadow-lg border animate-in fade-in-0 zoom-in-95">
          <div className="text-sm font-medium mb-1">
            {labels.toggle_hint.replace('{mode}', targetMode)}
          </div>
          <div className="text-xs text-muted-foreground">
            {currentDescription}
          </div>
          <div className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
            <kbd className="px-1.5 py-0.5 text-xs font-mono bg-muted rounded">
              {labels.keyboard_shortcut}
            </kbd>
            <span>{labels.toggle_shortcut}</span>
          </div>
        </div>
      )}
    </div>
  );
}
