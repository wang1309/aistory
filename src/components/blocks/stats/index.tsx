import Icon from "@/components/icon";
import { Section as SectionType } from "@/types/blocks/section";

export default function Stats({ section }: { section: SectionType }) {
  if (section.disabled) return null;

  return (
    <section id={section.name} className="relative py-28 sm:py-36">
      <div className="container flex flex-col items-center gap-4">
        {section.label && (
          <div className="flex items-center gap-2 text-sm font-medium tracking-wide text-primary">
            {section.icon && <Icon name={section.icon} className="h-4 w-auto opacity-60" />}
            {section.label}
          </div>
        )}
        {section.title && (
          <h2 className="mt-2 text-center font-display text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            {section.title}
          </h2>
        )}
        {section.description && (
          <p className="mt-2 text-center text-muted-foreground/70 sm:text-lg">
            {section.description}
          </p>
        )}
        <div className="w-full flex flex-col md:flex-row items-center justify-center gap-10 md:gap-0 mt-14">
          {section.items?.map((item, index) => {
            const isMiddle = index === 1;
            return (
              <div
                key={index}
                className={`flex-1 text-center ${index > 0 ? "md:border-l md:border-border/15" : ""} ${isMiddle ? "md:px-14" : "md:px-6"}`}
              >
                <p className="text-[10px] font-medium text-muted-foreground/50 uppercase tracking-[0.2em]">
                  {item.title}
                </p>
                <p className={`pt-4 font-display font-bold tracking-tight leading-none ${isMiddle ? "text-[3rem] sm:text-[4.5rem] lg:text-[6rem]" : "text-[2.25rem] sm:text-[3rem] lg:text-[4rem]"}`}>
                  <span className="bg-gradient-to-b from-foreground to-foreground/60 bg-clip-text text-transparent">
                    {item.label}
                  </span>
                </p>
                {item.description && (
                  <p className={`mt-3 text-muted-foreground/50 ${isMiddle ? "text-base" : "text-sm"}`}>
                    {item.description}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
