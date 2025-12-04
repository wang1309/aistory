"use client";

import { useRouter } from "next/navigation";
import { ChevronRight } from "lucide-react";

interface PoemTitleBreadcrumbProps {
    homeText: string;
    currentText: string;
}

export default function PoemTitleBreadcrumb({ homeText, currentText }: PoemTitleBreadcrumbProps) {
    const router = useRouter();

    return (
        <nav className="flex items-center text-sm text-muted-foreground/70" aria-label="Breadcrumb">
            <button
                onClick={() => router.push("/")}
                className="hover:text-foreground transition-colors duration-200 font-medium"
            >
                {homeText}
            </button>
            <ChevronRight className="size-4 mx-2 opacity-40" />
            <span className="text-foreground font-medium">{currentText}</span>
        </nav>
    );
}
