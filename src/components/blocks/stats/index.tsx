import Icon from "@/components/icon";
import { Section as SectionType } from "@/types/blocks/section";

export default function Stats({ section }: { section: SectionType }) {
  if (section.disabled) {
    return null;
  }

  return (
    <section id={section.name} className="py-24 sm:py-28">
      <div className="container flex flex-col items-center gap-4">
        {section.label && (
          <div className="flex items-center gap-1 text-sm font-medium tracking-wide text-primary">
            {section.icon && (
              <Icon name={section.icon} className="h-5 w-auto" />
            )}
            {section.label}
          </div>
        )}
        <h2 className="text-center text-3xl font-semibold leading-snug lg:text-4xl">
          {section.title}
        </h2>
        <p className="text-center text-muted-foreground lg:text-lg">
          {section.description}
        </p>
        <div className="w-full flex flex-col md:flex-row items-center justify-center gap-8 md:gap-0 mt-12">
          {section.items?.map((item, index) => {
            const isMiddle = index === 1;
            return (
              <div
                key={index}
                className={`flex-1 text-center ${index > 0 ? 'md:border-l md:border-border/50' : ''} ${isMiddle ? 'md:px-12' : 'md:px-6'}`}
              >
                <p className="text-sm font-medium text-muted-foreground tracking-wide uppercase">
                  {item.title}
                </p>
                <p className={`pt-3 font-display font-bold text-primary ${isMiddle ? 'text-8xl lg:text-9xl' : 'text-6xl lg:text-7xl'}`}>
                  {item.label}
                </p>
                <p className={`mt-2 font-normal text-muted-foreground ${isMiddle ? 'text-lg' : 'text-base'}`}>
                  {item.description}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
