import type { Metadata } from "next";

export const metadata: Metadata = { title: "Lagi offline" };

/**
 * Offline fallback (design Section 3/12.2). Precached by Serwist and served as
 * the document fallback when a navigation fails offline.
 */
export default function OfflinePage() {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-3 px-6 text-center">
      <h1 className="text-2xl font-bold tracking-tight text-content">
        Kamu lagi offline
      </h1>
      <p className="max-w-xs text-sm leading-relaxed text-content-muted">
        Koneksi kamu lagi putus. Tenang, data puasa kamu aman tersimpan di HP.
        Coba lagi kalau internet udah balik ya.
      </p>
    </div>
  );
}
