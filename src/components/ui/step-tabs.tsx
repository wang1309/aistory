"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { Check } from "lucide-react"

interface StepTab {
  id: string
  title: string
  description?: string
  isCompleted?: boolean
}

interface StepTabsProps {
  steps: StepTab[]
  activeStepId: string
  onStepChange: (stepId: string) => void
  className?: string
}

export function StepTabs({
  steps,
  activeStepId,
  onStepChange,
  className,
}: StepTabsProps) {
  const activeIndex = steps.findIndex(step => step.id === activeStepId)

  // Calculate progress percentage
  const progressPercentage = steps.length > 1
    ? (activeIndex / (steps.length - 1)) * 100
    : 0

  return (
    <div className={cn("w-full space-y-6", className)}>
      {/* Progress Bar Container */}
      <div className="relative w-full py-2">
        {/* Background Progress Bar (Gray) */}
        <div className="absolute top-5 left-0 right-0 h-1 bg-gray-200 dark:bg-gray-700 rounded-full" />

        {/* Active Progress Bar (Green Gradient) */}
        <div
          className="absolute top-5 left-0 h-1 bg-gradient-to-r from-green-500 to-green-400 rounded-full transition-all duration-500 ease-out"
          style={{ width: `${progressPercentage}%` }}
        />

        {/* Step Indicators */}
        <div className="relative flex justify-between w-full">
          {steps.map((step, index) => {
            const isActive = step.id === activeStepId
            const isCompleted = step.isCompleted || index < activeIndex
            const isClickable = index <= activeIndex || isCompleted

            return (
              <div key={step.id} className="flex flex-col items-center flex-shrink-0">
                {/* Step Circle */}
                <button
                  onClick={() => isClickable && onStepChange(step.id)}
                  disabled={!isClickable}
                  className={cn(
                    "relative z-10 flex items-center justify-center w-10 h-10 rounded-full border-2 transition-all duration-300",
                    "min-w-[40px] shadow-sm",
                    isActive && "border-primary bg-primary text-primary-foreground shadow-md ring-4 ring-primary/10",
                    isCompleted && "border-green-500 bg-green-500 text-white shadow-md ring-4 ring-green-500/10",
                    !isActive && !isCompleted && "border-gray-300 bg-white dark:border-gray-600 dark:bg-gray-800 text-gray-500 dark:text-gray-400",
                    isClickable && "hover:scale-105 hover:shadow-md cursor-pointer",
                    !isClickable && "cursor-not-allowed opacity-60"
                  )}
                >
                  {isCompleted ? (
                    <Check className="w-5 h-5" />
                  ) : (
                    <span className="text-sm font-medium">{index + 1}</span>
                  )}
                </button>

                {/* Step Text */}
                <button
                  onClick={() => isClickable && onStepChange(step.id)}
                  disabled={!isClickable}
                  className={cn(
                    "flex flex-col items-start mt-3 text-left max-w-[80px]",
                    !isClickable && "cursor-not-allowed"
                  )}
                >
                  <span
                    className={cn(
                      "text-sm font-medium whitespace-nowrap truncate",
                      isActive && "text-foreground",
                      isCompleted && "text-green-600 dark:text-green-400",
                      !isActive && !isCompleted && "text-muted-foreground"
                    )}
                  >
                    {step.title}
                  </span>
                  {step.description && (
                    <span className="text-xs text-muted-foreground whitespace-nowrap truncate mt-1">
                      {step.description}
                    </span>
                  )}
                </button>
              </div>
            )
          })}
        </div>
      </div>

      {/* Step Content */}
      <div>
        {steps.map((step) => {
          if (step.id !== activeStepId) return null
          return (
            <div key={step.id} className="animate-fade-in">
              {/* Content will be rendered by parent component */}
            </div>
          )
        })}
      </div>
    </div>
  )
}
