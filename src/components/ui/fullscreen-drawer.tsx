"use client"

import { useState } from "react"
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
} from "@/components/ui/drawer"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import { Search, X } from "lucide-react"

interface DrawerOption {
  id: string
  label: string
  value: string
  icon?: React.ReactNode
  onClick: () => void
}

interface FullscreenDrawerProps {
  isOpen: boolean
  onClose: () => void
  title: string
  description?: string
  options: DrawerOption[]
  searchPlaceholder?: string
  onSearch?: (value: string) => void
  emptyMessage?: string
}

export function FullscreenDrawer({
  isOpen,
  onClose,
  title,
  description,
  options,
  searchPlaceholder = "搜索...",
  onSearch,
  emptyMessage = "没有找到相关内容",
}: FullscreenDrawerProps) {
  const [searchValue, setSearchValue] = useState("")

  const handleSearch = (value: string) => {
    setSearchValue(value)
    onSearch?.(value)
  }

  const filteredOptions = options.filter((option) =>
    option.label.toLowerCase().includes(searchValue.toLowerCase())
  )

  return (
    <Drawer open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DrawerContent className="h-[100svh] p-0">
        <DrawerHeader className="p-6 border-b">
          <div className="flex items-center justify-between mb-4">
            <div>
              <DrawerTitle>{title}</DrawerTitle>
              {description && (
                <DrawerDescription>{description}</DrawerDescription>
              )}
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="h-8 w-8"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>

          {onSearch && (
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder={searchPlaceholder}
                value={searchValue}
                onChange={(e) => handleSearch(e.target.value)}
                className="pl-10 h-11"
                autoFocus
              />
            </div>
          )}
        </DrawerHeader>

        <div className="flex-1 overflow-y-auto">
          {filteredOptions.length > 0 ? (
            <div className="p-4 space-y-2">
              {filteredOptions.map((option) => (
                <Button
                  key={option.id}
                  variant="ghost"
                  className={cn(
                    "w-full h-auto p-4 justify-start",
                    "hover:bg-primary/10 hover:text-primary",
                    "transition-colors"
                  )}
                  onClick={() => {
                    option.onClick()
                    onClose()
                  }}
                >
                  <div className="flex items-center gap-3 w-full">
                    {option.icon && (
                      <span className="text-xl">{option.icon}</span>
                    )}
                    <span className="flex-1 text-left font-medium">
                      {option.label}
                    </span>
                  </div>
                </Button>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-center p-8">
              <Search className="w-12 h-12 text-muted-foreground/30 mb-4" />
              <p className="text-muted-foreground">{emptyMessage}</p>
            </div>
          )}
        </div>
      </DrawerContent>
    </Drawer>
  )
}
