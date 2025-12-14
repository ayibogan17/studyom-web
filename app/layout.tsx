import type { Metadata } from "next";
import Link from "next/link";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Studyom | Stüdyo keşif ve rezervasyon",
  description:
    "Studyom, Türkiye'de stüdyo arayan müzisyenler için hızlı keşif ve rezervasyon platformu.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="tr">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-[#2C2C2C] text-white`}
      >
        <div className="flex min-h-screen flex-col">
          <header className="border-b border-white/10 bg-[#2C2C2C] backdrop-blur">
            <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
              <Link href="/" className="text-lg font-bold tracking-tight text-white">
                Studyom
              </Link>
              <nav className="flex items-center gap-4 text-sm font-medium text-white">
                <Link
                  href="/studios"
                  className="transition hover:text-[#2D9CDB] hover:underline"
                >
                  Stüdyolar
                </Link>
                <Link
                  href="/#lead-form"
                  className="transition hover:text-[#2D9CDB] hover:underline"
                >
                  Teklif al
                </Link>
                <Link
                  href="/login"
                  className="rounded-full border border-white/20 px-4 py-2 text-sm font-semibold text-white transition hover:border-[#2D9CDB] hover:text-[#2D9CDB]"
                >
                  Giriş Yap
                </Link>
                <Link
                  href="/studio-login"
                  className="rounded-full border border-white/20 px-4 py-2 text-sm font-semibold text-white transition hover:border-[#2D9CDB] hover:text-[#2D9CDB]"
                >
                  Stüdyo Sahipleri
                </Link>
              </nav>
            </div>
          </header>

          <main className="flex-1">{children}</main>

          <footer className="border-t border-white/10 bg-[#2C2C2C] backdrop-blur">
            <div className="mx-auto flex max-w-6xl flex-col gap-3 px-6 py-6 text-sm text-gray-200 sm:flex-row sm:items-center sm:justify-between">
              <span>© {new Date().getFullYear()} Studyom</span>
              <div className="flex items-center gap-4">
                <a
                  href="mailto:info@studyom.net"
                  className="transition hover:text-[#2D9CDB] hover:underline"
                >
                  info@studyom.net
                </a>
                <Link
                  href="/studios"
                  className="transition hover:text-[#2D9CDB] hover:underline"
                >
                  Stüdyolar
                </Link>
              </div>
            </div>
          </footer>
        </div>
      </body>
    </html>
  );
}
