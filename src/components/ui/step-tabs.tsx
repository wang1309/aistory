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

  return (
    <div className={cn("w-full space-y-3", className)}>
      {/* Horizontal Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2">
        {steps.map((step, index) => {
          const isActive = step.id === activeStepId
          const isCompleted = step.isCompleted || index < activeIndex
          const isClickable = index <= activeIndex || isCompleted

          return (
            <div
              key={step.id}
              className="flex items-center gap-2"
            >
              {/* Step Circle */}
              <button
                onClick={() => isClickable && onStepChange(step.id)}
                disabled={!isClickable}
                className={cn(
                  "flex items-center justify-center w-10 h-10 rounded-full border-2 transition-all",
                  "min-w-[40px]",
                  isActive && "border-primary bg-primary text-primary-foreground",
                  isCompleted && "border-green-500 bg-green-500 text-white",
                  !isActive && !isCompleted && "border-border bg-background text-muted-foreground",
                  isClickable && "hover:border-primary cursor-pointer",
                  !isClickable && "cursor-not-allowed opacity-50"
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
                  "flex flex-col items-start",
                  !isClickable && "cursor-not-allowed"
                )}
              >
                <span
                  className={cn(
                    "text-sm font-medium whitespace-nowrap",
                    isActive && "text-foreground",
                    isCompleted && "text-green-600",
                    !isActive && !isCompleted && "text-muted-foreground"
                  )}
                >
                  {step.title}
                </span>
                {step.description && (
                  <span className="text-xs text-muted-foreground whitespace-nowrap">
                    {step.description}
                  </span>
                )}
              </button>

              {/* Connector Line */}
              {index < steps.length - 1 && (
                <div
                  className={cn(
                    "h-[2px] w-12 md:w-16 mx-1.5 transition-colors",
                    isCompleted ? "bg-green-500" : "bg-border"
                  )}
                />
              )}
            </div>
          )
        })}
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
