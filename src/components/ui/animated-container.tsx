"use client"

import { cn } from "@/lib/utils"
import { motion, MotionProps } from "framer-motion"
import React from "react"

type AnimationVariant =
  | "fadeIn"
  | "slideUp"
  | "slideDown"
  | "slideLeft"
  | "slideRight"
  | "scale"
  | "bounce"

interface AnimatedContainerProps extends Omit<MotionProps, "children"> {
  children: React.ReactNode
  variant?: AnimationVariant
  delay?: number
  duration?: number
  className?: string
}

const animations = {
  fadeIn: {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    transition: { duration: 0.5 },
  },
  slideUp: {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.5, ease: "easeOut" },
  },
  slideDown: {
    initial: { opacity: 0, y: -20 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.5, ease: "easeOut" },
  },
  slideLeft: {
    initial: { opacity: 0, x: 20 },
    animate: { opacity: 1, x: 0 },
    transition: { duration: 0.5, ease: "easeOut" },
  },
  slideRight: {
    initial: { opacity: 0, x: -20 },
    animate: { opacity: 1, x: 0 },
    transition: { duration: 0.5, ease: "easeOut" },
  },
  scale: {
    initial: { opacity: 0, scale: 0.95 },
    animate: { opacity: 1, scale: 1 },
    transition: { duration: 0.3, ease: "easeOut" },
  },
  bounce: {
    initial: { opacity: 0, y: -10 },
    animate: { opacity: 1, y: 0 },
    transition: { type: "spring", stiffness: 300, damping: 20 },
  },
}

export function AnimatedContainer({
  children,
  variant = "fadeIn",
  delay = 0,
  duration,
  className,
  ...props
}: AnimatedContainerProps) {
  const animation = animations[variant]

  return (
    <motion.div
      className={cn(className)}
      initial={animation.initial}
      animate={animation.animate}
      transition={{
        ...animation.transition,
        delay,
        ...(duration && { duration }),
      }}
      {...props}
    >
      {children}
    </motion.div>
  )
}
