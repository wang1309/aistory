import { Heart, ArrowLeftRight, Ban, File, CreditCard, Mail, LucideIcon } from "lucide-react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { FAQSection } from "@/types/blocks/faq";

interface FeaturedIconProps {
    icon: LucideIcon;
    size?: "md" | "lg";
    className?: string;
}

function FeaturedIcon({ icon: Icon, size = "md", className }: FeaturedIconProps) {
    const sizeClasses = {
        md: "size-12 p-3",
        lg: "size-14 p-3.5",
    };

    return (
        <div className={cn(
            "rounded-full bg-gray-50 dark:bg-gray-800 flex items-center justify-center text-gray-600 dark:text-gray-400",
            sizeClasses[size],
            className
        )}>
            <Icon className="size-full" />
        </div>
    );
}

// Icon mapping for FAQ items (order matters)
const FAQ_ICONS: LucideIcon[] = [Heart, ArrowLeftRight, Ban, File, CreditCard, Mail];

interface FAQSimple01Props {
    section?: FAQSection;
}

export const FAQSimple01 = ({ section }: FAQSimple01Props) => {
    // Fallback to default English content if no section provided
    if (!section) {
        return null;
    }

    return (
        <section className="bg-white dark:bg-gray-950 py-16 md:py-24">
            <div className="mx-auto max-w-container px-4 md:px-8">
                <div className="mx-auto flex w-full max-w-3xl flex-col items-center text-center">
                    <h2 className="text-display-sm font-semibold text-primary md:text-display-md">{section.title}</h2>
                    <p className="mt-4 text-lg text-tertiary md:mt-5 md:text-xl">{section.description}</p>
                </div>

                <div className="mt-12 md:mt-16">
                    <dl className="grid w-full grid-cols-1 justify-items-center gap-x-8 gap-y-10 sm:grid-cols-2 md:gap-y-16 lg:grid-cols-3">
                        {section.faqs.map((item, index) => {
                            const IconComponent = FAQ_ICONS[index % FAQ_ICONS.length];
                            return (
                                <div key={item.question}>
                                    <div className="flex max-w-sm flex-col items-center text-center">
                                        <FeaturedIcon className="md:hidden" size="md" icon={IconComponent} />
                                        <FeaturedIcon className="hidden md:flex" size="lg" icon={IconComponent} />

                                        <dt className="mt-4 text-lg font-semibold text-primary">{item.question}</dt>
                                        <dd className="mt-1 text-md text-tertiary">{item.answer}</dd>
                                    </div>
                                </div>
                            );
                        })}
                    </dl>
                </div>

                <div className="mt-12 flex flex-col items-center gap-6 rounded-2xl bg-gray-50 dark:bg-gray-900 px-6 py-8 text-center md:mt-16 md:gap-8 md:px-8 md:py-8 md:pb-10">
                    <div className="flex items-end -space-x-4">
                        <Avatar className="size-12 ring-[1.5px] ring-white">
                            <AvatarImage
                                src="https://www.untitledui.com/images/avatars/marco-kelly?fm=webp&q=80"
                                alt="Marco Kelly"
                            />
                            <AvatarFallback>MK</AvatarFallback>
                        </Avatar>
                        <Avatar className="size-14 z-10 ring-[1.5px] ring-white">
                            <AvatarImage
                                src="https://www.untitledui.com/images/avatars/amelie-laurent?fm=webp&q=80"
                                alt="Amelie Laurent"
                            />
                            <AvatarFallback>AL</AvatarFallback>
                        </Avatar>
                        <Avatar className="size-12 ring-[1.5px] ring-white">
                            <AvatarImage
                                src="https://www.untitledui.com/images/avatars/jaya-willis?fm=webp&q=80"
                                alt="Jaya Willis"
                            />
                            <AvatarFallback>JW</AvatarFallback>
                        </Avatar>
                    </div>
                    <div>
                        <h4 className="text-xl font-semibold text-primary">{section.cta.title}</h4>
                        <p className="mt-2 text-md text-tertiary md:text-lg">{section.cta.description}</p>
                    </div>
                    <Button size="lg">{section.cta.button}</Button>
                </div>
            </div>
        </section>
    );
};
