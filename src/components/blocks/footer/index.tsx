import { Footer as FooterType } from "@/types/blocks/footer";
import Icon from "@/components/icon";
import { useTranslations } from "next-intl";
import { getToolsBySlugs, type Tool } from "@/services/tools";
import FooterColumn, {
  type FooterColumnGroup,
  type FooterColumnLink,
} from "./footer-column";

const NAME_GENERATOR_TOOL_SLUGS = [
  "elf-name-generator",
  "pen-name-generator",
  "gang-name-generator",
  "band-name-generator",
  "middle-name-generator",
  "city-nickname-generator",
  "youtube-name-generator",
];

const REWRITE_TOOL_SLUGS = ["essay-extender", "paragraph-rewriter"];

export default function Footer({ footer }: { footer: FooterType }) {
  const t = useTranslations();

  if (footer.disabled) {
    return null;
  }

  const nameTools = getToolsBySlugs(NAME_GENERATOR_TOOL_SLUGS);
  const rewriteTools = getToolsBySlugs(REWRITE_TOOL_SLUGS);

  const navItems = footer.nav?.items ?? [];
  // Creative 列没有稳定 id,标题又是多语言的,靠它独有的 /ai-tools/ 子链接
  // 识别(locale 与列顺序无关);它现在作为子分类折叠进 AI Write。
  const creativeItem = navItems.find((nav) =>
    nav.children?.some(
      (c) =>
        c.url?.startsWith("/ai-tools/") || c.url === "/incorrect-quote-generator"
    )
  );

  const toColumnLinks = (tools: Tool[]): FooterColumnLink[] =>
    tools.map((tool) => ({
      title: t(tool.nameKey),
      url: tool.href as string,
    }));

  return (
    <section id={footer.name} className="border-t border-border bg-[oklch(0.955_0.009_85)] dark:bg-[oklch(0.165_0_0)]">
      <div className="max-w-7xl mx-auto px-8 py-16">
        <footer>
          <div className="grid grid-cols-1 gap-12 lg:grid-cols-[minmax(0,20rem)_1fr]">
            {/* Brand column */}
            <div className="flex w-full max-w-96 shrink flex-col items-start gap-6">
              {footer.brand && (
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    {footer.brand.logo && (
                      <img
                        src={footer.brand.logo.src}
                        alt={footer.brand.logo.alt || footer.brand.title}
                        className="h-9"
                        width={36}
                        height={36}
                        loading="lazy"
                      />
                    )}
                    {footer.brand.title && (
                      <p className="min-w-0 text-2xl font-display font-bold tracking-tight text-foreground [overflow-wrap:anywhere]">
                        {footer.brand.title}
                      </p>
                    )}
                  </div>
                  {footer.brand.description && (
                    <p className="mt-5 text-sm leading-relaxed text-muted-foreground">
                      {footer.brand.description}
                    </p>
                  )}
                </div>
              )}
              {footer.social && (
                <ul className="flex items-center space-x-4 text-muted-foreground">
                  {footer.social.items?.map((item, i) => (
                    <li key={i} className="transition-colors hover:text-foreground">
                      <a
                        href={item.url || ""}
                        target={item.target}
                        aria-label={item.title || item.icon}
                        className="inline-flex size-9 items-center justify-center rounded-full border border-border bg-background transition-colors hover:border-foreground/25"
                      >
                        {item.icon && (
                          <Icon name={item.icon} className="size-4" />
                        )}
                      </a>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* Link columns: independent accordion cells in a responsive grid.
                AI Write keeps a static always-open title; its tool groups
                (Story / Name Generators / Rewrite / Creative) nest as collapsed
                sub-categories. About/Friend stay flat accordions. */}
            <div className="grid min-w-0 grid-cols-1 gap-y-4 sm:grid-cols-2 lg:max-w-4xl lg:grid-cols-3 lg:gap-x-10">
              {navItems.map((item, i) => {
                const navChildren = (item.children ?? []).map((iitem) => ({
                  title: iitem.title ?? "",
                  url: iitem.url,
                  target: iitem.target,
                }));

                // First nav column (AI Write) hosts every tool group as a
                // collapsible sub-category.
                if (i === 0) {
                  const groups: FooterColumnGroup[] = [
                    {
                      id: "story-generator",
                      title: t("footer.story_generator"),
                      items: navChildren,
                    },
                  ];
                  if (nameTools.length > 0) {
                    groups.push({
                      id: "name-generators",
                      title: t("footer.name_generator"),
                      items: toColumnLinks(nameTools),
                    });
                  }
                  if (rewriteTools.length > 0) {
                    groups.push({
                      id: "rewrite",
                      title: t("footer.rewrite"),
                      items: toColumnLinks(rewriteTools),
                    });
                  }
                  if (creativeItem) {
                    groups.push({
                      id: "creative",
                      title: creativeItem.title ?? "",
                      items: (creativeItem.children ?? []).map((iitem) => ({
                        title: iitem.title ?? "",
                        url: iitem.url,
                        target: iitem.target,
                      })),
                    });
                  }
                  return (
                    <FooterColumn
                      key={`nav-${i}`}
                      columnId={`nav-${i}`}
                      title={item.title ?? ""}
                      collapsible={false}
                      groups={groups}
                    />
                  );
                }

                // Creative now nests under AI Write — not a top-level column.
                if (item === creativeItem) {
                  return null;
                }

                // About/Friend stay flat, always-open columns (collapsible
                // disabled for now).
                return (
                  <FooterColumn
                    key={`nav-${i}`}
                    columnId={`nav-${i}`}
                    title={item.title ?? ""}
                    collapsible={false}
                    items={navChildren}
                  />
                );
              })}
            </div>
          </div>

          {footer.friendshipLinks && footer.friendshipLinks.items && footer.friendshipLinks.items.length > 0 && (
            <div className="mt-14 flex flex-col items-center border-t border-border pt-10">
              {footer.friendshipLinks.title && (
                <h3 className="mb-6 text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                  {footer.friendshipLinks.title}
                </h3>
              )}
              {/* 文本外链常驻，保证第三方抓取可见 */}
              <div className="sr-only">
                {footer.friendshipLinks.items.map((link, i) => (
                  <a key={i} href={link.url} target={link.target || "_blank"} rel="noopener noreferrer">
                    {link.title || link.image?.alt || link.url}
                  </a>
                ))}
              </div>
              {/* 图片徽章仍使用 lazy，减少带宽 */}
              <div className="flex flex-wrap items-center justify-center gap-6 lg:gap-8">
                {footer.friendshipLinks.items.map((link, i) => (
                  <a
                    key={i}
                    href={link.url}
                    target={link.target || "_blank"}
                    rel="noopener noreferrer"
                    className="transition-opacity hover:opacity-80"
                    title={link.title}
                  >
                    <img
                      src={link.image.src}
                      alt={link.image.alt || link.title}
                      className="h-12 w-auto lg:h-14"
                      width={160}
                      height={64}
                      loading="lazy"
                    />
                  </a>
                ))}
              </div>
            </div>
          )}

          <div className="mt-10 flex flex-col justify-between gap-4 border-t border-border pt-8 text-center text-sm text-muted-foreground lg:flex-row lg:items-center lg:text-left">
            {footer.copyright && (
              <p>{footer.copyright}</p>
            )}

            {footer.agreement && (
              <ul className="flex justify-center gap-5 lg:justify-start">
                {footer.agreement.items?.map((item, i) => (
                  <li key={i} className="transition-colors hover:text-foreground">
                    <a href={item.url || ""} target={item.target}>
                      {item.title}
                    </a>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </footer>
      </div>
    </section>
  );
}
