import enMessages from "@/i18n/messages/en.json";
import aiWriteEditorPage from "@/i18n/pages/ai-write-editor/en.json";
import aiWriteLandingPage from "@/i18n/pages/ai-write-landing/en.json";
import pricingPage from "@/i18n/pages/pricing/en.json";
import { defaultLocale } from "@/i18n/locale";
import { getAllTools } from "@/services/tools";

export const LLM_MARKDOWN_CONTENT_TYPE = "text/markdown; charset=utf-8";

export function getWebUrl(): string {
  return process.env.NEXT_PUBLIC_WEB_URL || "https://storiesgenerator.org";
}

export function postUrl(slug: string, locale: string = "en"): string {
  const webUrl = getWebUrl();
  return locale === "en"
    ? `${webUrl}/posts/${slug}`
    : `${webUrl}/${locale}/posts/${slug}`;
}

export interface LlmsPostItem {
  slug: string;
  title: string;
  description?: string | null;
  locale: string;
  content?: string | null;
}

export interface LlmsPostRow {
  status?: string | null;
  slug?: string | null;
  title?: string | null;
  description?: string | null;
  locale?: string | null;
  content?: string | null;
}

const ONLINE_POST_STATUS = "online";

export function toLlmsPosts(
  rows: LlmsPostRow[] | undefined,
  options?: { withContent?: boolean }
): LlmsPostItem[] {
  return (rows ?? [])
    .filter(
      (row) =>
        row.status === ONLINE_POST_STATUS &&
        !!row.slug &&
        !!row.title &&
        row.locale === defaultLocale
    )
    .map((row) => ({
      slug: row.slug!,
      title: row.title || row.slug!,
      description: row.description,
      locale: row.locale || defaultLocale,
      ...(options?.withContent ? { content: row.content } : {}),
    }));
}

export function llmsIntroLines(): string[] {
  const { siteName, description } = enMessages.metadata;
  const webUrl = getWebUrl();

  return [
    `# ${siteName}`,
    "",
    `> ${description}`,
    "",
    `${siteName} is a free AI-powered creative writing suite. It turns a one-line idea into a full story, plot, poem, character backstory, or title in seconds, and offers an AI Write workbench for drafting and continuing long-form fiction.`,
    "",
    "Key capabilities:",
    "",
    "- 30+ free AI writing tools covering stories, plots, poems, titles, character backstories, fanfiction, and name generation",
    "- AI Write editor — a writing workbench to draft, edit, and continue long-form fiction with AI assistance",
    "- Multi-genre and multi-language output across fantasy, romance, comedy, horror, and more",
    "- Blog with storytelling guides, writing prompts, and product updates",
    "",
    "Notes:",
    "",
    `- The site is available in six languages: English (no URL prefix), Chinese (${webUrl}/zh), German (${webUrl}/de), Korean (${webUrl}/ko), Japanese (${webUrl}/ja), and Russian (${webUrl}/ru).`,
    "- Generating stories is free with a daily anonymous quota; signing in unlocks a larger quota. No installation is required.",
    "",
  ];
}

export function llmsPageLines(): string[] {
  const webUrl = getWebUrl();
  const { siteName } = enMessages.metadata;

  const lines: string[] = [
    "## Pages",
    "",
    `- [Home](${webUrl}/): ${enMessages.metadata.description}`,
    `- [Pricing](${webUrl}/pricing): ${pricingPage.pricing.description}`,
    `- [All AI Tools](${webUrl}/ai-tools): ${enMessages.ai_tools.section_description_hub}`,
    `- [AI Write](${webUrl}/ai-write): ${aiWriteLandingPage.ai_write_landing.metadata.description}`,
    `- [AI Write Editor](${webUrl}/ai-write/editor): ${aiWriteEditorPage.ai_write_editor.metadata.description}`,
  ];

  for (const tool of getAllTools()) {
    if (tool.href === "/") continue;
    const name = getToolMessage(tool.nameKey);
    const desc = getToolMessage(tool.shortDescKey);
    if (!name || !desc) continue;
    lines.push(`- [${name}](${webUrl}${tool.href}): ${desc}`);
  }

  lines.push("", `All tools are free to use on ${siteName}, no sign-up required.`, "");

  return lines;
}

function getToolMessage(key: string): string {
  const parts = key.split(".");
  let node: unknown = enMessages;
  for (const part of parts) {
    if (typeof node !== "object" || node === null) return "";
    node = (node as Record<string, unknown>)[part];
  }
  return typeof node === "string" ? node : "";
}

export function llmsOptionalLines(): string[] {
  const webUrl = getWebUrl();
  const { siteName } = enMessages.metadata;

  return [
    "## Optional",
    "",
    `- [Blog](${webUrl}/posts): ${enMessages.blog.meta_description}`,
    `- [Privacy Policy](${webUrl}/privacy-policy): How ${siteName} collects, uses, and protects your information.`,
    `- [Terms of Service](${webUrl}/terms-of-service): The terms and conditions for using ${siteName}.`,
    `- [Changelog](${webUrl}/changelog): ${enMessages.changelog.description}`,
    "",
  ];
}

export function llmsPostIndexLines(posts: LlmsPostItem[]): string[] {
  if (posts.length === 0) return [];

  const lines: string[] = ["## Blog Posts", ""];
  for (const post of posts) {
    const desc = post.description ? `: ${post.description}` : "";
    lines.push(`- [${post.title}](${postUrl(post.slug, post.locale)})${desc}`);
  }
  lines.push("");

  return lines;
}

export function llmsFullPostLines(posts: LlmsPostItem[]): string[] {
  if (posts.length === 0) return [];

  const lines: string[] = ["## Blog Posts", ""];
  for (const post of posts) {
    lines.push(`### ${post.title}`, "");
    lines.push(`URL: ${postUrl(post.slug, post.locale)}`);
    if (post.description) lines.push(`Description: ${post.description}`);
    lines.push("");
    if (post.content) lines.push(post.content, "");
    lines.push("---", "");
  }

  return lines;
}
