"use client";

import { useEffect } from "react";
import { driver } from "driver.js";
import "driver.js/dist/driver.css";
import { useTheme } from "next-themes";
import { useTranslations } from "next-intl";

export default function StoryGuide() {
    const { theme } = useTheme();
    const t = useTranslations("story_guide");

    useEffect(() => {
        const hasSeenGuide = localStorage.getItem("hasSeenGuide");
        if (hasSeenGuide) return;

        const driverObj = driver({
            showProgress: true,
            animate: true,
            doneBtnText: t("buttons.done"),
            nextBtnText: t("buttons.next"),
            prevBtnText: t("buttons.previous"),
            steps: [
                {
                    element: "body",
                    popover: {
                        title: t("step_1.title"),
                        description: t("step_1.description"),
                        side: "left",
                        align: "start",
                    },
                },
                {
                    element: "#story-prompt-input",
                    popover: {
                        title: t("step_2.title"),
                        description: t("step_2.description"),
                        side: "bottom",
                        align: "start",
                    },
                },
                {
                    element: "#generate-button",
                    popover: {
                        title: t("step_3.title"),
                        description: t("step_3.description"),
                        side: "top",
                        align: "start",
                    },
                },
            ],
            onDestroyed: () => {
                localStorage.setItem("hasSeenGuide", "true");
                // Scroll to hero button and apply scale animation
                const heroBtn = document.getElementById("hero-quick-start-btn");
                if (heroBtn) {
                    heroBtn.scrollIntoView({ behavior: "smooth", block: "center" });

                    // Add scale animation with keyframes
                    heroBtn.style.animation = "quickTryPulse 1.5s ease-in-out 3";

                    // Define keyframes if not already defined
                    if (!document.getElementById("quickTryPulseKeyframes")) {
                        const style = document.createElement("style");
                        style.id = "quickTryPulseKeyframes";
                        style.textContent = `
              @keyframes quickTryPulse {
                0%, 100% { transform: scale(1); }
                50% { transform: scale(1.1); }
              }
            `;
                        document.head.appendChild(style);
                    }

                    // Remove animation after it completes
                    setTimeout(() => {
                        heroBtn.style.animation = "";
                    }, 4500);
                }
            },
        });

        // Small delay to ensure DOM is ready and styles are loaded
        const timer = setTimeout(() => {
            driverObj.drive();
        }, 1000);

        return () => clearTimeout(timer);
    }, []); // t is stable, but we can leave deps empty or add t if linter complains. Empty is fine for now as we want it to run once.

    return null;
}
