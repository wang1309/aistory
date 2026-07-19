import type { MouseEvent } from "react";
import MarkdownIt from "markdown-it";
import { useTranslations } from "next-intl";

export type Heading = { level: number; text: string; slug: string };

export function slugify(text: string): string {
  return text
    .trim()
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, "-")
    .replace(/^-+|-+$/g, "");
}

export function extractHeadings(
  content: string,
  levels: number[] = [2, 3]
): Heading[] {
  if (!content) return [];
  const md = new MarkdownIt();
  const tokens = md.parse(content, {});
  const headings: Heading[] = [];
  const used = new Map<string, number>();
  for (let i = 0; i < tokens.length; i++) {
    if (tokens[i].type !== "heading_open") continue;
    const level = parseInt(tokens[i].tag.slice(1), 10);
    if (!levels.includes(level)) continue;
    const inline = tokens[i + 1];
    const text = (inline?.children ?? []).map((c) => c.content).join("").trim();
    if (!text) continue;
    const base = slugify(text) || "section";
    const count = used.get(base) ?? 0;
    const slug = count === 0 ? base : `${base}-${count}`;
    used.set(base, count + 1);
    headings.push({ level, text, slug });
  }
  return headings;
}

export function TableOfContents({
  headings,
  activeSlug,
  onNavigate,
}: {
  headings: Heading[];
  activeSlug?: string;
  onNavigate: (slug: string) => void;
}) {
  const t = useTranslations();
  if (headings.length === 0) return null;

  return (
    <nav aria-label={t("blog.on_this_page")} className="text-sm">
      <p className="mb-3 font-sans text-xs font-medium uppercase tracking-[0.15em] text-muted-foreground">
        {t("blog.on_this_page")}
      </p>
      <ul>
        {headings.map((h) => {
          const active = activeSlug === h.slug;
          return (
            <li key={h.slug}>
              <a
                href={`#${h.slug}`}
                onClick={(e: MouseEvent<HTMLAnchorElement>) => {
                  e.preventDefault();
                  onNavigate(h.slug);
                }}
                className={`block border-l-2 py-1.5 pr-2 font-sans text-sm leading-snug transition-[color,border-color] duration-200 focus-visible:outline-none focus-visible:text-primary ${
                  h.level === 3 ? "pl-7" : "pl-4"
                } ${
                  active
                    ? "border-primary font-medium text-primary"
                    : "border-border text-muted-foreground hover:text-foreground"
                }`}
              >
                {h.text}
              </a>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
