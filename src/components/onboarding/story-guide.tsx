"use client";

import { useEffect } from "react";
import { driver } from "driver.js";
import "driver.js/dist/driver.css";
import { useTranslations } from "next-intl";
import { buildStoryGuideSteps } from "./story-guide-steps";

export default function StoryGuide() {
    const t = useTranslations("story_guide");

    useEffect(() => {
        const driverObj = driver({
            showProgress: true,
            animate: true,
            doneBtnText: t("buttons.done"),
            nextBtnText: t("buttons.next"),
            prevBtnText: t("buttons.previous"),
            steps: buildStoryGuideSteps({
                step1Title: t("step_1.title"),
                step1Description: t("step_1.description"),
                step2Title: t("step_2.title"),
                step2Description: t("step_2.description"),
                step3Title: t("step_3.title"),
                step3Description: t("step_3.description"),
            }),
            onDestroyed: () => {
                localStorage.setItem("hasSeenGuide", "true");
                const heroBtn = document.getElementById("hero-quick-start-btn");
                if (heroBtn) {
                    const rect = heroBtn.getBoundingClientRect();
                    const isVisible = rect.top < window.innerHeight && rect.bottom > 0;
                    if (!isVisible) {
                        return;
                    }

                    heroBtn.style.animation = "quickTryPulse 1.5s ease-in-out 3";

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

                    setTimeout(() => {
                        heroBtn.style.animation = "";
                    }, 4500);
                }
            },
        });

        const startGuide = (force = false) => {
            const hasSeenGuide = localStorage.getItem("hasSeenGuide");
            if (hasSeenGuide && !force) {
                return;
            }

            driverObj.drive();
        };

        const handleStartGuide = () => startGuide(true);

        window.addEventListener("start-story-guide", handleStartGuide);
        const timer = window.setTimeout(() => startGuide(), 1000);

        return () => {
            window.clearTimeout(timer);
            window.removeEventListener("start-story-guide", handleStartGuide);
            driverObj.destroy();
        };
    }, []); // t is stable, but we can leave deps empty or add t if linter complains. Empty is fine for now as we want it to run once.

    return null;
}
