import type { Metadata } from "next";

export const metadata: Metadata = { title: "Riwayat" };

/** History placeholder; the live-query list arrives in a later FEAT. */
export default function HistoryPage() {
  return (
    <div className="px-4 pt-8">
      <h1 className="text-2xl font-bold text-content">Riwayat</h1>
      <p className="mt-2 text-sm text-content-muted">
        Catatan puasa kamu bakal tampil di sini.
      </p>
    </div>
  );
}
