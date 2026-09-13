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
      <div className="inline-flex flex-col sm:flex-row items-center gap-3 sm:gap-4">

        {/* Avatar stack */}
        <div className="flex items-center -space-x-2.5">
          {avatarIndices.map((_, index) => (
            <Avatar
              className="size-9 sm:size-10 border-2 border-card"
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
        <div className="flex flex-col items-center sm:items-start gap-1">
          <div className="flex items-center gap-0.5">
            {starIndices.map((_, index) => (
              <Star key={index} className="size-3.5 fill-amber-400 text-amber-400" />
            ))}
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-1 sm:gap-1.5">
            <p className="text-sm font-medium text-foreground">
              from 999+ happy users
            </p>
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <span className="inline-block size-1.5 rounded-full bg-green-500" />
              <span>Growing daily</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});

export default HappyUsers;
