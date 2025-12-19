import type { Metadata } from "next";
import Link from "next/link";
import { requireAdmin } from "@/lib/admin";
import { Card } from "@/components/design-system/components/ui/card";

export const metadata: Metadata = {
  title: "Admin | Studyom",
  description: "Studyom iç yönetim paneli",
  robots: { index: false, follow: false },
};

const navItems = [
  { href: "/admin/applications", label: "Başvurular" },
  { href: "/admin", label: "Özet" },
  { href: "/admin/studios", label: "Stüdyolar" },
  { href: "/admin/users", label: "Kullanıcılar" },
  { href: "/admin/teachers", label: "Hocalar" },
  { href: "/admin/leads", label: "Lead'ler" },
];

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const admin = await requireAdmin();

  return (
    <div className="min-h-screen bg-[var(--color-secondary)] text-[var(--color-primary)]">
      <div className="mx-auto flex max-w-7xl gap-6 px-6 py-8">
        <Card className="hidden w-56 flex-shrink-0 space-y-4 p-4 md:block">
          <div className="space-y-1">
            <p className="text-xs uppercase tracking-[0.2em] text-[var(--color-muted)]">Admin</p>
            <p className="text-sm font-semibold">{admin.email}</p>
          </div>
          <div className="h-px w-full bg-[var(--color-border)]" />
          <nav className="space-y-2 text-sm">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="block rounded-xl px-3 py-2 transition hover:bg-[var(--color-secondary)]"
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </Card>
        <main className="flex-1">
          {children}
        </main>
      </div>
    </div>
  );
}
