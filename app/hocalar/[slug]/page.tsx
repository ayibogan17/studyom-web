import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import { Card } from "@/components/design-system/components/ui/card";
import { Section } from "@/components/design-system/components/shared/section";
import { TeacherMessageThread } from "@/components/design-system/components/teachers/teacher-message-thread";
import { TeacherGallery } from "@/components/design-system/components/teachers/teacher-gallery";
import { slugify } from "@/lib/geo";
import { getTeacherBySlug } from "@/lib/teachers";
import { getApprovedTeacherBySlug, getTeacherIdentityBySlug, parseTeacherApplicationIdFromSlug } from "@/lib/teacher-db";
import { prisma } from "@/lib/prisma";

type Params = { slug: string };

export const dynamic = "force-dynamic";

function getInitials(value: string) {
  const parts = value
    .split(" ")
    .map((part) => part.trim())
    .filter(Boolean);
  const first = parts[0]?.[0] || "";
  const last = parts.length > 1 ? parts[parts.length - 1]?.[0] : "";
  return `${first}${last}`.toUpperCase();
}

export async function generateMetadata({
  params,
}: {
  params: Params | Promise<Params>;
}): Promise<Metadata> {
  const resolved = await Promise.resolve(params);
  const slug = resolved?.slug;
  const approved = await getApprovedTeacherBySlug(slug);
  const teacher = approved ?? (slug ? getTeacherBySlug(slug) : undefined);
  if (!teacher) {
    return {
      title: "Hoca bulunamadı | Studyom",
    };
  }
  const instrumentText = teacher.instruments.join(", ");
  return {
    title: `${teacher.displayName} | Hocalar | Studyom`,
    description: `${teacher.displayName} - ${teacher.city} | ${instrumentText} dersleri`,
  };
}

