"use client";

/**
 * AboutCard (design Section 3).
 *
 * Shows the app version and a short, emoji-free "about" blurb that reinforces
 * the on-device/offline nature of Heula. The version is a local constant kept
 * in step with package.json; icons go through the Icon choke point.
 */
import { Icon } from "@/components/ui/Icon";
import { copy } from "@/lib/copy";

/** Kept in step with package.json "version". */
const APP_VERSION = "0.1.0";

export function AboutCard() {
  return (
    <div className="flex items-start gap-3">
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-pill bg-surface-2 text-content-muted">
        <Icon name="about" size={22} />
      </span>
      <div className="min-w-0">
        <p className="text-sm font-semibold text-content">
          {copy.settings.about}
        </p>
        <p className="mt-0.5 text-xs text-content-muted">
          {copy.settings.aboutVersion} {APP_VERSION}
        </p>
        <p className="mt-2 text-sm text-content-muted">
          {copy.settings.aboutBody}
        </p>
      </div>
    </div>
  );
}
