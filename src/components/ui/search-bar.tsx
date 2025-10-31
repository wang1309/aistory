"use client"

import { useState, useRef, useEffect } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { ModernCard } from "@/components/ui/modern-card"
import { AnimatedContainer } from "@/components/ui/animated-container"
import { Search, X, Clock, TrendingUp } from "lucide-react"
import { cn } from "@/lib/utils"

interface SearchResult {
  id: string
  title: string
  type: "work" | "pairing" | "character"
  icon: string
  category?: string
  popularity?: number
}

interface SearchBarProps {
  onSearch: (query: string) => SearchResult[]
  onSelect: (result: SearchResult) => void
  placeholder?: string
  className?: string
}

export function SearchBar({
  onSearch,
  onSelect,
  placeholder = "搜索作品、角色或配对...",
  className,
}: SearchBarProps) {
  const [query, setQuery] = useState("")
  const [isOpen, setIsOpen] = useState(false)
  const [results, setResults] = useState<SearchResult[]>([])
  const [recentSearches] = useState<string[]>(["哈利波特", "咒术回战", "原神"])
  const [popularSearches] = useState<string[]>(["鬼灭之刃", "进击的巨人", "原神"])
  const inputRef = useRef<HTMLInputElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const handleSearch = (value: string) => {
    setQuery(value)
    if (value.trim().length > 0) {
      const searchResults = onSearch(value)
      setResults(searchResults)
      setIsOpen(true)
    } else {
      setResults([])
      setIsOpen(true)
    }
  }

  const handleSelect = (result: SearchResult) => {
    onSelect(result)
    setQuery("")
    setIsOpen(false)
  }

  const clearSearch = () => {
    setQuery("")
    setResults([])
    inputRef.current?.focus()
  }

  return (
    <div ref={containerRef} className={cn("relative", className)}>
      {/* Search Input */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          ref={inputRef}
          placeholder={placeholder}
          value={query}
          onChange={(e) => handleSearch(e.target.value)}
          onFocus={() => setIsOpen(true)}
          className={cn(
            "pl-10 pr-10 h-12",
            "text-base", // Prevent zoom on iOS
            "transition-all duration-200"
          )}
        />
        {query && (
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-2 top-1/2 -translate-y-1/2 h-6 w-6"
            onClick={clearSearch}
          >
            <X className="w-4 h-4" />
          </Button>
        )}
      </div>

      {/* Search Results Dropdown */}
      {isOpen && (
        <AnimatedContainer variant="scale" className="absolute top-full mt-2 w-full z-50">
          <ModernCard variant="elevated" className="max-h-[400px] overflow-y-auto">
            {query && results.length > 0 ? (
              <div className="p-2">
                <div className="text-xs font-semibold text-muted-foreground px-3 py-2">
                  搜索结果
                </div>
                {results.map((result) => (
                  <Button
                    key={result.id}
                    variant="ghost"
                    className={cn(
                      "w-full justify-start h-auto p-3",
                      "hover:bg-primary/10 hover:text-primary",
                      "transition-colors"
                    )}
                    onClick={() => handleSelect(result)}
                  >
                    <div className="flex items-center gap-3 w-full">
                      <span className="text-xl">{result.icon}</span>
                      <div className="flex-1 text-left">
                        <div className="font-medium">{result.title}</div>
                        <div className="text-xs text-muted-foreground flex items-center gap-2">
                          <span>
                            {result.type === "work" ? "作品" :
                             result.type === "pairing" ? "配对" : "角色"}
                          </span>
                          {result.category && (
                            <>
                              <span>•</span>
                              <span>{result.category}</span>
                            </>
                          )}
                        </div>
                      </div>
                      {result.popularity && (
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <TrendingUp className="w-3 h-3" />
                          <span>{(result.popularity / 10).toFixed(1)}</span>
                        </div>
                      )}
                    </div>
                  </Button>
                ))}
              </div>
            ) : query && results.length === 0 ? (
              <div className="p-8 text-center">
                <Search className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
                <p className="text-muted-foreground">没有找到相关结果</p>
                <p className="text-sm text-muted-foreground mt-1">
                  尝试使用其他关键词
                </p>
              </div>
            ) : (
              <div className="p-2">
                {/* Recent Searches */}
                <div className="space-y-1">
                  <div className="text-xs font-semibold text-muted-foreground px-3 py-2 flex items-center gap-2">
                    <Clock className="w-3 h-3" />
                    最近搜索
                  </div>
                  {recentSearches.map((search, index) => (
                    <Button
                      key={index}
                      variant="ghost"
                      className="w-full justify-start h-auto p-2 text-sm text-muted-foreground hover:text-foreground"
                      onClick={() => handleSearch(search)}
                    >
                      <span className="mr-2">⏱</span>
                      {search}
                    </Button>
                  ))}
                </div>

                <div className="border-t my-3" />

                {/* Popular Searches */}
                <div className="space-y-1">
                  <div className="text-xs font-semibold text-muted-foreground px-3 py-2 flex items-center gap-2">
                    <TrendingUp className="w-3 h-3" />
                    热门搜索
                  </div>
                  {popularSearches.map((search, index) => (
                    <Button
                      key={index}
                      variant="ghost"
                      className="w-full justify-start h-auto p-2 text-sm text-muted-foreground hover:text-foreground"
                      onClick={() => handleSearch(search)}
                    >
                      <span className="mr-2">🔥</span>
                      {search}
                    </Button>
                  ))}
                </div>
              </div>
            )}
          </ModernCard>
        </AnimatedContainer>
      )}
    </div>
  )
}
