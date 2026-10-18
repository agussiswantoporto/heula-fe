import type { Metadata } from "next";

export const metadata: Metadata = { title: "Profil" };

/** Profile placeholder; settings and re-profiling arrive in a later FEAT. */
export default function ProfilePage() {
  return (
    <div className="px-4 pt-8">
      <h1 className="text-2xl font-bold text-content">Profil</h1>
      <p className="mt-2 text-sm text-content-muted">
        Pengaturan dan tujuan puasa kamu bakal tampil di sini.
      </p>
    </div>
  );
}
