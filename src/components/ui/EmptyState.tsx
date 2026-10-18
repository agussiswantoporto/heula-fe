/**
 * EmptyState (design Section 3). Friendly empty-state block with an optional
 * io5 icon and emoji-free copy.
 */
import { Icon } from "@/components/ui/Icon";
import type { IconKey } from "@/types";

export interface EmptyStateProps {
  icon?: IconKey;
  title: string;
  description?: string;
  action?: React.ReactNode;
}

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 px-6 py-16 text-center">
      {icon && (
        <span className="flex h-14 w-14 items-center justify-center rounded-pill bg-surface-2 text-content-muted">
          <Icon name={icon} size={28} />
        </span>
      )}
      <h2 className="text-base font-semibold text-content">{title}</h2>
      {description && (
        <p className="max-w-xs text-sm text-content-muted">{description}</p>
      )}
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}
