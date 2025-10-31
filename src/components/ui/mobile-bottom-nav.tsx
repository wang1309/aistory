"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { Home, Search, BookOpen, History, User } from "lucide-react"

interface NavItem {
  id: string
  label: string
  icon: React.ReactNode
  count?: number
  onClick: () => void
}

interface MobileBottomNavProps {
  items: NavItem[]
  activeId?: string
  className?: string
}

export function MobileBottomNav({
  items,
  activeId,
  className,
}: MobileBottomNavProps) {
  return (
    <div
      className={cn(
        "fixed bottom-0 left-0 right-0 z-50",
        "bg-background/95 backdrop-blur-md border-t border-border",
        "safe-area-pb", // for devices with home indicator
        "md:hidden",
        className
      )}
    >
      <div className="grid grid-cols-5 gap-1 p-2">
        {items.map((item) => {
          const isActive = item.id === activeId
          return (
            <Button
              key={item.id}
              variant="ghost"
              size="sm"
              onClick={item.onClick}
              className={cn(
                "h-14 flex flex-col items-center justify-center gap-1 relative",
                "transition-colors",
                isActive && "text-primary"
              )}
            >
              <div className="relative">
                {item.icon}
                {item.count && item.count > 0 && (
                  <Badge
                    variant="destructive"
                    className="absolute -top-2 -right-2 h-4 w-4 p-0 flex items-center justify-center text-[10px] font-bold"
                  >
                    {item.count > 99 ? "99+" : item.count}
                  </Badge>
                )}
              </div>
              <span
                className={cn(
                  "text-xs font-medium transition-colors",
                  isActive ? "text-primary" : "text-muted-foreground"
                )}
              >
                {item.label}
              </span>
              {isActive && (
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 bg-primary rounded-full" />
              )}
            </Button>
          )
        })}
      </div>
    </div>
  )
}

// Pre-defined navigation items
export const FANFIC_NAV_ITEMS: NavItem[] = [
  {
    id: "home",
    label: "首页",
    icon: <Home className="w-5 h-5" />,
    onClick: () => {
      window.scrollTo({ top: 0, behavior: "smooth" })
    },
  },
  {
    id: "search",
    label: "搜索",
    icon: <Search className="w-5 h-5" />,
    onClick: () => {
      // Open search drawer
    },
  },
  {
    id: "works",
    label: "作品",
    icon: <BookOpen className="w-5 h-5" />,
    onClick: () => {
      document.getElementById("works-section")?.scrollIntoView({ behavior: "smooth" })
    },
  },
  {
    id: "history",
    label: "历史",
    icon: <History className="w-5 h-5" />,
    count: 0, // Will be updated dynamically
    onClick: () => {
      // Open history drawer
    },
  },
  {
    id: "profile",
    label: "我的",
    icon: <User className="w-5 h-5" />,
    onClick: () => {
      // Open profile
    },
  },
]
