"use client";

import { useState, useCallback, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import Icon from "@/components/icon";
import { toast } from "sonner";
import { HeroBooktitle as HeroBooktitleType } from "@/types/blocks/hero-booktitle";
import { useLocale } from "next-intl";
import BookTitleBreadcrumb from "./breadcrumb";
import { useAppContext } from "@/contexts/app";

// ========== INTERFACES ==========

interface GeneratedTitle {
  id: string;
  title: string;
  copied: boolean;
}

interface SavedTitleHistory {
  id: string;
  titles: string[];
  description: string;
  genre: string;
  tone: string;
  style: string;
  timestamp: number;
}

// ========== HELPER FUNCTIONS ==========

// LocalStorage helper for title history
class TitleHistoryStorage {
  private static readonly STORAGE_KEY = "book_title_history";
  private static readonly MAX_HISTORY_ITEMS = 10;

  static saveHistory(item: Omit<SavedTitleHistory, "id" | "timestamp">): void {
    try {
      const history = this.getHistory();
      const newItem: SavedTitleHistory = {
        ...item,
        id: Date.now().toString(),
        timestamp: Date.now(),
      };

      history.unshift(newItem);
      const trimmedHistory = history.slice(0, this.MAX_HISTORY_ITEMS);
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(trimmedHistory));
    } catch (error) {
      console.error("Failed to save title history:", error);
    }
  }

  static getHistory(): SavedTitleHistory[] {
    try {
      const data = localStorage.getItem(this.STORAGE_KEY);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error("Failed to get title history:", error);
      return [];
    }
  }

  static clearHistory(): void {
    try {
      localStorage.removeItem(this.STORAGE_KEY);
    } catch (error) {
      console.error("Failed to clear title history:", error);
    }
  }
}

// ========== COMPONENT ==========

