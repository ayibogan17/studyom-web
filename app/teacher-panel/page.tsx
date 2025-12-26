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
import { TeacherGalleryClient } from "./teacher-gallery-client";
import { TeacherProfileEditor } from "./teacher-profile-editor";
import { TeacherStudioLinksClient } from "./teacher-studio-links-client";

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
  galleryUrls?: string[];
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
  const links = normalizeArray(data.links).slice(0, 3);
  const galleryUrls = normalizeArray(data.galleryUrls).slice(0, 5);
  const city = typeof data.city === "string" ? data.city : dbUser.city || null;
  const price = typeof data.price === "string" && data.price.trim() ? data.price : "";
  const statement = typeof data.statement === "string" && data.statement.trim() ? data.statement.trim() : "";
  const years = typeof data.years === "string" && data.years.trim() ? data.years : "";
  const students = typeof data.students === "string" && data.students.trim() ? data.students : "";

  const studioLinks = await prisma.teacherStudioLink.findMany({
    where: { teacherUserId: dbUser.id },
    include: { studio: { select: { id: true, name: true, city: true, district: true } } },
    orderBy: { createdAt: "desc" },
  });
  const studioLinkItems = studioLinks.map((link) => ({
    id: link.id,
    status: link.status as "pending" | "approved" | "rejected",
    createdAt: link.createdAt.toISOString(),
    studio: link.studio,
  }));

  return (
    <main className="bg-[var(--color-secondary)] pb-16 pt-10">
      <Section containerClassName="max-w-5xl space-y-6">
        <header className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--color-muted)]">Panel</p>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h1 className="text-3xl font-semibold text-[var(--color-primary)]">Hoca Paneli</h1>
            <Button asChild size="sm" variant="secondary">
              <Link href="/teacher-panel/messages">Mesajlar</Link>
            </Button>
          </div>
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
            <div className="flex items-center gap-3">
              {dbUser.image && (
                <div className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-full border border-[var(--color-border)] bg-[var(--color-secondary)]">
                  <img src={dbUser.image} alt="Profil fotoğrafı" className="h-full w-full object-cover" />
                </div>
              )}
              <Badge variant="default">Onaylandı</Badge>
            </div>
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

        <TeacherProfileEditor
          initial={{
            instruments,
            levels,
            formats,
            city: city || "",
            languages,
            price,
            statement,
            links,
            years,
            students,
          }}
        />

        <TeacherStudioLinksClient initialLinks={studioLinkItems} />

        <TeacherGalleryClient initialUrls={galleryUrls} />
      </Section>
    </main>
  );
}
