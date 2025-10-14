"use client";

import { memo, useMemo } from "react";
import { Avatar, AvatarImage } from "@/components/ui/avatar";
import { Star } from "lucide-react";

const HappyUsers = memo(function HappyUsers() {
  // Memoize arrays to prevent recreation on every render
  const avatarIndices = useMemo(() => Array.from({ length: 5 }), []);
  const starIndices = useMemo(() => Array.from({ length: 5 }), []);

  return (
    <div className="mx-auto mt-12 sm:mt-16 motion-safe:animate-in motion-safe:fade-in-0 motion-safe:slide-in-from-bottom-4 motion-safe:duration-700 motion-safe:delay-700">
      {/* Glassmorphic container */}
      <div className="inline-flex flex-col sm:flex-row items-center gap-4 sm:gap-6 rounded-2xl border border-border/40 bg-background/30 backdrop-blur-xl px-6 py-4 shadow-lg ring-1 ring-white/5">

        {/* Avatar stack with enhanced styling */}
        <div className="flex items-center -space-x-3">
          {avatarIndices.map((_, index) => (
            <Avatar
              className="size-12 sm:size-14 border-2 border-background shadow-md ring-2 ring-white/10 transition-transform hover:scale-110 hover:z-10"
              key={index}
            >
              <AvatarImage
                src={`/imgs/users/${index + 6}.png`}
                alt={`Happy user ${index + 1}`}
              />
            </Avatar>
          ))}
        </div>

        {/* Rating and text */}
        <div className="flex flex-col items-center sm:items-start gap-2">
          {/* Stars with glow effect */}
          <div className="flex items-center gap-1">
            {starIndices.map((_, index) => (
              <div key={index} className="relative">
                <Star className="size-5 fill-yellow-400 text-yellow-400 drop-shadow-[0_0_4px_rgba(250,204,21,0.5)]" />
              </div>
            ))}
          </div>

          {/* Text with better hierarchy */}
          <div className="flex flex-col sm:flex-row items-center gap-1.5">
            <p className="text-sm font-semibold text-foreground">
              from 999+ happy users
            </p>
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <span className="inline-block size-1.5 rounded-full bg-green-500 animate-pulse" />
              <span>Growing daily</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});

export default HappyUsers;
