"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useLocale } from "next-intl";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Sparkles } from "lucide-react";
import TurnstileInvisible, {
  TurnstileInvisibleHandle,
} from "@/components/TurnstileInvisible";
import { LANGUAGE_OPTIONS } from "@/lib/language-options";
import type { GenreStoryKind } from "@/lib/genre-story-generators";
import type { GenreStoryTitleTool } from "@/types/blocks/genre-story-generate";

function parseProtocolLine(line: string): string | null {
  const trimmed = line.trim();
  if (!trimmed.startsWith("0:")) return null;
  try {
    const parsed = JSON.parse(trimmed.slice(2));
    return typeof parsed === "string" ? parsed : null;
  } catch {
    return null;
  }
}

function cleanTitles(text: string): string[] {
  return text
    .split(/\r?\n/)
    .map((line) =>
      line
        .trim()
        .replace(/^\d+[.)]\s*/, "")
        .replace(/^["“']|["”']$/g, "")
        .trim()
    )
    .filter(Boolean)
    .slice(0, 5);
}

export default function GenreStoryTitleGenerator({
  genre,
  section,
}: {
  genre: GenreStoryKind;
  section: GenreStoryTitleTool;
}) {
  const locale = useLocale();
  const [description, setDescription] = useState("");
  const [selectedLanguage, setSelectedLanguage] = useState(() =>
    LANGUAGE_OPTIONS.some((option) => option.code === locale) ? locale : "en"
  );
  const [titles, setTitles] = useState<string[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const turnstileRef = useRef<TurnstileInvisibleHandle>(null);
  const turnstileTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (turnstileTimeoutRef.current) {
        clearTimeout(turnstileTimeoutRef.current);
        turnstileTimeoutRef.current = null;
      }
    };
  }, []);

  const runGeneration = useCallback(
    async (turnstileToken: string) => {
      if (turnstileTimeoutRef.current) {
        clearTimeout(turnstileTimeoutRef.current);
        turnstileTimeoutRef.current = null;
      }
      setIsGenerating(true);
      setTitles([]);
      setErrorMessage("");

      try {
        const response = await fetch("/api/genre-story-title-generate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            genre,
            description: description.trim(),
            locale,
            outputLanguage: selectedLanguage,
            turnstileToken,
          }),
        });

        if (!response.ok) {
          const data = await response.json().catch(() => null);
          throw new Error(
            data && typeof data.message === "string"
              ? data.message
              : section.error
          );
        }

        const reader = response.body?.getReader();
        if (!reader) throw new Error(section.error);

        const decoder = new TextDecoder();
        let buffer = "";
        let accumulated = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() || "";
          for (const line of lines) {
            const content = parseProtocolLine(line);
            if (content !== null) accumulated += content;
          }
        }

        if (buffer) {
          const content = parseProtocolLine(buffer);
          if (content !== null) accumulated += content;
        }

        const nextTitles = cleanTitles(accumulated);
        if (!nextTitles.length) {
          throw new Error(section.error);
        }
        setTitles(nextTitles);
      } catch (error) {
        setErrorMessage(
          error instanceof Error ? error.message : section.error
        );
      } finally {
        setIsGenerating(false);
      }
    },
    [
      description,
      genre,
      locale,
      section.error,
      selectedLanguage,
    ]
  );

  const handleSubmit = useCallback(() => {
    if (description.trim().length < 10) {
      setErrorMessage(section.validation);
      return;
    }

    setErrorMessage("");
    if (!process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY) {
      setIsGenerating(true);
      void runGeneration("");
      return;
    }

    if (!turnstileRef.current) {
      setErrorMessage(section.error);
      return;
    }

    // Show the loading state immediately, before Turnstile finishes.
    setIsGenerating(true);
    if (turnstileTimeoutRef.current) {
      clearTimeout(turnstileTimeoutRef.current);
    }
    turnstileTimeoutRef.current = setTimeout(() => {
      turnstileTimeoutRef.current = null;
      setIsGenerating(false);
      setErrorMessage(section.error);
    }, 15000);

    try {
      turnstileRef.current.execute();
    } catch {
      if (turnstileTimeoutRef.current) {
        clearTimeout(turnstileTimeoutRef.current);
        turnstileTimeoutRef.current = null;
      }
      setIsGenerating(false);
      setErrorMessage(section.error);
    }
  }, [description, runGeneration, section.error, section.validation]);

  return (
    <div className="border border-border bg-card p-5 shadow-[6px_7px_0_rgba(36,77,61,0.05)] sm:p-6 dark:shadow-[6px_7px_0_rgba(0,0,0,0.4)]">
      <TurnstileInvisible
        ref={turnstileRef}
        onSuccess={runGeneration}
        onError={() => {
          if (turnstileTimeoutRef.current) {
            clearTimeout(turnstileTimeoutRef.current);
            turnstileTimeoutRef.current = null;
          }
          setIsGenerating(false);
          setErrorMessage(section.error);
        }}
      />

      <div className="grid gap-4 sm:grid-cols-[1fr_auto] sm:items-end">
        <div className="flex flex-col gap-2">
          <Label htmlFor="genre-title-premise" className="text-[12px] font-semibold">
            {section.label}
          </Label>
          <Input
            id="genre-title-premise"
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            placeholder={section.placeholder}
            maxLength={1200}
          />
        </div>
        <div className="flex flex-col gap-2">
          <Label className="text-[12px] font-semibold">
            {section.language_label}
          </Label>
          <Select
            value={selectedLanguage}
            onValueChange={setSelectedLanguage}
          >
            <SelectTrigger className="sm:w-[160px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {LANGUAGE_OPTIONS.map((option) => (
                <SelectItem key={option.code} value={option.code}>
                  {option.flag} {option.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <Button
          type="button"
          onClick={handleSubmit}
          disabled={isGenerating}
          className="gap-2"
        >
          <Sparkles className="size-4" />
          {isGenerating ? section.generating : section.button}
        </Button>
        <p className="text-[11px] leading-relaxed text-muted-foreground">
          {section.description}
        </p>
      </div>

      {errorMessage ? (
        <p className="mt-4 border border-destructive/30 bg-destructive/5 px-3 py-2 text-[12px] text-destructive">
          {errorMessage}
        </p>
      ) : null}

      {titles.length ? (
        <div className="mt-6">
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
            {section.result_title}
          </p>
          <ol className="mt-3 divide-y divide-border border-y border-border">
            {titles.map((title, index) => (
              <li
                key={`${title}-${index}`}
                className="flex items-start gap-3 py-3"
              >
                <span className="mt-0.5 font-display text-[12px] tracking-[0.1em] text-accent-copper">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <span className="font-serif text-[16px] leading-snug text-foreground">
                  {title}
                </span>
              </li>
            ))}
          </ol>
        </div>
      ) : (
        <p className="mt-4 text-[12px] text-muted-foreground">{section.empty}</p>
      )}
    </div>
  );
}
