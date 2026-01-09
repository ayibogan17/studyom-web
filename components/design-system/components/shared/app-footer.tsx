import Link from "next/link";

export function AppFooter() {
  const year = new Date().getFullYear();
  return (
    <footer className="border-t border-[var(--color-border)] bg-[var(--color-surface)]">
      <div className="mx-auto flex max-w-7xl flex-col gap-4 px-6 py-8 text-sm text-[var(--color-primary)] md:flex-row md:items-center md:justify-between">
        <div>
          <p className="font-semibold">Studyom</p>
          <p className="text-[var(--color-muted)]">Şehrindeki prova ve kayıt stüdyoları tek platformda.</p>
        </div>
        <div className="flex flex-wrap gap-4 text-[var(--color-primary)]">
          <Link href="/hakkinda" className="hover:text-[var(--color-accent)]">
            Hakkında
          </Link>
          <Link href="/iletisim" className="hover:text-[var(--color-accent)]">
            İletişim
          </Link>
          <Link href="/gizlilik" className="hover:text-[var(--color-accent)]">
            Gizlilik
          </Link>
        </div>
        <p className="text-[var(--color-muted)]">© {year} Studyom</p>
      </div>
    </footer>
  );
}
