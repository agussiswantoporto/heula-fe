import type { Metadata } from "next";

export const metadata: Metadata = { title: "Statistik" };

/** Stats placeholder; overview + weekly chart arrive in a later FEAT. */
export default function StatsPage() {
  return (
    <div className="px-4 pt-8">
      <h1 className="text-2xl font-bold text-content">Statistik</h1>
      <p className="mt-2 text-sm text-content-muted">
        Streak dan ringkasan progres kamu bakal tampil di sini.
      </p>
    </div>
  );
}
