import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/auth";
import { prisma } from "@/lib/prisma";
import { Section } from "@/components/design-system/components/shared/section";
import { Card } from "@/components/design-system/components/ui/card";
import { Badge } from "@/components/design-system/components/ui/badge";
import { Button } from "@/components/design-system/components/ui/button";

export const metadata: Metadata = {
  title: "Hoca Paneli | Stüdyom",
  description: "Onaylanan hoca başvurunun özetini görüntüleyin.",
};

type TeacherApplicationData = {
  instruments?: string[];
  levels?: string[];
  formats?: string[];
  city?: string | null;
  languages?: string[];
  price?: string | null;
  statement?: string | null;
  links?: string[];
  years?: string | null;
  students?: string | null;
};

function formatDate(value?: Date | string | null) {
  if (!value) return "—";
  const date = typeof value === "string" ? new Date(value) : value;
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString("tr-TR", { year: "numeric", month: "long", day: "numeric" });
}

function normalizeArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is string => typeof item === "string" && item.trim().length > 0);
}

function isHttpUrl(value: string) {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

export default async function TeacherPanelPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    redirect("/login");
  }

  const sessionUser = session.user as { id?: string; email?: string | null };
  const dbUser =
    sessionUser.id
      ? await prisma.user.findUnique({ where: { id: sessionUser.id } })
      : sessionUser.email
        ? await prisma.user.findUnique({ where: { email: sessionUser.email.toLowerCase() } })
        : null;

  if (!dbUser) {
    redirect("/login");
  }

  const application = await prisma.teacherApplication.findFirst({
    where: { userId: dbUser.id, status: "approved" },
    orderBy: { createdAt: "desc" },
  });

  if (!application) {
    redirect("/profile");
  }

  const data = (application.data || {}) as TeacherApplicationData;
  const instruments = normalizeArray(data.instruments);
  const levels = normalizeArray(data.levels);
  const formats = normalizeArray(data.formats);
  const languages = normalizeArray(data.languages);
  const links = normalizeArray(data.links).filter(isHttpUrl);
  const city = typeof data.city === "string" ? data.city : dbUser.city || null;
  const price = typeof data.price === "string" && data.price.trim() ? data.price : "Belirtilmedi";
  const statement =
    typeof data.statement === "string" && data.statement.trim() ? data.statement.trim() : "Belirtilmedi";
  const years = typeof data.years === "string" && data.years.trim() ? data.years : "Belirtilmedi";
  const students =
    typeof data.students === "string" && data.students.trim() ? data.students : "Belirtilmedi";

  return (
    <main className="bg-[var(--color-secondary)] pb-16 pt-10">
      <Section containerClassName="max-w-5xl space-y-6">
        <header className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--color-muted)]">Panel</p>
          <h1 className="text-3xl font-semibold text-[var(--color-primary)]">Hoca Paneli</h1>
          <p className="text-sm text-[var(--color-muted)]">
            Onaylanan başvurunda paylaştığın bilgiler aşağıdadır. Güncellemeler için destek ekibimizle
            iletişime geçebilirsin.
          </p>
        </header>

        <Card className="space-y-4 p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-[var(--color-primary)]">Başvuru durumu</p>
              <p className="text-xs text-[var(--color-muted)]">Onay tarihi: {formatDate(application.createdAt)}</p>
            </div>
            <Badge variant="default">Onaylandı</Badge>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
              <p className="text-sm font-semibold text-[var(--color-primary)]">Ad Soyad</p>
              <p className="text-sm text-[var(--color-primary)]">{dbUser.fullName || dbUser.name || "—"}</p>
            </div>
            <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
              <p className="text-sm font-semibold text-[var(--color-primary)]">E-posta</p>
              <p className="text-sm text-[var(--color-primary)]">{dbUser.email}</p>
            </div>
          </div>
        </Card>

        <Card className="space-y-4 p-6">
          <p className="text-sm font-semibold text-[var(--color-primary)]">Öğretim bilgileri</p>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <p className="text-sm font-semibold text-[var(--color-primary)]">Alanlar</p>
              <div className="flex flex-wrap gap-2">
                {instruments.length ? (
                  instruments.map((item) => (
                    <Badge key={item} variant="outline">
                      {item}
                    </Badge>
                  ))
                ) : (
                  <span className="text-sm text-[var(--color-muted)]">Belirtilmedi</span>
                )}
              </div>
            </div>
            <div className="space-y-2">
              <p className="text-sm font-semibold text-[var(--color-primary)]">Seviyeler</p>
              <div className="flex flex-wrap gap-2">
                {levels.length ? (
                  levels.map((item) => (
                    <Badge key={item} variant="outline">
                      {item}
                    </Badge>
                  ))
                ) : (
                  <span className="text-sm text-[var(--color-muted)]">Belirtilmedi</span>
                )}
              </div>
            </div>
            <div className="space-y-2">
              <p className="text-sm font-semibold text-[var(--color-primary)]">Format</p>
              <div className="flex flex-wrap gap-2">
                {formats.length ? (
                  formats.map((item) => (
                    <Badge key={item} variant="outline">
                      {item}
                    </Badge>
                  ))
                ) : (
                  <span className="text-sm text-[var(--color-muted)]">Belirtilmedi</span>
                )}
              </div>
            </div>
            <div className="space-y-2">
              <p className="text-sm font-semibold text-[var(--color-primary)]">Şehir</p>
              <p className="text-sm text-[var(--color-primary)]">{city || "Belirtilmedi"}</p>
            </div>
            <div className="space-y-2">
              <p className="text-sm font-semibold text-[var(--color-primary)]">Ders dili</p>
              <div className="flex flex-wrap gap-2">
                {languages.length ? (
                  languages.map((item) => (
                    <Badge key={item} variant="outline">
                      {item}
                    </Badge>
                  ))
                ) : (
                  <span className="text-sm text-[var(--color-muted)]">Belirtilmedi</span>
                )}
              </div>
            </div>
            <div className="space-y-2">
              <p className="text-sm font-semibold text-[var(--color-primary)]">Ücret beklentisi</p>
              <p className="text-sm text-[var(--color-primary)]">{price}</p>
            </div>
            <div className="space-y-2">
              <p className="text-sm font-semibold text-[var(--color-primary)]">Tecrübe (yıl)</p>
              <p className="text-sm text-[var(--color-primary)]">{years}</p>
            </div>
            <div className="space-y-2">
              <p className="text-sm font-semibold text-[var(--color-primary)]">Öğrenci deneyimi</p>
              <p className="text-sm text-[var(--color-primary)]">{students}</p>
            </div>
          </div>
        </Card>

        <Card className="space-y-3 p-6">
          <p className="text-sm font-semibold text-[var(--color-primary)]">Kısa açıklama</p>
          <p className="text-sm text-[var(--color-primary)]">{statement}</p>
        </Card>

        <Card className="space-y-3 p-6">
          <div className="flex items-center justify-between gap-2">
            <p className="text-sm font-semibold text-[var(--color-primary)]">Bağlantılar</p>
            <Button asChild size="sm" variant="secondary">
              <Link href="/profile">Profilime dön</Link>
            </Button>
          </div>
          {links.length ? (
            <div className="space-y-2">
              {links.map((link) => (
                <a
                  key={link}
                  href={link}
                  target="_blank"
                  rel="noreferrer"
                  className="block rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-sm text-[var(--color-primary)] hover:border-[var(--color-accent)]"
                >
                  {link}
                </a>
              ))}
            </div>
          ) : (
            <p className="text-sm text-[var(--color-muted)]">Belirtilmedi</p>
          )}
        </Card>
      </Section>
    </main>
  );
}
