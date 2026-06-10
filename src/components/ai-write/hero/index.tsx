"use client";

import { useCallback, useState } from "react";
import { useRouter } from "@/i18n/navigation";
import { useLocale } from "next-intl";
import { Button } from "@/components/ui/button";
import Icon from "@/components/icon";

interface HeroCopy {
  heading: string;
  highlight: string;
  description: string;
  inputPlaceholder: string;
  inputButton: string;
  inputButtonSending: string;
}

interface AiWriteHeroProps {
  copy: HeroCopy;
}

function getHeroCopy(locale: string): HeroCopy {
  if (locale.startsWith("zh")) {
    return {
      heading: "你的 AI 写作搭档，",
      highlight: "不是写作机器",
      description:
        '大多数 AI 写作工具会把你的文字磨平成通用文本。AI Write 不同 — 它记住你的角色，学习你的风格，帮你写出<strong>你的</strong>故事，而不是统计学上的平均值。',
      inputPlaceholder: "描述你想写的故事…",
      inputButton: "开始写作",
      inputButtonSending: "正在打开…",
    };
  }
  if (locale.startsWith("de")) {
    return {
      heading: "Dein AI-Schreibpartner,",
      highlight: "keine Schreibmaschine",
      description:
        'Die meisten AI-Tools glätten deine Stimme zu generischem Text. AI Write ist anders — es merkt sich deine Charaktere, lernt deinen Stil und hilft dir, <strong>deine</strong> Geschichte zu schreiben.',
      inputPlaceholder: "Beschreibe die Geschichte, die du schreiben willst…",
      inputButton: "Loslegen",
      inputButtonSending: "Öffne…",
    };
  }
  return {
    heading: "Your AI Writing Partner,",
    highlight: "Not a Writing Machine",
    description:
      'Most AI tools flatten your voice into generic text. AI Write is different — it remembers your characters, learns your style, and helps you write <strong>your</strong> story, not a statistical average.',
    inputPlaceholder: "Describe the story you want to write…",
    inputButton: "Start Writing",
    inputButtonSending: "Opening…",
  };
}

export default function AiWriteHero() {
  const locale = useLocale();
  const router = useRouter();
  const copy = getHeroCopy(locale);
  const [prompt, setPrompt] = useState("");
  const [sending, setSending] = useState(false);

  const handleStart = useCallback(() => {
    setSending(true);

    if (typeof window !== "undefined" && prompt.trim()) {
      try {
        window.localStorage.setItem(
          "ai-write:generator-prefill",
          JSON.stringify({ title: "", content: prompt.trim() })
        );
      } catch {
        // ignore
      }
    }

    router.push("/ai-write/editor?source=landing");
  }, [prompt, router]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        handleStart();
      }
    },
    [handleStart]
  );

  return (
    <section className="relative flex min-h-[88vh] items-center justify-center overflow-hidden py-24 lg:py-32">
      {/* Background */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_900px_400px_at_50%_0%,oklch(0.93_0.05_65),transparent)] dark:bg-[radial-gradient(ellipse_900px_400px_at_50%_0%,oklch(0.18_0.04_65),transparent)]" />
        <div className="absolute inset-x-0 top-0 h-[500px] bg-gradient-to-b from-orange-500/[0.04] via-orange-500/[0.02] to-transparent" />
        <div
          className="absolute inset-0 opacity-[0.04] dark:opacity-[0.05]"
          style={{
            backgroundImage: "var(--bg-grid)",
            backgroundSize: "40px 40px",
          }}
        />
      </div>

      <div className="container relative z-10 px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col items-center text-center">
          {/* Title */}
          <div className="max-w-4xl">
            <h1 className="text-balance text-5xl font-black tracking-tight sm:text-6xl lg:text-7xl">
              <span className="block text-foreground">{copy.heading}</span>
              <span className="block pb-2 text-orange-600 dark:text-orange-400">
                {copy.highlight}
              </span>
            </h1>
          </div>

          {/* Description */}
          <div className="mt-8 max-w-3xl">
            <p
              className="text-lg text-balance font-light leading-relaxed text-muted-foreground/80 sm:text-xl"
              dangerouslySetInnerHTML={{ __html: copy.description }}
            />
          </div>

          {/* Input box */}
          <div className="mt-12 w-full max-w-2xl">
            <div className="relative rounded-2xl border border-border/60 bg-card shadow-lg shadow-black/[0.03] backdrop-blur-xl transition-shadow focus-within:border-orange-400/60 focus-within:shadow-orange-500/10 focus-within:shadow-xl">
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={copy.inputPlaceholder}
                rows={3}
                className="w-full resize-none rounded-t-2xl bg-transparent px-5 pt-4 pb-2 text-base outline-none placeholder:text-muted-foreground/60"
              />
              <div className="flex items-center justify-end border-t border-border/30 px-4 py-3">
                <Button
                  onClick={handleStart}
                  disabled={sending}
                  className="h-10 rounded-xl bg-orange-600 px-6 text-sm font-semibold text-white hover:bg-orange-700 dark:bg-orange-500 dark:hover:bg-orange-600"
                >
                  {sending ? (
                    copy.inputButtonSending
                  ) : (
                    <span className="flex items-center gap-2">
                      <Icon name="RiEdit2Line" className="size-4" />
                      {copy.inputButton}
                    </span>
                  )}
                </Button>
              </div>
            </div>
          </div>

          {/* Quick tools */}
          <div className="mt-8 flex flex-wrap items-center justify-center gap-2">
            {[
              "Fantasy",
              "Romance",
              "Mystery",
              "Fanfic",
              "Poem",
            ].map((tag) => (
              <span
                key={tag}
                className="rounded-full border border-border/50 bg-background/60 px-3 py-1 text-xs text-muted-foreground"
              >
                {tag}
              </span>
            ))}
            <span className="text-xs text-muted-foreground/60">+12 more</span>
          </div>
        </div>
      </div>
    </section>
  );
}
