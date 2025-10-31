"use client"

import { useState, useEffect } from "react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { ArrowUp } from "lucide-react"

interface StickyCTAProps {
  children: React.ReactNode
  className?: string
  showAfterScroll?: number
}

export function StickyCTA({
  children,
  className,
  showAfterScroll = 400,
}: StickyCTAProps) {
  const [isVisible, setIsVisible] = useState(false)
  const [atBottom, setAtBottom] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      const scrolled = window.scrollY
      setIsVisible(scrolled > showAfterScroll)

      // Check if near bottom
      const windowHeight = window.innerHeight
      const documentHeight = document.documentElement.scrollHeight
      const scrollTop = window.scrollY
      setAtBottom(scrollTop + windowHeight >= documentHeight - 100)
    }

    window.addEventListener("scroll", handleScroll)
    handleScroll() // Initial check

    return () => window.removeEventListener("scroll", handleScroll)
  }, [showAfterScroll])

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  if (!isVisible) return null

  return (
    <>
      {/* Mobile Sticky Bar */}
      <div
        className={cn(
          "fixed bottom-0 left-0 right-0 z-50 md:hidden",
          "bg-background/95 backdrop-blur-md border-t border-border",
          "p-4 shadow-2xl",
          atBottom ? "translate-y-0" : "translate-y-0",
          "transition-transform duration-300"
        )}
      >
        <Button
          onClick={scrollToTop}
          className={cn(
            "w-full h-12 text-base font-medium",
            "bg-gradient-to-r from-primary to-blue-500 hover:from-primary/90 hover:to-blue-600",
            "shadow-medium",
            className
          )}
        >
          {children}
        </Button>
      </div>

      {/* Desktop Floating Button */}
      <Button
        onClick={scrollToTop}
        className={cn(
          "hidden md:flex fixed bottom-8 right-8 z-50",
          "h-12 px-6 gap-2",
          "bg-gradient-to-r from-primary to-blue-500 hover:from-primary/90 hover:to-blue-600",
          "shadow-card-hover hover:shadow-elevated",
          "transform hover:scale-105 transition-all duration-200",
          className
        )}
        size="lg"
      >
        <ArrowUp className="w-5 h-5" />
        {children}
      </Button>
    </>
  )
}
