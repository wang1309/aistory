export interface StoryGuideStepCopy {
  step1Title: string;
  step1Description: string;
  step2Title: string;
  step2Description: string;
  step3Title: string;
  step3Description: string;
}

export function buildStoryGuideSteps(copy: StoryGuideStepCopy) {
  return [
    {
      popover: {
        title: copy.step1Title,
        description: copy.step1Description,
        side: "over" as const,
        align: "center" as const,
      },
    },
    {
      element: "#story-prompt-input",
      popover: {
        title: copy.step2Title,
        description: copy.step2Description,
        side: "bottom" as const,
        align: "start" as const,
      },
    },
    {
      element: "#generate-button",
      popover: {
        title: copy.step3Title,
        description: copy.step3Description,
        side: "top" as const,
        align: "start" as const,
      },
    },
  ];
}
