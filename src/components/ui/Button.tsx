/**
 * Button (design Section 3). Variants: primary / secondary / ghost / destructive.
 * Large touch targets (min-height 48px) for comfortable mobile tapping.
 */
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
  return (
    <button
      type={type}
      className={cn(
        "inline-flex min-h-12 items-center justify-center gap-2 rounded-pill px-5 text-base font-semibold transition-opacity disabled:cursor-not-allowed disabled:opacity-40",
        VARIANT_CLASS[variant],
        fullWidth && "w-full",
        className,
      )}
      {...rest}
    >
      {children}
    </button>
  );
}
