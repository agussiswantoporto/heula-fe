import type { Metadata, Viewport } from "next";
import "@/app/globals.css";
import { ToastProvider } from "@/components/ui/ToastProvider";
import { ThemeProvider } from "@/components/layout/ThemeProvider";
import { AppShell } from "@/components/layout/AppShell";
import { BottomTabBar } from "@/components/layout/BottomTabBar";

export const metadata: Metadata = {
  applicationName: "Heula",
  title: {
    default: "Heula",
    template: "%s - Heula",
  },
  description:
    "Teman puasa kamu buat atur jadwal intermittent fasting dan pantau progres, langsung dari HP.",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Heula",
  },
  icons: {
    icon: "/icons/icon-192.png",
    apple: "/icons/apple-touch-icon.png",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f7f8f8" },
    { media: "(prefers-color-scheme: dark)", color: "#0b0d0e" },
  ],
};

// Exact anti-flash script (design Section 13): parse the heula-store envelope,
// read state.theme, resolve "system" via matchMedia, toggle the dark class.
const ANTI_FLASH = `try {
  var raw = localStorage.getItem('heula-store');
  var theme = raw ? (JSON.parse(raw).state || {}).theme : 'system';
  var dark = theme === 'dark' ||
    (theme !== 'light' && matchMedia('(prefers-color-scheme: dark)').matches);
  document.documentElement.classList.toggle('dark', dark);
} catch (e) {}`;

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: ANTI_FLASH }} />
      </head>
      <body>
        <ThemeProvider>
          <ToastProvider>
            <AppShell>{children}</AppShell>
            <BottomTabBar />
          </ToastProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
