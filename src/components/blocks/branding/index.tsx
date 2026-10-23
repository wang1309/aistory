import { Section as SectionType } from "@/types/blocks/section";

export default function Branding({ section }: { section: SectionType }) {
  if (section.disabled) return null;

  return (
    <section id={section.name} className="py-[60px]">
      <div className="container flex flex-col items-center gap-6">
        {section.title && (
          <p className="text-center text-[10px] font-semibold uppercase tracking-[0.19em] text-muted-foreground/70">
            {section.title}
          </p>
        )}
        <div className="flex flex-wrap items-center justify-center gap-10">
          {section.items?.map((item, idx) => {
            if (item.image) {
              return (
                <img
                  key={idx}
                  src={item.image.src}
                  alt={item.image.alt || item.title}
                  className="h-6 grayscale opacity-40 hover:grayscale-0 hover:opacity-80 dark:invert transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)]"
                  width={112}
                  height={28}
                  loading="lazy"
                />
              );
            }
          })}
        </div>
      </div>
    </section>
  );
}
