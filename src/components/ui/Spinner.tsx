/**
 * Spinner (design Section 3). Minimal CSS loading indicator in the brand accent.
 */
import { cn } from "@/lib/cn";

export interface SpinnerProps {
  size?: number;
  className?: string;
  label?: string;
}

export function Spinner({ size = 24, className, label }: SpinnerProps) {
  return (
    <span
      role="status"
      aria-label={label ?? "Memuat"}
      className={cn("inline-block", className)}
      style={{ width: size, height: size }}
    >
      <span
        className="block animate-spin rounded-pill border-2 border-border border-t-brand"
        style={{ width: size, height: size }}
      />
    </span>
  );
}
