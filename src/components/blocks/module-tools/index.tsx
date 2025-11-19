import { getToolsByModule, type ModuleId } from "@/services/tools";
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Icon from "@/components/icon";
import { Link } from "@/i18n/navigation";
import { getTranslations } from "next-intl/server";

interface ModuleToolsSectionProps {
  module: ModuleId;
  title: string;
  description?: string;
  /**
   * Whether to render the soft gradient background behind the section.
   */
  showBackground?: boolean;
  /**
   * Heading level for the section title. Use "h1" on hub pages, "h2" on the homepage.
   */
  headingLevel?: "h1" | "h2";
  /**
   * Optional slug to exclude from the rendered tools list (e.g. current page).
   */
  excludeSlug?: string;
}

export default async function ModuleToolsSection({
  module,
  title,
  description,
  showBackground = true,
  headingLevel = "h2",
  excludeSlug,
}: ModuleToolsSectionProps) {
  const t = await getTranslations();
  const tools = getToolsByModule(module).filter((tool) =>
    excludeSlug ? tool.slug !== excludeSlug : true
  );

  if (!tools.length) {
    return null;
  }

  const HeadingTag = headingLevel;

  return (
    <section
      id={`${module}-tools`}
      className="relative py-20 sm:py-24 overflow-hidden"
    >
      {showBackground && (
        <>
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-accent/5 via-transparent to-primary/5" />
          <div className="pointer-events-none absolute top-1/3 right-1/4 h-[520px] w-[520px] rounded-full bg-accent/15 blur-3xl opacity-40" />
          <div className="pointer-events-none absolute bottom-1/4 left-1/3 h-[420px] w-[420px] rounded-full bg-primary/15 blur-3xl opacity-35" />
        </>
      )}

      <div className="container relative">
        <div className="mx-auto mb-12 flex max-w-3xl flex-col items-center gap-3 text-center">
          <HeadingTag className="text-2xl font-extrabold tracking-tight lg:text-3xl xl:text-4xl leading-[1.2]">
            <span className="bg-gradient-to-r from-foreground via-foreground/90 to-foreground/80 bg-clip-text text-transparent">
              {title}
            </span>
          </HeadingTag>
          {description && (
            <p className="max-w-2xl text-base lg:text-lg text-muted-foreground/90 leading-[1.7]">
              {description}
            </p>
          )}
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 lg:gap-8">
          {tools.map((tool, index) => (
            <Card
              key={tool.slug}
              className="group relative h-full border-border/60 bg-gradient-to-br from-background/90 via-background/80 to-background/70 backdrop-blur-sm shadow-lg transition-all duration-300 hover:border-primary/40 hover:shadow-xl hover:shadow-primary/10"
              style={{
                animationDelay: `${index * 80 + 150}ms`,
              }}
            >
              {/* subtle top gradient accent */}
              <div className="pointer-events-none absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-primary/40 via-primary/10 to-accent/40 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

              <CardHeader className="flex flex-row items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="flex size-11 items-center justify-center rounded-xl bg-gradient-to-br from-primary/15 via-primary/10 to-accent/20 border border-primary/30 text-primary shadow-sm">
                    <Icon name={tool.icon} className="size-5" />
                  </div>
                  <div>
                    <CardTitle className="text-base font-semibold leading-snug text-foreground group-hover:text-primary transition-colors">
                      {t(tool.nameKey)}
                    </CardTitle>
                    <CardDescription className="mt-1 text-xs uppercase tracking-wide text-muted-foreground/80">
                      {t("ai_tools.badge_category")}
                    </CardDescription>
                  </div>
                </div>

                {tool.badges && tool.badges.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {tool.badges.map((badge) => (
                      <Badge
                        key={badge}
                        variant={badge === "hot" ? "default" : "secondary"}
                        className="text-[11px] px-2 py-0.5"
                      >
                        {badge === "hot"
                          ? t("ai_tools.badge_hot")
                          : t("ai_tools.badge_new")}
                      </Badge>
                    ))}
                  </div>
                )}
              </CardHeader>

              <CardContent className="pt-0">
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {t(tool.shortDescKey)}
                </p>
              </CardContent>

              <CardFooter className="mt-auto pt-4">
                <Link href={tool.href as any} className="w-full">
                  <Button
                    className="w-full justify-between rounded-full text-sm"
                    variant="outline"
                  >
                    <span>{t("ai_tools.button_use_now")}</span>
                    <Icon
                      name="RiArrowRightLine"
                      className="size-4 text-muted-foreground group-hover:text-primary"
                    />
                  </Button>
                </Link>
              </CardFooter>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
