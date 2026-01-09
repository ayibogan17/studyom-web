import type { Metadata } from "next";
import { Inter, Inter_Tight } from "next/font/google";
import "./globals.css";
import { AppHeader } from "@/components/design-system/components/shared/app-header";
import { AppFooter } from "@/components/design-system/components/shared/app-footer";
import { ThemeProvider } from "@/components/design-system/providers/theme-provider";
import { AppToaster } from "@/components/design-system/components/shared/app-toaster";
import { AuthProvider } from "@/components/design-system/providers/auth-provider";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

const interTight = Inter_Tight({
  subsets: ["latin"],
  variable: "--font-display",
  display: "swap",
  weight: ["600", "700"],
});

export const metadata: Metadata = {
  title: "Studyom | Stüdyo keşif ve rezervasyon",
  description: "Studyom, Türkiye'de stüdyo arayan müzisyenler için hızlı keşif ve rezervasyon platformu.",
  metadataBase: new URL("https://studyom.net"),
  openGraph: {
    title: "Studyom",
    description: "Şehrindeki prova ve kayıt stüdyoları tek platformda.",
    url: "https://studyom.net",
    siteName: "Studyom",
    locale: "tr_TR",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Studyom",
    description: "Şehrindeki prova ve kayıt stüdyoları tek platformda.",
  },
  icons: {
    icon: [
      { url: "/icon.svg", type: "image/svg+xml" },
    ],
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="tr" className={`dark ${inter.variable} ${interTight.variable}`} suppressHydrationWarning>
      <body className="min-h-screen bg-[var(--color-secondary)] text-[var(--color-primary)] antialiased">
        <ThemeProvider>
          <AuthProvider>
            <div className="flex min-h-screen flex-col">
              <AppHeader />
              <main className="flex-1">{children}</main>
              <AppFooter />
            </div>
            <AppToaster />
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
