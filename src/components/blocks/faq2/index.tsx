import { Heart, ArrowLeftRight, Ban, File, CreditCard, Mail, LucideIcon } from "lucide-react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

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

interface FAQ {
    question: string;
    answer: string;
    icon: LucideIcon;
}

const faqs: FAQ[] = [
    {
        question: "Is there a free trial available?",
        answer: "Yes, you can try us for free for 30 days. Our friendly team will work with you to get you up and running as soon as possible.",
        icon: Heart,
    },
    {
        question: "Can I change my plan later?",
        answer: "Of course. Our pricing scales with your company. Chat to our friendly team to find a solution that works for you.",
        icon: ArrowLeftRight,
    },
    {
        question: "What is your cancellation policy?",
        answer: "We understand that things change. You can cancel your plan at any time and we'll refund you the difference already paid.",
        icon: Ban,
    },
    {
        question: "Can other info be added to an invoice?",
        answer: "At the moment, the only way to add additional information to invoices is to add the information to the workspace's name.",
        icon: File,
    },
    {
        question: "How does billing work?",
        answer: "Plans are per workspace, not per account. You can upgrade one workspace, and still have any number of free workspaces.",
        icon: CreditCard,
    },
    {
        question: "How do I change my account email?",
        answer: "You can change the email address associated with your account by going to untitled.com/account from a laptop or desktop.",
        icon: Mail,
    },
];

export const FAQSimple01 = () => {
    return (
        <section className="bg-primary py-16 md:py-24">
            <div className="mx-auto max-w-container px-4 md:px-8">
                <div className="mx-auto flex w-full max-w-3xl flex-col items-center text-center">
                    <h2 className="text-display-sm font-semibold text-primary md:text-display-md">Frequently asked questions</h2>
                    <p className="mt-4 text-lg text-tertiary md:mt-5 md:text-xl">Everything you need to know about the product and billing. </p>
                </div>

                <div className="mt-12 md:mt-16">
                    <dl className="grid w-full grid-cols-1 justify-items-center gap-x-8 gap-y-10 sm:grid-cols-2 md:gap-y-16 lg:grid-cols-3">
                        {faqs.map((item) => (
                            <div key={item.question}>
                                <div className="flex max-w-sm flex-col items-center text-center">
                                    <FeaturedIcon className="md:hidden" size="md" icon={item.icon} />
                                    <FeaturedIcon className="hidden md:flex" size="lg" icon={item.icon} />

                                    <dt className="mt-4 text-lg font-semibold text-primary">{item.question}</dt>
                                    <dd className="mt-1 text-md text-tertiary">{item.answer}</dd>
                                </div>
                            </div>
                        ))}
                    </dl>
                </div>

                <div className="mt-12 flex flex-col items-center gap-6 rounded-2xl bg-secondary px-6 py-8 text-center md:mt-16 md:gap-8 md:px-8 md:py-8 md:pb-10">
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
                        <h4 className="text-xl font-semibold text-primary">Still have questions?</h4>
                        <p className="mt-2 text-md text-tertiary md:text-lg">Can't find the answer you're looking for? Please chat to our friendly team.</p>
                    </div>
                    <Button size="lg">Get in touch</Button>
                </div>
            </div>
        </section>
    );
};
