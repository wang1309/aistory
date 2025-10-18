import { Card, CardContent } from "@/components/ui/card";

import { Link } from "@/i18n/navigation";
import { Section as SectionType } from "@/types/blocks/section";
import OptimizedImage from "@/components/seo/optimized-image";

export default function Showcase({ section }: { section: SectionType }) {
  if (section.disabled) {
    return null;
  }

  return (
    <section id = "story_showcase" className="container py-16">
      <div className="mx-auto mb-12 text-center">
        <h2 className="mb-6 text-pretty text-3xl font-bold lg:text-4xl">
          {section.title}
        </h2>
        <p className="mb-4 max-w-xl text-muted-foreground lg:max-w-none lg:text-lg">
          {section.description}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {section.items?.map((item, index) => (
          <Link key={index} href={item.url || ""} target={item.target}>
            <Card className="overflow-hidden transition-all hover:shadow-lg dark:hover:shadow-primary/10 p-0">
              <CardContent className="p-0">
                <div className="relative aspect-[16/10] w-full overflow-hidden">
                  <OptimizedImage
                    src={item.image?.src || ""}
                    alt={item.image?.alt || item.title || "AI Story Generator showcase example"}
                    fill
                    className="object-cover rounded-t-lg transition-transform duration-300 hover:scale-110"
                  />
                </div>
                <div className="p-6">
                  <h3 className="text-xl font-semibold mb-2 line-clamp-1">
                    {item.title}
                  </h3>
                  <p className="text-sm text-muted-foreground line-clamp-3">
                    {item.description}
                  </p>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </section>
  );
}
