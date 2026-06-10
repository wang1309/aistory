import { Section as SectionType } from "@/types/blocks/section";

export default function Branding({ section }: { section: SectionType }) {
  if (section.disabled) {
    return null;
  }

  return (
    <section id={section.name} className="py-20 border-y border-border/30">
      <div className="container flex flex-row items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <h2 className="text-center text-muted-foreground lg:text-left">
            {section.title}
          </h2>
          <div className="flex flex-wrap items-center justify-center gap-8 mt-4">
            {section.items?.map((item, idx) => {
              if (item.image) {
                return (
                  <img
                    key={idx}
                    src={item.image.src}
                    alt={item.image.alt || item.title}
                    className="h-7 grayscale opacity-60 hover:grayscale-0 hover:opacity-100 dark:invert transition-all duration-300"
                    width={112}
                    height={28}
                    loading="lazy"
                  />
                );
              }
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
