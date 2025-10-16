"use client";
import Image from "next/image";
import { useState } from "react";
import { cn } from "@/lib/utils";

interface OptimizedImageProps {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  className?: string;
  priority?: boolean;
  fill?: boolean;
  sizes?: string;
  quality?: number;
  style?: React.CSSProperties;
}

export default function OptimizedImage({
  src,
  alt,
  width,
  height,
  className,
  priority = false,
  fill = false,
  sizes = "(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw",
  quality = 85,
  style,
}: OptimizedImageProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(false);

  // 优化alt属性，确保SEO友好
  const optimizedAlt = alt ||
    (src.includes('story') ? 'AI Story Generator - Creative writing tool illustration' :
     src.includes('feature') ? 'AI Story Generator feature showcase' :
     src.includes('user') ? 'AI Story Generator user testimonial' :
     src.includes('showcase') ? 'AI Story Generator example showcase' :
     'AI Story Generator illustration');

  // 如果图片加载失败，回退到标准img标签
  if (error) {
    return (
      <div className={cn("relative overflow-hidden", className)} style={style}>
        <img
          src={src}
          alt={optimizedAlt}
          className={cn("w-full h-full object-cover", className)}
          onError={() => console.log('Image failed to load:', src)}
        />
      </div>
    );
  }

  // 对于fill模式，确保父容器有正确的高度
  const containerStyle = fill ? {
    ...style,
    minHeight: '200px'
  } : style;

  return (
    <div className={cn(
      "relative overflow-hidden",
      isLoading && "bg-muted animate-pulse",
      className
    )} style={containerStyle}>
      <Image
        src={src}
        alt={optimizedAlt}
        width={width}
        height={height}
        fill={fill}
        sizes={sizes}
        quality={quality}
        priority={priority}
        className={cn(
          "duration-700 ease-in-out",
          isLoading ? "scale-110 blur-2xl grayscale" : "scale-100 blur-0 grayscale-0",
          fill ? "object-cover" : "",
          className
        )}
        style={fill ? { objectFit: 'cover' } : undefined}
        onLoad={() => setIsLoading(false)}
        onError={() => {
          console.log('OptimizedImage failed to load:', src);
          setError(true);
        }}
      />
    </div>
  );
}