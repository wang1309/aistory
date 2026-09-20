import { Footer as FooterType } from "@/types/blocks/footer";
import Icon from "@/components/icon";
import { Link } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { getToolsBySlugs, type Tool } from "@/services/tools";

const NAME_GENERATOR_TOOL_SLUGS = [
  "elf-name-generator",
  "pen-name-generator",
  "gang-name-generator",
  "band-name-generator",
  "middle-name-generator",
  "city-nickname-generator",
  "youtube-name-generator",
];

const REWRITE_TOOL_SLUGS = ["essay-extender"];

export default function Footer({ footer }: { footer: FooterType }) {
  const t = useTranslations();

  if (footer.disabled) {
    return null;
  }

  const nameTools = getToolsBySlugs(NAME_GENERATOR_TOOL_SLUGS);
  const rewriteTools = getToolsBySlugs(REWRITE_TOOL_SLUGS);

  const renderToolColumn = (key: string, title: string, tools: Tool[]) => (
    <div key={key} className="min-w-0">
      <p className="mb-5 text-xs font-semibold uppercase tracking-[0.15em] text-foreground">
        {title}
      </p>
      <ul className="space-y-3 text-sm text-muted-foreground">
        {tools.map((tool) => (
          <li key={tool.slug} className="transition-colors hover:text-foreground">
            <Link href={tool.href as any} className="[overflow-wrap:anywhere]">
              {t(tool.nameKey)}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );

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

            {/* Link columns */}
            <div className="grid grid-cols-2 gap-x-6 gap-y-10 md:grid-cols-4 lg:gap-x-12">
              {(footer.nav?.items ?? []).flatMap((item, i, arr) => {
                const navColumn = (
                  <div key={`nav-${i}`} className="min-w-0">
                    <p className="mb-5 text-xs font-semibold uppercase tracking-[0.15em] text-foreground">
                      {item.title}
                    </p>
                    <ul className="space-y-3 text-sm text-muted-foreground">
                      {item.children?.map((iitem, ii) => (
                        <li key={ii} className="transition-colors hover:text-foreground">
                          <Link
                            href={iitem.url || ""}
                            target={iitem.target}
                            className="[overflow-wrap:anywhere]"
                          >
                            {iitem.title}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </div>
                );
                // Registry-driven tool columns take the slot between About
                // and Friend (the last two nav columns).
                if (i === arr.length - 2 && (nameTools.length > 0 || rewriteTools.length > 0)) {
                  return [
                    ...(nameTools.length > 0
                      ? [renderToolColumn("name-generators", t("footer.name_generator"), nameTools)]
                      : []),
                    ...(rewriteTools.length > 0
                      ? [renderToolColumn("rewrite", t("footer.rewrite"), rewriteTools)]
                      : []),
                    navColumn,
                  ];
                }
                return [navColumn];
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