export default async function TeacherDetailPage({
  params,
}: {
  params: Params | Promise<Params>;
}) {
  const resolved = await Promise.resolve(params);
  const slug = resolved?.slug;
  const approved = await getApprovedTeacherBySlug(slug);
  const teacher = approved ?? (slug ? getTeacherBySlug(slug) : undefined);
  if (!teacher) return notFound();
  const identity = await getTeacherIdentityBySlug(teacher.slug);
  const appId = parseTeacherApplicationIdFromSlug(teacher.slug);
  const studentInitials = appId
    ? (() => {
        const normalize = (value: unknown) => {
          if (!Array.isArray(value)) return [];
          return value
            .map((item) => {
              if (!item || typeof item !== "object") return null;
              const record = item as { name?: unknown; image?: unknown };
              const name = typeof record.name === "string" && record.name.trim() ? record.name.trim() : null;
              const image = typeof record.image === "string" && record.image.trim() ? record.image.trim() : null;
              if (!name) return null;
              return { name, image };
            })
            .filter((item): item is { name: string; image: string | null } => Boolean(item?.name));
        };
        return prisma.teacherApplication
          .findUnique({
            where: { id: appId },
            select: { data: true },
          })
          .then((app) => {
            const data = (app?.data || {}) as { studyomStudents?: unknown };
            return normalize(data.studyomStudents).map((student) => ({
              initials: getInitials(student.name),
              image: student.image,
            }));
          })
          .catch(() => []);
      })()
    : Promise.resolve([]);
  const portfolioLinks = teacher.portfolioUrls
    .map((raw) => raw.trim())
    .filter(Boolean)
    .map((raw) => {
      try {
        const parsed = new URL(raw);
        if (parsed.protocol === "http:" || parsed.protocol === "https:") {
          return { href: parsed.toString(), label: raw };
        }
        return null;
      } catch {
        const normalized = `https://${raw}`;
        try {
          const parsed = new URL(normalized);
          return { href: parsed.toString(), label: raw };
        } catch {
          return null;
        }
      }
    })
    .filter((item): item is { href: string; label: string } => Boolean(item))
    .slice(0, 5);

  const studentBadges = await studentInitials;

  return (
    <main className="bg-[var(--color-secondary)]">
      <Section containerClassName="max-w-6xl space-y-6">
        <header className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wide text-[var(--color-muted)]">Hocalar</p>
          <div className="flex flex-wrap items-center gap-3">
            {teacher.imageUrl ? (
              <img
                src={teacher.imageUrl}
                alt={teacher.displayName}
                className="h-12 w-12 rounded-full object-cover"
              />
            ) : (
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[var(--color-secondary)] text-sm font-semibold text-[var(--color-primary)]">
                {getInitials(teacher.displayName)}
              </div>
            )}
            <h1 className="text-3xl font-semibold text-[var(--color-primary)]">{teacher.displayName}</h1>
          </div>
          <p className="text-sm text-[var(--color-muted)]">
            {teacher.city} • {teacher.instruments.join(", ")} • {teacher.lessonTypes.map((t) => (t === "online" ? "Online" : t === "in-person" ? "Yüzyüze" : "Online + Yüzyüze")).join(" / ")}
          </p>
          <p className="text-xs text-[var(--color-muted)]">Güncelleme: {teacher.updatedAt}</p>
        </header>

        <div className="grid gap-5 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="space-y-4">
            <Card className="space-y-3 p-5">
              <p className="text-base font-semibold text-[var(--color-primary)]">Hakkında</p>
              <p className="text-sm text-[var(--color-muted)] whitespace-pre-line">{teacher.bio}</p>
            </Card>

            <Card className="space-y-3 p-5">
              <p className="text-base font-semibold text-[var(--color-primary)]">Enstrüman & Tarz</p>
              <div className="flex flex-wrap gap-2 text-sm text-[var(--color-primary)]">
                {teacher.instruments.map((inst) => (
                  <span key={inst} className="rounded-full bg-[var(--color-secondary)] px-3 py-1">
                    {inst}
                  </span>
                ))}
              </div>
              {teacher.genres.length > 0 && (
                <div className="flex flex-wrap gap-2 text-xs text-[var(--color-muted)]">
                  {teacher.genres.map((g) => (
                    <span key={g} className="rounded-full border border-[var(--color-border)] px-3 py-1">
                      {g}
                    </span>
                  ))}
                </div>
              )}
            </Card>

            <Card className="space-y-2 p-5">
              <p className="text-base font-semibold text-[var(--color-primary)]">Ders tipi ve seviye</p>
              <p className="text-sm text-[var(--color-primary)]">
                Ders tipi: {teacher.lessonTypes.map((t) => (t === "online" ? "Online" : t === "in-person" ? "Yüzyüze" : "Online + Yüzyüze")).join(" / ")}
              </p>
              <p className="text-sm text-[var(--color-primary)]">Seviye: {teacher.level}</p>
              {teacher.hourlyRateMin ? (
                <p className="text-sm text-[var(--color-muted)]">Ücret: ₺{teacher.hourlyRateMin}+ / saat (bilgilendirme)</p>
              ) : (
                <p className="text-sm text-[var(--color-muted)]">Ücret bilgisi görüşme sonrası netleşir.</p>
              )}
              <p className="text-xs text-[var(--color-muted)]">
                Studyom ders satmaz; program ve ödeme öğretmenle doğrudan konuşulur.
              </p>
            </Card>

            <Card className="space-y-2 p-5">
              <p className="text-base font-semibold text-[var(--color-primary)]">Portfolyo</p>
              {portfolioLinks.length === 0 ? (
                <p className="text-sm text-[var(--color-muted)]">Paylaşılan bağlantı yok.</p>
              ) : (
                <ul className="list-disc space-y-2 pl-4 text-sm text-[var(--color-accent)]">
                  {portfolioLinks.map((item, idx) => (
                    <li key={`${item.href}-${idx}`}>
                      <a href={item.href} target="_blank" rel="noreferrer" className="hover:underline">
                        {item.label}
                      </a>
                    </li>
                  ))}
                </ul>
              )}
            </Card>

            {teacher.galleryUrls && teacher.galleryUrls.length > 0 && (
              <TeacherGallery urls={teacher.galleryUrls} />
            )}

            {studentBadges.length > 0 && (
              <Card className="space-y-3 p-5">
                <p className="text-base font-semibold text-[var(--color-primary)]">Studyom'daki Öğrencileri</p>
                <div className="flex flex-wrap gap-2">
                  {studentBadges.map((student, idx) =>
                    student.image ? (
                      <img
                        key={`${student.image}-${idx}`}
                        src={student.image}
                        alt="Öğrenci"
                        className="h-10 w-10 rounded-full object-cover"
                      />
                    ) : (
                      <div
                        key={`${student.initials}-${idx}`}
                        className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--color-secondary)] text-sm font-semibold text-[var(--color-primary)]"
                        aria-label="Öğrenci"
                      >
                        {student.initials}
                      </div>
                    ),
                  )}
                </div>
              </Card>
            )}

            {teacher.studiosUsed && teacher.studiosUsed.length > 0 && (
              <Card className="space-y-2 p-5">
                <p className="text-base font-semibold text-[var(--color-primary)]">Çalıştığı stüdyolar</p>
                <ul className="list-disc space-y-1 pl-4 text-sm text-[var(--color-primary)]">
                  {teacher.studiosUsed.map((s) => (
                    <li key={s}>
                      <Link
                        href={`/studyo/${slugify(s)}`}
                        className="transition hover:text-[var(--color-accent)] hover:underline"
                      >
                        {s}
                      </Link>
                    </li>
                  ))}
                </ul>
              </Card>
            )}
          </div>

          {identity ? (
            <TeacherMessageThread teacherSlug={teacher.slug} teacherName={teacher.displayName} />
          ) : (
            <Card className="space-y-3 p-5">
              <p className="text-base font-semibold text-[var(--color-primary)]">Mesaj gönder</p>
              <p className="text-sm text-[var(--color-muted)]">
                Bu profil için mesajlaşma şu an aktif değil.
              </p>
            </Card>
          )}
        </div>
      </Section>
    </main>
  );
}
