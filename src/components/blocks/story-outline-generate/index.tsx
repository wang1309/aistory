"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useLocale } from "next-intl";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { motion, useReducedMotion } from "framer-motion";
import { Sparkles, Wand2, BookOpenText } from "lucide-react";
import GeneratorNavTabs from "@/components/generator-nav-tabs";
import TurnstileInvisible, {
  TurnstileInvisibleHandle,
} from "@/components/TurnstileInvisible";
import Icon from "@/components/icon";
import { cn } from "@/lib/utils";
import { useAppContext } from "@/contexts/app";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import StoryOutlineBreadcrumb from "./breadcrumb";
import type {
  GeneratedStoryOutline,
  StoryOutlineAudience,
  StoryOutlineChapterPlan,
  StoryOutlineGenre,
  StoryOutlineTargetLength,
  StoryOutlineTone,
} from "@/types/story-outline";
import type { StoryOutlineGenerateSection } from "@/types/blocks/story-outline-generate";

interface StoryOutlineGenerateProps {
  section?: StoryOutlineGenerateSection;
}

const EXPAND_COST = 5;

export default function StoryOutlineGenerate({ section }: StoryOutlineGenerateProps) {
  const locale = useLocale();
  const router = useRouter();
  const turnstileRef = useRef<TurnstileInvisibleHandle>(null);
  const { user, setShowSignModal, refreshUser } = useAppContext();
  const reduceMotion = useReducedMotion();
  const [sectionVisible, setSectionVisible] = useState(false);
  const sectionRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setSectionVisible(true);
          obs.disconnect();
        }
      },
      { threshold: 0.08 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  const tkEnter = (delayMs: number) =>
    `transition-all duration-[800ms] ease-[cubic-bezier(0.32,0.72,0,1)] [transition-delay:${delayMs}ms] ${
      sectionVisible ? "translate-y-0 opacity-100" : "translate-y-8 opacity-0"
    }`;

  const [storyIdea, setStoryIdea] = useState("");
  const [genre, setGenre] = useState<StoryOutlineGenre>("general");
  const [tone, setTone] = useState<StoryOutlineTone>("hopeful");
  const [targetLength, setTargetLength] =
    useState<StoryOutlineTargetLength>("novel");
  const [audience, setAudience] = useState<StoryOutlineAudience>("adult");
  const [outline, setOutline] = useState<GeneratedStoryOutline | null>(null);
  const [chapterPlan, setChapterPlan] = useState<StoryOutlineChapterPlan | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isExpanding, setIsExpanding] = useState(false);

  const t = useCallback(
    (path: string, fallback: string) => {
      const keys = path.split(".");
      let value: unknown = section;
      for (const key of keys) {
        value = (value as Record<string, unknown> | undefined)?.[key];
      }
      return typeof value === "string" && value.trim() ? value : fallback;
    },
    [section]
  );

  const randomPrompt = useMemo(() => {
    const prompts = section?.random_prompts ?? [];
    return prompts[Math.floor(Math.random() * prompts.length)] ?? "";
  }, [section?.random_prompts]);

  const runGenerate = useCallback(
    async (turnstileToken: string) => {
      try {
        const response = await fetch("/api/story-outline-generate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            turnstileToken,
            storyIdea,
            genre,
            tone,
            targetLength,
            audience,
            locale,
          }),
        });

        const data = await response.json();
        if (!response.ok || data?.code === -1 || !data?.outline) {
          throw new Error(data?.message || "request failed");
        }

        setOutline(data.outline);
        setChapterPlan(null);
        toast.success(t("success.generated", "Story outline generated."));
      } catch (error) {
        toast.error(t("errors.generate_failed", "Failed to generate story outline."));
      } finally {
        setIsGenerating(false);
      }
    },
    [audience, genre, locale, storyIdea, targetLength, tone, t]
  );

  const handleGenerate = useCallback(() => {
    if (!storyIdea.trim()) {
      toast.error(t("validation.story_idea_required", "Tell us your story idea first."));
      return;
    }

    setIsGenerating(true);
    turnstileRef.current?.execute();
  }, [storyIdea, t]);

  const handleExpand = useCallback(async () => {
    if (!outline) return;

    if (!user) {
      setShowSignModal(true);
      return;
    }

    if ((user?.credits?.left_credits || 0) < EXPAND_COST) {
      toast.error(t("ui.no_credits_title", "You need credits to expand this outline"));
      router.push(`/${locale}/pricing`);
      return;
    }

    setIsExpanding(true);
    try {
      const response = await fetch("/api/story-outline-expand", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ outline, chapterCount: 8, locale }),
      });

      const data = await response.json();
      if (!response.ok || data?.code === -1 || !data?.chapters?.length) {
        throw new Error(data?.message || "request failed");
      }

      setChapterPlan(data);
      await refreshUser?.();
      toast.success(t("success.expanded", "Chapter plan generated."));
    } catch (error) {
      toast.error(t("errors.expand_failed", "Failed to expand outline into chapters."));
    } finally {
      setIsExpanding(false);
    }
  }, [locale, outline, refreshUser, router, setShowSignModal, t, user]);

  return (
    <section
      ref={sectionRef}
      id="story_outline_generator"
      className="overflow-hidden py-16 text-foreground selection:bg-orange-500/20 lg:py-24"
    >
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_900px_400px_at_50%_0%,oklch(0.93_0.05_65),transparent)] dark:bg-[radial-gradient(ellipse_900px_400px_at_50%_0%,oklch(0.18_0.04_65),transparent)]" />
        <div className="absolute inset-x-0 top-0 h-[500px] bg-gradient-to-b from-orange-500/[0.04] via-orange-500/[0.02] to-transparent" />
        <div
          className="absolute inset-0 opacity-[0.04] dark:opacity-[0.05]"
          style={{ backgroundImage: "var(--bg-grid)", backgroundSize: "40px 40px" }}
        />
        {!reduceMotion && [
          { pos: "left-[6%] top-[8%]", size: "size-12", opacity: 0.5, dur: 11, delay: 0 },
          { pos: "right-[8%] top-[14%]", size: "size-10", opacity: 0.45, dur: 13, delay: 1.5 },
          { pos: "left-[12%] top-[44%]", size: "size-9", opacity: 0.4, dur: 12, delay: 2.8 },
          { pos: "right-[14%] top-[48%]", size: "size-11", opacity: 0.45, dur: 14, delay: 0.8 },
          { pos: "left-[24%] top-[4%]", size: "size-8", opacity: 0.35, dur: 10, delay: 3.5 },
        ].map((b, i) => (
          <motion.span
            key={`spark-${i}`}
            aria-hidden
            className={cn(
              "pointer-events-none absolute z-[1] hidden rounded-full bg-orange-500/15 dark:bg-orange-400/15 md:block",
              b.pos,
              b.size
            )}
            initial={{ opacity: 0, y: 0, scale: 0.8 }}
            animate={{
              opacity: [0, b.opacity, b.opacity, 0],
              y: [0, -10, 0],
              scale: [0.8, 1, 0.8],
            }}
            transition={{ duration: b.dur, delay: b.delay, repeat: Infinity, ease: "easeInOut" }}
          />
        ))}
      </div>

      <div className="container relative mx-auto px-4 md:px-6">
        <div className="mb-10">
          <div className="inline-flex items-center rounded-full border border-border/20 bg-background/80 px-4 py-1.5 text-xs text-muted-foreground">
            <StoryOutlineBreadcrumb
              homeText={t("ui.breadcrumb_home", "Home")}
              currentText={t("ui.breadcrumb_current", "Story Outline Generator")}
            />
          </div>
        </div>

        <div className="relative mx-auto mb-10 max-w-2xl text-center sm:mb-14">
          <div className={cn("relative z-10 mb-6 flex justify-center", tkEnter(0))}>
            <div className="group relative rounded-2xl border border-border/15 bg-foreground/[0.012] p-1.5 shadow-[inset_0_1px_1px_rgba(255,255,255,0.1)] dark:bg-white/[0.015]">
              <div className="relative flex size-12 items-center justify-center overflow-hidden rounded-xl bg-orange-500/10">
                {!reduceMotion && (
                  <motion.div
                    aria-hidden
                    className="absolute inset-0"
                    style={{
                      background:
                        "radial-gradient(circle at center, rgba(249,115,22,0.38), transparent 65%)",
                    }}
                    animate={{ opacity: [0.45, 0.9, 0.45], scale: [0.9, 1.06, 0.9] }}
                    transition={{
                      duration: 3.2,
                      repeat: Infinity,
                      ease: [0.32, 0.72, 0, 1],
                    }}
                  />
                )}
                <motion.div
                  className="relative"
                  animate={
                    reduceMotion
                      ? undefined
                      : { scale: [1, 1.07, 1], y: [0, -1.5, 0] }
                  }
                  transition={{
                    duration: 3.5,
                    repeat: Infinity,
                    ease: [0.32, 0.72, 0, 1],
                  }}
                >
                  <Icon
                    name="RiNodeTree"
                    className="size-6 text-orange-600 drop-shadow-[0_0_8px_rgba(249,115,22,0.5)] dark:text-orange-400"
                  />
                </motion.div>
              </div>
            </div>
          </div>

          <span
            className={cn(
              "relative z-10 mb-5 inline-flex items-center gap-2 rounded-full border border-border/25 bg-background/80 px-4 py-1.5 text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground",
              tkEnter(80)
            )}
          >
            <span className="inline-block size-1.5 rounded-full bg-orange-500 opacity-60" />
            {t("ui.eyebrow", "AI Story Tool")}
          </span>

          <h1
            className={cn(
              "relative z-10 mt-4 font-display text-[1.75rem] font-bold tracking-tight leading-[1.15] text-foreground sm:text-5xl lg:text-[3.25rem] lg:leading-[1.08]",
              tkEnter(160)
            )}
          >
            {(() => {
              const titleText = t("ui.title", "Story Outline Generator");
              const highlight = section?.ui?.title_highlight;
              if (!highlight || !titleText.includes(highlight)) {
                return titleText;
              }
              const idx = titleText.indexOf(highlight);
              return (
                <>
                  {titleText.slice(0, idx)}
                  <span className="bg-gradient-to-r from-orange-600 via-orange-500 to-orange-400 bg-clip-text text-transparent dark:from-orange-400 dark:via-orange-500 dark:to-orange-300">
                    {highlight}
                  </span>
                  {titleText.slice(idx + highlight.length)}
                </>
              );
            })()}
          </h1>

          <p
            className={cn(
              "relative z-10 mx-auto mt-5 max-w-xl text-base font-light leading-relaxed text-muted-foreground/65 sm:text-lg",
              tkEnter(240)
            )}
          >
            {t(
              "ui.subtitle",
              "Turn a vague story idea into a structured outline you can actually write, then expand it into chapters when you are ready."
            )}
          </p>

          {section?.ui?.theme_pills?.length ? (
            <div
              className={cn(
                "relative z-10 mt-7 flex flex-wrap items-center justify-center gap-2",
                tkEnter(320)
              )}
            >
              {section.ui.theme_pills.map((pill: string, i: number) => (
                <span
                  key={`${pill}-${i}`}
                  className="inline-flex items-center gap-1.5 rounded-full border border-orange-500/20 bg-orange-500/[0.04] px-3 py-1 text-xs font-medium text-orange-700 dark:text-orange-300"
                >
                  <span className="inline-block size-1 rounded-full bg-orange-500/60" />
                  {pill}
                </span>
              ))}
            </div>
          ) : null}
        </div>

        <GeneratorNavTabs />

        <div className="mx-auto mt-8 grid w-full max-w-6xl gap-6 pb-16 lg:grid-cols-[1.05fr_0.95fr] lg:items-start">
        <Card className="border-orange-500/20">
          <CardContent className="space-y-5 pt-6">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="story-idea">
                  {t("ui.story_idea_label", "What is your story idea?")}
                </Label>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => setStoryIdea(randomPrompt)}
                  className="h-9 gap-1.5 px-3 text-xs sm:h-8 sm:px-3"
                >
                  <Wand2 className="h-3.5 w-3.5" />
                  {t("ui.random_button", "Random")}
                </Button>
              </div>
              <Textarea
                id="story-idea"
                value={storyIdea}
                onChange={(event) => setStoryIdea(event.target.value)}
                placeholder={t(
                  "ui.story_idea_placeholder",
                  "e.g. A shy village healer discovers she can talk to ghosts."
                )}
                className="min-h-32"
              />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>{t("ui.genre_label", "Genre")}</Label>
                <Select value={genre} onValueChange={(value) => setGenre(value as StoryOutlineGenre)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="general">General</SelectItem>
                    <SelectItem value="fantasy">Fantasy</SelectItem>
                    <SelectItem value="romance">Romance</SelectItem>
                    <SelectItem value="thriller">Thriller</SelectItem>
                    <SelectItem value="sci-fi">Sci-Fi</SelectItem>
                    <SelectItem value="mystery">Mystery</SelectItem>
                    <SelectItem value="literary">Literary</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>{t("ui.tone_label", "Tone")}</Label>
                <Select value={tone} onValueChange={(value) => setTone(value as StoryOutlineTone)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="hopeful">Hopeful</SelectItem>
                    <SelectItem value="dark">Dark</SelectItem>
                    <SelectItem value="funny">Funny</SelectItem>
                    <SelectItem value="emotional">Emotional</SelectItem>
                    <SelectItem value="tense">Tense</SelectItem>
                    <SelectItem value="epic">Epic</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>{t("ui.target_length_label", "Target length")}</Label>
                <Select
                  value={targetLength}
                  onValueChange={(value) => setTargetLength(value as StoryOutlineTargetLength)}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="short-story">Short Story</SelectItem>
                    <SelectItem value="novella">Novella</SelectItem>
                    <SelectItem value="novel">Novel</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>{t("ui.audience_label", "Audience")}</Label>
                <Select value={audience} onValueChange={(value) => setAudience(value as StoryOutlineAudience)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="kids">Kids</SelectItem>
                    <SelectItem value="middle-grade">Middle Grade</SelectItem>
                    <SelectItem value="ya">Young Adult</SelectItem>
                    <SelectItem value="adult">Adult</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              <Button onClick={handleGenerate} disabled={isGenerating} className="w-full sm:w-auto">
                <Sparkles className="mr-2 h-4 w-4" />
                {isGenerating
                  ? t("ui.generating_button", "Generating...")
                  : t("ui.generate_button", "Generate Outline")}
              </Button>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-4 lg:flex lg:self-start lg:flex-col">
          <Card className="border-orange-500/20 lg:flex lg:min-h-[28rem] lg:max-h-[34rem] lg:flex-col lg:overflow-hidden">
            <CardHeader className="lg:shrink-0">
              <CardTitle>{t("ui.output_title", "Your story outline")}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-5 lg:flex-1 lg:overflow-y-auto lg:pr-4">
              {!outline ? (
                <p className="text-sm text-muted-foreground">
                  {t("ui.empty_output", "Describe your story idea, then generate to see a premise, conflict, arc, and key beats here.")}
                </p>
              ) : (
                <>
                  <div>
                    <h3 className="text-sm font-semibold">{t("ui.premise_label", "Premise")}</h3>
                    <p className="mt-1 text-sm text-muted-foreground">{outline.premise}</p>
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold">{t("ui.conflict_label", "Core conflict")}</h3>
                    <dl className="mt-2 space-y-1.5 text-sm text-muted-foreground">
                      <div className="flex flex-col gap-0.5 sm:flex-row sm:gap-2">
                        <dt className="shrink-0 font-medium text-foreground/70">{t("ui.conflict_goal_label", "Goal")}:</dt>
                        <dd className="flex-1">{outline.coreConflict.protagonistGoal}</dd>
                      </div>
                      <div className="flex flex-col gap-0.5 sm:flex-row sm:gap-2">
                        <dt className="shrink-0 font-medium text-foreground/70">{t("ui.conflict_opposition_label", "Opposition")}:</dt>
                        <dd className="flex-1">{outline.coreConflict.opposition}</dd>
                      </div>
                      <div className="flex flex-col gap-0.5 sm:flex-row sm:gap-2">
                        <dt className="shrink-0 font-medium text-foreground/70">{t("ui.conflict_stakes_label", "Stakes")}:</dt>
                        <dd className="flex-1">{outline.coreConflict.stakes}</dd>
                      </div>
                      <div className="flex flex-col gap-0.5 sm:flex-row sm:gap-2">
                        <dt className="shrink-0 font-medium text-foreground/70">{t("ui.conflict_urgency_label", "Urgency")}:</dt>
                        <dd className="flex-1">{outline.coreConflict.urgency}</dd>
                      </div>
                    </dl>
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold">{t("ui.beats_label", "Key beats")}</h3>
                    <div className="mt-2 space-y-2">
                      {outline.keyBeats.map((beat) => (
                        <div key={`${beat.label}-${beat.summary}`} className="rounded-lg border p-3">
                          <p className="text-sm font-medium">{beat.label}</p>
                          <p className="mt-1 text-sm text-muted-foreground">{beat.summary}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="rounded-lg border border-orange-500/20 bg-orange-50/60 p-4 dark:bg-orange-950/10">
                    <p className="text-sm font-medium">{t("ui.next_step_label", "Next step")}</p>
                    <p className="mt-1 text-sm text-muted-foreground">{outline.nextStepTeaser}</p>
                  </div>

                  {chapterPlan && (
                    <div>
                      <h3 className="text-sm font-semibold">
                        {t("ui.chapter_output_title", "Chapter plan")}
                      </h3>
                      <div className="mt-2 space-y-3">
                        {chapterPlan.chapters.map((chapter) => (
                          <div key={chapter.number} className="rounded-lg border p-3">
                            <p className="text-sm font-semibold">
                              Chapter {chapter.number}: {chapter.title}
                            </p>
                            <p className="mt-1 text-sm text-muted-foreground">{chapter.summary}</p>
                            <p className="mt-2 text-xs text-muted-foreground">
                              Conflict: {chapter.conflict}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              Hook: {chapter.endingHook}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>

          {outline && (
            <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap lg:shrink-0">
              <Button onClick={handleExpand} disabled={isExpanding} className="w-full sm:w-auto">
                <BookOpenText className="mr-2 h-4 w-4" />
                {isExpanding
                  ? t("ui.expanding_button", "Expanding...")
                  : t("ui.expand_button", "Expand into Chapters")}
              </Button>
              <Button variant="outline" onClick={handleGenerate} className="w-full sm:w-auto">
                {t("ui.regenerate_button", "Generate Another Outline")}
              </Button>
            </div>
          )}
        </div>
        </div>
      </div>

      <TurnstileInvisible
        ref={turnstileRef}
        onSuccess={runGenerate}
        onError={() => {
          setIsGenerating(false);
          toast.error(t("errors.verification_failed", "Verification failed. Try again."));
        }}
      />
    </section>
  );
}
