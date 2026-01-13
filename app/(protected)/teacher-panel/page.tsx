import type { Metadata } from "next";
import { Suspense } from "react";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/auth";
import { prisma } from "@/lib/prisma";
import { Section } from "@/components/design-system/components/shared/section";
import { Badge } from "@/components/design-system/components/ui/badge";
import { TeacherGalleryClient } from "./teacher-gallery-client";
import { TeacherProfileEditor } from "./teacher-profile-editor";
import { TeacherWhatsAppSettings } from "./teacher-whatsapp-settings";
import { TeacherPanelSection } from "./teacher-panel-section";
import { TeacherMessageSection } from "./teacher-message-section";
import { TeacherStudioLinksSection } from "./teacher-studio-links-section";

export const metadata: Metadata = {
  title: "Hoca Paneli | Studyom",
  description: "Onaylanan hoca başvurunun özetini görüntüleyin.",
  robots: { index: false, follow: false },
};

type TeacherApplicationData = {
  instruments?: string[];
  levels?: string[];
  formats?: string[];
  city?: string | null;
  languages?: string[];
  price?: string | null;
  statement?: string | null;
  bio?: string | null;
  links?: string[];
  galleryUrls?: string[];
  years?: string | null;
  students?: string | null;
  whatsappNumber?: string | null;
  whatsappEnabled?: boolean | null;
  studyomStudents?: { id?: string; name?: string; addedAt?: string; image?: string | null }[];
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

type StudyomStudent = { id: string; name: string; addedAt?: string; image?: string | null };

function normalizeStudents(value: unknown): StudyomStudent[] {
  if (!Array.isArray(value)) return [];
  const list: StudyomStudent[] = [];
  for (const item of value) {
    if (!item || typeof item !== "object") continue;
    const record = item as { id?: unknown; name?: unknown; addedAt?: unknown };
    if (typeof record.id !== "string" || typeof record.name !== "string") continue;
    list.push({
      id: record.id,
      name: record.name.trim(),
      addedAt: typeof record.addedAt === "string" ? record.addedAt : undefined,
      image:
        typeof (record as { image?: unknown }).image === "string"
          ? (record as { image?: string }).image
          : null,
    });
  }
  return list;
}

function initials(value: string) {
  const parts = value
    .split(" ")
    .map((part) => part.trim())
    .filter(Boolean);
  const first = parts[0]?.[0] || "";
  const last = parts.length > 1 ? parts[parts.length - 1]?.[0] : "";
  return `${first}${last}`.toUpperCase();
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
  const bio = typeof data.bio === "string" && data.bio.trim() ? data.bio.trim() : "";
  const years = typeof data.years === "string" && data.years.trim() ? data.years : "";
  const students = typeof data.students === "string" && data.students.trim() ? data.students : "";
  const whatsappNumber = typeof data.whatsappNumber === "string" ? data.whatsappNumber : "";
  const whatsappEnabled = Boolean(data.whatsappEnabled);
  const studyomStudents = normalizeStudents(data.studyomStudents);

  return (
    <main className="bg-[var(--color-secondary)] pb-16 pt-10">
      <Section containerClassName="max-w-5xl space-y-6">
        <header className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--color-muted)]">Panel</p>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h1 className="text-3xl font-semibold text-[var(--color-primary)]">Hoca Paneli</h1>
          </div>
          <p className="text-sm text-[var(--color-muted)]">
            Onaylanan başvurunda paylaştığın bilgiler aşağıdadır. Güncellemeler için destek ekibimizle
            iletişime geçebilirsin.
          </p>
        </header>

        <Suspense
          fallback={
            <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6 text-sm text-[var(--color-muted)]">
              Mesajlar yükleniyor...
            </div>
          }
        >
          <TeacherMessageSection userId={dbUser.id} />
        </Suspense>

        <TeacherPanelSection title="Başvuru bilgileri" defaultOpen>
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
        </TeacherPanelSection>

        <TeacherPanelSection
          title="Profil bilgileri"
          description="Hoca profilinde gözüken bilgilerini buradan güncelleyebilirsin."
        >
          <TeacherProfileEditor
            initial={{
              instruments,
              levels,
              formats,
              city: city || "",
              languages,
              price,
              statement,
              bio,
              links,
              years,
              students,
            }}
          />
        </TeacherPanelSection>

        <TeacherPanelSection
          title="WhatsApp ayarları"
          description="Öğrencilerle WhatsApp üzerinden devam etmeyi burada açıp kapatabilirsin."
        >
          <TeacherWhatsAppSettings initialNumber={whatsappNumber} initialEnabled={whatsappEnabled} />
        </TeacherPanelSection>

        <Suspense
          fallback={
            <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6 text-sm text-[var(--color-muted)]">
              Bağlı stüdyolar yükleniyor...
            </div>
          }
        >
          <TeacherStudioLinksSection userId={dbUser.id} />
        </Suspense>

        <TeacherPanelSection
          title="Studyom Öğrencilerim"
          description="Mesajlaştığın öğrencileri buraya ekleyebilirsin."
        >
          {studyomStudents.length === 0 ? (
            <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4 text-sm text-[var(--color-muted)]">
              Henüz eklenmiş öğrenci yok. Mesajlarda “Öğrencilerime ekle” seçeneğini kullanabilirsin.
            </div>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">
              {studyomStudents.map((student) => (
                <div
                  key={student.id}
                  className="flex items-center gap-3 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4"
                >
                  {student.image ? (
                    <img
                      src={student.image}
                      alt={student.name}
                      className="h-10 w-10 rounded-full object-cover"
                    />
                  ) : (
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--color-secondary)] text-sm font-semibold text-[var(--color-primary)]">
                      {initials(student.name)}
                    </div>
                  )}
                  <div>
                    <p className="text-sm font-semibold text-[var(--color-primary)]">{student.name}</p>
                    {student.addedAt ? (
                      <p className="text-xs text-[var(--color-muted)]">
                        Eklendi: {formatDate(student.addedAt)}
                      </p>
                    ) : null}
                  </div>
                </div>
              ))}
            </div>
          )}
        </TeacherPanelSection>

        <TeacherPanelSection
          title="Fotoğraflar"
          description="Enstrüman, stüdyo veya ders anı fotoğraflarını ekleyebilirsin."
        >
          <TeacherGalleryClient initialUrls={galleryUrls} />
        </TeacherPanelSection>
      </Section>
    </main>
  );
}