export default function HeroBooktitle({ section }: { section: HeroBooktitleType }) {
  const locale = useLocale();
  const { setShowVerificationModal, setVerificationCallback } = useAppContext();

  // Form state
  const [description, setDescription] = useState("");
  const [selectedGenre, setSelectedGenre] = useState("none");
  const [selectedTone, setSelectedTone] = useState("none");
  const [selectedStyle, setSelectedStyle] = useState("none");

  // Generation state
  const [generatedTitles, setGeneratedTitles] = useState<GeneratedTitle[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);

  // Validation
  const validateForm = useCallback((): boolean => {
    if (!description.trim()) {
      toast.error(section.toasts.error_no_description);
      return false;
    }

    if (description.trim().length < 10) {
      toast.error(section.toasts.error_description_too_short);
      return false;
    }

    return true;
  }, [description, section]);

  // Handle verification success - start title generation
  const handleVerificationSuccess = useCallback(async (turnstileToken: string) => {
    console.log("=== Starting title generation after verification ===");
    console.log("Description:", description.substring(0, 100));
    console.log("Genre:", selectedGenre);
    console.log("Tone:", selectedTone);
    console.log("Style:", selectedStyle);
    console.log("Turnstile token:", `Present (${turnstileToken.length} chars)`);

    try {
      setIsGenerating(true);
      setGeneratedTitles([]);

      const requestBody = {
        description: description.trim(),
        genre: selectedGenre,
        tone: selectedTone,
        style: selectedStyle !== "none" ? selectedStyle : undefined,
        locale,
        turnstileToken: turnstileToken,
      };

      console.log("=== Request body to API ===", JSON.stringify(requestBody, null, 2));

      const response = await fetch("/api/book-title-generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      });

      console.log("=== Response status ===", response.status, response.statusText);
      console.log("=== Response headers ===", Object.fromEntries(response.headers.entries()));

      if (!response.ok) {
        console.log("=== Response not OK ===");
        const errorData = await response.json();
        console.log("Error data:", errorData);
        toast.error(errorData.message || section.toasts.error_generate_failed);
        return;
      }

      console.log("=== Starting to read stream ===");

      // Handle streaming response
      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (!reader) {
        console.log("=== No reader available ===");
        toast.error(section.toasts.error_generate_failed);
        return;
      }

      let accumulatedText = "";
      let chunkCount = 0;
      let buffer = ""; // Buffer for incomplete lines
      let tempTitles: string[] = [];

      while (true) {
        const { done, value } = await reader.read();

        if (done) {
          console.log(`=== Stream finished, total chunks: ${chunkCount} ===`);
          break;
        }

        chunkCount++;

        // Decode the chunk
        const chunk = decoder.decode(value, { stream: true });
        console.log(`=== Frontend chunk ${chunkCount} ===`, chunk.substring(0, 100));

        // Add to buffer
        buffer += chunk;

        // Split by newlines but keep the last incomplete line in buffer
        const lines = buffer.split("\n");
        buffer = lines.pop() || ""; // Keep last incomplete line

        for (const line of lines) {
          if (line.startsWith("0:")) {
            // Extract the text content from the data stream
            try {
              const jsonStr = line.slice(2); // Remove "0:" prefix
              console.log("=== Parsing line ===", jsonStr.substring(0, 50));
              const parsed = JSON.parse(jsonStr);

              if (typeof parsed === "string") {
                accumulatedText += parsed;
                console.log("=== Accumulated text length ===", accumulatedText.length);

                // Split by newlines to get individual titles
                const lines = accumulatedText.split("\n").filter(l => l.trim().length > 0);

                // Create title objects for display
                const newTitles: GeneratedTitle[] = lines.map((title, index) => ({
                  id: `title-${Date.now()}-${index}`,
                  title: title.trim(),
                  copied: false,
                }));

                // Update display in real-time
                setGeneratedTitles(newTitles);
              }
            } catch (e) {
              // Skip invalid JSON lines
              console.log("JSON Parse error:", e, "Line:", line.substring(0, 100));
            }
          }
        }
      }

      console.log("=== Final accumulated text length ===", accumulatedText.length);

      if (accumulatedText.trim()) {
        // Final processing: extract clean titles
        const finalTitles = accumulatedText
          .split("\n")
          .map(line => line.trim())
          .filter(line => line.length > 0)
          .filter(line => !line.match(/^\d+[\.\)]/)) // Remove numbered lines
          .map(line => line.replace(/^[-•*]\s*/, "")) // Remove bullet points
          .map(line => line.replace(/^["']|["']$/g, "")) // Remove quotes
          .slice(0, 8); // Ensure we only have 8 titles

        const titlesForDisplay: GeneratedTitle[] = finalTitles.map((title, index) => ({
          id: `title-final-${Date.now()}-${index}`,
          title,
          copied: false,
        }));

        setGeneratedTitles(titlesForDisplay);
        toast.success(section.toasts.success_generated);

        // Save to history
        TitleHistoryStorage.saveHistory({
          titles: finalTitles,
          description: description.trim(),
          genre: selectedGenre,
          tone: selectedTone,
          style: selectedStyle,
        });
      } else {
        console.log("=== No titles were generated ===");
        toast.error(section.toasts.error_generate_failed);
      }
    } catch (error) {
      console.error("Title generation failed:", error);
      toast.error(section.toasts.error_generate_failed);
    } finally {
      setIsGenerating(false);
    }
  }, [description, selectedGenre, selectedTone, selectedStyle, locale, section]);

  // Generate titles handler - trigger verification modal
  const handleGenerate = useCallback(async () => {
    if (!validateForm()) return;

    // Set verification callback and show modal
    setVerificationCallback(() => handleVerificationSuccess);
    setShowVerificationModal(true);
  }, [validateForm, setShowVerificationModal, setVerificationCallback, handleVerificationSuccess]);

  // Copy title to clipboard
  const handleCopyTitle = useCallback(async (titleId: string, titleText: string) => {
    try {
      await navigator.clipboard.writeText(titleText);

      // Update copied state
      setGeneratedTitles(prev =>
        prev.map(t => ({
          ...t,
          copied: t.id === titleId ? true : t.copied
        }))
      );

      toast.success(section.toasts.success_copied);

      // Reset copied state after 2 seconds
      setTimeout(() => {
        setGeneratedTitles(prev =>
          prev.map(t => ({
            ...t,
            copied: t.id === titleId ? false : t.copied
          }))
        );
      }, 2000);
    } catch (error) {
      console.error("Failed to copy title:", error);
      toast.error("Failed to copy title");
    }
  }, [section]);

  // Clear all titles
  const handleClearTitles = useCallback(() => {
    setGeneratedTitles([]);
  }, []);

  // Character count for description
  const descriptionLength = useMemo(() => description.length, [description]);

  return (
    <section className="relative py-16 sm:py-20 overflow-hidden">
      <div className="container">
        <div className="mx-auto w-full max-w-5xl">
          {/* Breadcrumb Navigation */}
          <div className="mb-6">
            <BookTitleBreadcrumb
              homeText={section.breadcrumb.home}
              currentText={section.breadcrumb.current}
            />
          </div>

          {/* Enhanced Header */}
          <div className="relative text-center mb-12 motion-safe:animate-in motion-safe:fade-in-0 motion-safe:duration-500">
            {/* Background ambient glow */}
            <div className="absolute -inset-x-20 -inset-y-8 bg-gradient-to-b from-primary/5 via-accent/5 to-transparent blur-2xl -z-10" />

            {/* Icon with shimmer */}
            <div className="relative inline-flex items-center justify-center mb-4 group">
              <div className="absolute inset-0 bg-gradient-to-r from-primary/20 via-primary/30 to-primary/20 blur-2xl opacity-75 group-hover:opacity-100 transition-opacity duration-500 scale-150" />
              <div className="relative rounded-2xl bg-gradient-to-br from-primary/10 to-accent/10 p-4 ring-1 ring-primary/20">
                <Icon name="RiBookOpenLine" className="size-8 text-primary drop-shadow-lg" />
              </div>
            </div>

            {/* Main headline */}
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight mb-3">
              <span className="bg-gradient-to-r from-foreground via-foreground/90 to-foreground/80 bg-clip-text text-transparent">
                {section.header.title}
              </span>
            </h1>

            {/* Subtitle with sparkle */}
            <p className="text-lg text-muted-foreground/80 max-w-2xl mx-auto flex items-center justify-center gap-2">
              <span className="animate-pulse"></span>
              {section.header.subtitle}
            </p>
          </div>

          {/* Main Form Card */}
          <div className="relative mb-8">
            <div className="relative group">
              {/* Glow effect */}
              <div className="absolute -inset-1 bg-gradient-to-r from-primary/20 via-accent/20 to-primary/20 rounded-3xl blur-lg opacity-50 group-hover:opacity-75 transition-opacity duration-500" />

              {/* Glassmorphic container */}
              <div className="relative rounded-2xl lg:rounded-3xl border-2 border-border/50 bg-gradient-to-br from-background/80 to-background/40 backdrop-blur-xl shadow-2xl p-6 lg:p-8">
                <div className="space-y-6">
                  {/* Description Field */}
                  <div>
                    <label className="text-sm font-semibold text-foreground/90 flex items-center gap-2 mb-3">
                      <Icon name="RiQuillPenLine" className="size-4 text-primary" />
                      {section.form.description.label}
                      <span className="ml-1 text-xs text-destructive font-normal">{section.form.description.required}</span>
                    </label>

                    <div className="relative">
                      <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-primary/5 to-accent/5 opacity-0 focus-within:opacity-100 transition-opacity duration-300 pointer-events-none" />

                      <Textarea
                        value={description}
                        onChange={(e) => setDescription(e.target.value.slice(0, section.form.description.max_length))}
                        placeholder={section.form.description.placeholder}
                        className="min-h-[120px] resize-y rounded-xl bg-background/90 border-border/50 focus:border-primary/50 focus:ring-2 focus:ring-primary/20 placeholder:text-muted-foreground/50 text-base leading-[1.65]"
                      />

                      {/* Character counter */}
                      <div className="absolute bottom-3 right-3 text-xs text-muted-foreground/60">
                        {section.form.description.character_counter.replace("{count}", descriptionLength.toString())}
                      </div>
                    </div>

                    <p className="mt-2 text-xs text-muted-foreground">{section.form.description.helper_text}</p>
                  </div>

                  {/* Genre and Tone Row */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Genre */}
                    <div>
                      <label className="text-sm font-semibold text-foreground/90 flex items-center gap-2 mb-3">
                        <Icon name="RiBookmarkLine" className="size-4 text-primary" />
                        {section.form.genre.label}
                        <span className="ml-1 text-xs text-muted-foreground font-normal">(Optional)</span>
                      </label>

                      <Select value={selectedGenre} onValueChange={setSelectedGenre}>
                        <SelectTrigger className="h-11 rounded-xl bg-background/90 border-border/50 hover:border-primary/50 focus:border-primary/50 focus:ring-2 focus:ring-primary/20">
                          <SelectValue placeholder={section.form.genre.placeholder} />
                        </SelectTrigger>
                        <SelectContent className="rounded-xl bg-background border-border/50 shadow-lg max-h-[300px]">
                          {Object.entries(section.form.genre.options).map(([key, value]) => (
                            <SelectItem key={key} value={key} className="py-2.5 px-3 hover:bg-primary/5 focus:bg-primary/10 rounded-lg">
                              {value}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Tone */}
                    <div>
                      <label className="text-sm font-semibold text-foreground/90 flex items-center gap-2 mb-3">
                        <Icon name="RiPaletteLine" className="size-4 text-primary" />
                        {section.form.tone.label}
                        <span className="ml-1 text-xs text-muted-foreground font-normal">(Optional)</span>
                      </label>

                      <Select value={selectedTone} onValueChange={setSelectedTone}>
                        <SelectTrigger className="h-11 rounded-xl bg-background/90 border-border/50 hover:border-primary/50 focus:border-primary/50 focus:ring-2 focus:ring-primary/20">
                          <SelectValue placeholder={section.form.tone.placeholder} />
                        </SelectTrigger>
                        <SelectContent className="rounded-xl bg-background border-border/50 shadow-lg max-h-[300px]">
                          {Object.entries(section.form.tone.options).map(([key, value]) => (
                            <SelectItem key={key} value={key} className="py-2.5 px-3 hover:bg-primary/5 focus:bg-primary/10 rounded-lg">
                              {value}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Style (Optional) */}
                  <div>
                    <label className="text-sm font-semibold text-foreground/90 flex items-center gap-2 mb-3">
                      <Icon name="RiMagicLine" className="size-4 text-primary" />
                      {section.form.style.label}
                      <span className="ml-1 text-xs text-muted-foreground font-normal">(Optional)</span>
                    </label>

                    <Select value={selectedStyle} onValueChange={setSelectedStyle}>
                      <SelectTrigger className="h-11 rounded-xl bg-background/90 border-border/50 hover:border-primary/50 focus:border-primary/50 focus:ring-2 focus:ring-primary/20">
                        <SelectValue placeholder={section.form.style.placeholder} />
                      </SelectTrigger>
                      <SelectContent className="rounded-xl bg-background border-border/50 shadow-lg">
                        {Object.entries(section.form.style.options).map(([key, value]) => (
                          <SelectItem key={key} value={key} className="py-2.5 px-3 hover:bg-primary/5 focus:bg-primary/10 rounded-lg">
                            {value}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Generate Button */}
                  <div className="pt-2">
                    <Button
                      onClick={handleGenerate}
                      disabled={isGenerating}
                      className="w-full h-14 rounded-full bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary text-primary-foreground text-base font-bold shadow-lg hover:shadow-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isGenerating ? (
                        <>
                          <Icon name="RiLoader4Line" className="size-5 mr-2 animate-spin" />
                          {section.generate_button.generating}
                        </>
                      ) : (
                        <>
                          <Icon name="RiSparklingLine" className="size-5 mr-2" />
                          {section.generate_button.text}
                        </>
                      )}
                    </Button>

                    <div className="mt-3 flex items-center justify-center gap-4 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Icon name="RiCheckLine" className="size-3.5 text-green-500" />
                        {section.generate_button.info.free}
                      </span>
                      <span className="flex items-center gap-1">
                        <Icon name="RiTimeLine" className="size-3.5" />
                        {section.generate_button.info.time}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Generated Titles Output */}
          {(generatedTitles.length > 0 || isGenerating) && (
            <div className="relative">
              <div className="relative group">
                <div className="absolute -inset-1 bg-gradient-to-r from-accent/20 via-primary/20 to-accent/20 rounded-3xl blur-lg opacity-50" />

                <div className="relative rounded-2xl lg:rounded-3xl border-2 border-border/50 bg-gradient-to-br from-background/90 to-background/60 backdrop-blur-xl shadow-2xl p-6 lg:p-8">
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h3 className="text-xl font-bold text-foreground flex items-center gap-2">
                        <Icon name="RiStarLine" className="size-5 text-accent" />
                        {section.output.title}
                      </h3>
                      <p className="text-sm text-muted-foreground mt-1">{section.output.subtitle}</p>
                    </div>
                    {generatedTitles.length > 0 && (
                      <Button
                        onClick={handleClearTitles}
                        variant="ghost"
                        size="sm"
                        className="text-xs text-muted-foreground hover:text-destructive"
                      >
                        <Icon name="RiCloseLine" className="size-4 mr-1" />
                        {section.output.clear_button}
                      </Button>
                    )}
                  </div>

                  {isGenerating ? (
                    <div className="flex flex-col items-center justify-center py-12">
                      <Icon name="RiLoader4Line" className="size-12 text-primary animate-spin mb-4" />
                      <p className="text-sm text-muted-foreground">{section.output.loading}</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 gap-3">
                      {generatedTitles.map((titleObj, index) => (
                        <div
                          key={titleObj.id}
                          className="group relative p-4 rounded-xl bg-background/80 border border-border/50 hover:border-primary/30 hover:bg-background/95 transition-all duration-200 hover:shadow-md"
                        >
                          <div className="flex items-start gap-3">
                            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-semibold text-primary">
                              {index + 1}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-base font-medium text-foreground leading-relaxed">
                                {titleObj.title}
                              </p>
                            </div>
                            <Button
                              onClick={() => handleCopyTitle(titleObj.id, titleObj.title)}
                              variant="ghost"
                              size="sm"
                              className="flex-shrink-0 h-8 px-3 text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              {titleObj.copied ? (
                                <>
                                  <Icon name="RiCheckLine" className="size-4 mr-1 text-green-500" />
                                  {section.output.copied_button}
                                </>
                              ) : (
                                <>
                                  <Icon name="RiFileCopyLine" className="size-4 mr-1" />
                                  {section.output.copy_button}
                                </>
                              )}
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {generatedTitles.length > 0 && (
                    <div className="mt-6 pt-4 border-t border-border/30 text-center">
                      <p className="text-xs text-muted-foreground">
                        {section.output.title_count.replace("{count}", generatedTitles.length.toString())}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
