/**
 * Card (design Section 3). Rounded surface with a soft shadow.
 */
import { cn } from "@/lib/cn";

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  as?: "div" | "section" | "article";
}

export function Card({ as: Tag = "div", className, children, ...rest }: CardProps) {
  return (
    <Tag
      className={cn(
        "rounded-card border border-border bg-surface p-4 shadow-card",
        className,
      )}
      {...rest}
    >
      {children}
    </Tag>
  );
}
