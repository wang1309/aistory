"use client";

import { useEffect } from "react";
import { useTranslations } from "next-intl";
import { buildStoryGuideSteps } from "./story-guide-steps";

export default function StoryGuide() {
    const t = useTranslations("story_guide");

    useEffect(() => {
        let isActive = true;
        let driverObj: ReturnType<(typeof import("driver.js"))["driver"]>;

        const startGuide = async (force = false) => {
            const hasSeenGuide = localStorage.getItem("hasSeenGuide");
            if (hasSeenGuide && !force) {
                return;
            }

            const [{ driver }] = await Promise.all([
                import("driver.js"),
                import("driver.js/dist/driver.css"),
            ]);
            if (!isActive) {
                return;
            }

            driverObj ??= driver({
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
                    if (!heroBtn) {
                        return;
                    }

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
                },
            });

            driverObj.drive();
        };

        const handleStartGuide = () => void startGuide(true);

        window.addEventListener("start-story-guide", handleStartGuide);
        const timer = window.setTimeout(() => void startGuide(), 1000);

        return () => {
            isActive = false;
            window.clearTimeout(timer);
            window.removeEventListener("start-story-guide", handleStartGuide);
            driverObj?.destroy();
        };
    }, [t]);

    return null;
}
