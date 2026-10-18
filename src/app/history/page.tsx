"use client";

/**
 * History route (design Section 3).
 *
 * Renders the live, grouped-by-day session list. The page is a thin client
 * host; the HistoryList owns the Dexie live query and empty/loading states.
 */
import { HistoryList } from "@/features/history/HistoryList";
import { copy } from "@/lib/copy";

export default function HistoryPage() {
  return (
    <div className="safe-top px-4 pt-8">
      <h1 className="text-[34px] font-bold leading-tight tracking-tight text-content">
        {copy.history.title}
      </h1>
      <div className="mt-6">
        <HistoryList />
      </div>
    </div>
  );
}
