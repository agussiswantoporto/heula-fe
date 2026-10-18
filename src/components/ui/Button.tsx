"use client";

/**
 * Button (design Section 3). Variants: primary / secondary / ghost / destructive.
 * Large touch targets (min-height 48px) for comfortable mobile tapping.
 */
import { motion, type HTMLMotionProps } from "motion/react";
import { cn } from "@/lib/cn";

export type ButtonVariant = "primary" | "secondary" | "ghost" | "destructive";

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  fullWidth?: boolean;
}

const VARIANT_CLASS: Record<ButtonVariant, string> = {
  primary: "bg-brand text-brand-fg active:opacity-90",
  secondary: "bg-surface-2 text-content active:opacity-80",
  ghost: "bg-transparent text-content active:bg-surface-2",
  destructive: "bg-danger text-white active:opacity-90",
};

export function Button({
  variant = "primary",
  fullWidth = false,
  className,
  children,
  type = "button",
  ...rest
}: ButtonProps) {
  // A handful of native DOM handlers (onAnimationStart/End, onDrag*) collide
  // with motion's gesture/animation prop signatures. They are not used by
  // callers, so cast rest to the motion-compatible shape for the spread while
  // keeping the public ButtonProps type unchanged.
  const motionRest = rest as HTMLMotionProps<"button">;
  return (
    <motion.button
      type={type}
      whileTap={{ scale: 0.97 }}
      transition={{ type: "spring", stiffness: 500, damping: 30 }}
      className={cn(
        "inline-flex min-h-12 items-center justify-center gap-2 rounded-pill px-5 text-base font-semibold transition-opacity disabled:cursor-not-allowed disabled:opacity-40",
        VARIANT_CLASS[variant],
        fullWidth && "w-full",
        className,
      )}
      {...motionRest}
    >
      {children}
    </motion.button>
  );
}
