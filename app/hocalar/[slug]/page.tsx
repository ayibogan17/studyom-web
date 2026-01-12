import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import { Card } from "@/components/design-system/components/ui/card";
import { Section } from "@/components/design-system/components/shared/section";
import { TeacherMessageThread } from "@/components/design-system/components/teachers/teacher-message-thread";
import { TeacherGallery } from "@/components/design-system/components/teachers/teacher-gallery";
import { Button } from "@/components/design-system/components/ui/button";
import { Badge } from "@/components/design-system/components/ui/badge";
import { slugify } from "@/lib/geo";
import { getTeacherBySlug } from "@/lib/teachers";
import { getApprovedTeacherBySlug, getTeacherIdentityBySlug, parseTeacherApplicationIdFromSlug } from "@/lib/teacher-db";
import { prisma } from "@/lib/prisma";
import { TeacherBioCard } from "./teacher-bio-card";

type Params = { slug: string };

export const revalidate = 300;

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
  const canonical = `https://www.studyom.net/hocalar/${teacher.slug}`;
  const description = `${teacher.displayName} - ${teacher.city} | ${instrumentText} dersleri`;
  return {
    title: `${teacher.displayName} | Hocalar | Studyom`,
    description,
    alternates: { canonical },
    openGraph: {
      title: `${teacher.displayName} | Hocalar | Studyom`,
      description,
      url: canonical,
      images: teacher.image ? [{ url: teacher.image }] : [{ url: "/logo.svg" }],
    },
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
  const studentBadges = appId
    ? await (async () => {
        const normalize = (value: unknown) => {
          if (!Array.isArray(value)) return [];
          return value
            .map((item) => {
              if (!item || typeof item !== "object") return null;
              const record = item as { id?: unknown; name?: unknown; image?: unknown };
              const id = typeof record.id === "string" && record.id.trim() ? record.id.trim() : null;
              const name = typeof record.name === "string" && record.name.trim() ? record.name.trim() : null;
              const image = typeof record.image === "string" && record.image.trim() ? record.image.trim() : null;
              if (!name) return null;
              return { id, name, image };
            })
            .filter((item): item is { id: string | null; name: string; image: string | null } => Boolean(item?.name));
        };
        try {
          const app = await prisma.teacherApplication.findUnique({
            where: { id: appId },
            select: { data: true },
          });
          const data = (app?.data || {}) as { studyomStudents?: unknown };
          const students = normalize(data.studyomStudents);
          if (students.length === 0) return [];
          const studentIds = students.map((student) => student.id).filter((id): id is string => Boolean(id));
          const dbStudents = studentIds.length
            ? await prisma.user.findMany({
                where: { id: { in: studentIds } },
                select: { id: true, image: true },
              })
            : [];
          const imageMap = new Map(dbStudents.map((user) => [user.id, user.image ?? null]));
          return students.map((student) => ({
            initials: getInitials(student.name),
            image: imageMap.get(student.id || "") || student.image,
          }));
        } catch {
          return [];
        }
      })()
    : [];
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

  return (
    <main className="bg-[var(--color-secondary)] pb-16 pt-10">
      <Section containerClassName="max-w-6xl space-y-10">
        <div className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
          <TeacherProfileHeader teacher={teacher} />
          <MessageCard teacher={teacher} enabled={Boolean(identity)} />
        </div>

        <TeacherBioCard bio={teacher.bio} />

        <div className="grid gap-6 lg:grid-cols-2">
          <DetailsCard teacher={teacher} />
          <StudiosCard studios={teacher.studiosUsed} />
        </div>

        <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
          <PortfolioCard links={portfolioLinks} />
          {teacher.galleryUrls && teacher.galleryUrls.length > 0 ? (
            <TeacherGallery urls={teacher.galleryUrls} />
          ) : (
            <Card className="space-y-3 p-6">
              <p className="text-sm font-semibold text-[var(--color-primary)]">Fotoğraflar</p>
              <p className="text-sm text-[var(--color-muted)]">Henüz görsel eklenmemiş.</p>
            </Card>
          )}
        </div>

        {studentBadges.length > 0 && <StudentsCard students={studentBadges} />}
      </Section>
    </main>
  );
}

function TeacherProfileHeader({
  teacher,
}: {
  teacher: {
    displayName: string;
    imageUrl?: string;
    city: string;
    instruments: string[];
    lessonTypes: string[];
    level: string;
    statement?: string;
    bio: string;
    updatedAt: string;
  };
}) {
  const statement = teacher.statement?.trim() || teacher.bio.trim();
  return (
    <Card className="space-y-5 p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-center gap-4">
          {teacher.imageUrl ? (
            <img src={teacher.imageUrl} alt={teacher.displayName} className="h-16 w-16 rounded-full object-cover" />
          ) : (
            <div className="flex h-16 w-16 items-center justify-center rounded-full border border-[var(--color-border)] bg-[var(--color-secondary)] text-base font-semibold text-[var(--color-primary)]">
              {getInitials(teacher.displayName)}
            </div>
          )}
          <div className="space-y-1">
            <h1 className="text-2xl font-semibold text-[var(--color-primary)]">{teacher.displayName}</h1>
            <p className="text-sm text-[var(--color-muted)]">{teacher.city}</p>
          </div>
        </div>
        <p className="text-xs text-[var(--color-muted)]">Güncelleme: {teacher.updatedAt}</p>
      </div>

      <p className="text-sm text-[var(--color-muted)] line-clamp-3">
        {statement || "Kısa açıklama eklenmedi."}
      </p>
    </Card>
  );
}

function MessageCard({
  teacher,
  enabled,
}: {
  teacher: { slug: string; displayName: string };
  enabled: boolean;
}) {
  if (!enabled) {
    return (
      <Card className="space-y-3 p-6">
        <p className="text-sm font-semibold text-[var(--color-primary)]">Mesaj gönder</p>
        <p className="text-sm text-[var(--color-muted)]">Bu profil için mesajlaşma şu an aktif değil.</p>
      </Card>
    );
  }

  return <TeacherMessageThread teacherSlug={teacher.slug} teacherName={teacher.displayName} />;
}

function DetailsCard({
  teacher,
}: {
  teacher: {
    instruments: string[];
    genres: string[];
    lessonTypes: string[];
    level: string;
    hourlyRateMin?: number | null;
  };
}) {
  const lessonText = teacher.lessonTypes
    .map((t) => (t === "online" ? "Online" : t === "in-person" ? "Yüzyüze" : "Online + Yüzyüze"))
    .join(" / ");
  return (
    <Card className="space-y-4 p-6">
      <p className="text-sm font-semibold text-[var(--color-primary)]">Detaylar</p>
      <div className="grid gap-4 sm:grid-cols-2">
        <TagSection title="Enstrümanlar" items={teacher.instruments} />
        <TagSection title="Türler" items={teacher.genres} emptyLabel="Belirtilmedi" />
        <div className="space-y-2">
          <p className="text-xs font-semibold text-[var(--color-muted)]">Ders tipi</p>
          <div className="flex flex-wrap gap-2">
            {teacher.lessonTypes.map((item) => (
              <Badge key={item} variant="outline">
                {item === "online" ? "Online" : item === "in-person" ? "Yüzyüze" : "Online + Yüzyüze"}
              </Badge>
            ))}
          </div>
        </div>
        <div className="space-y-2">
          <p className="text-xs font-semibold text-[var(--color-muted)]">Seviye</p>
          <p className="text-sm text-[var(--color-primary)]">{teacher.level}</p>
        </div>
      </div>
      <div className="space-y-1 rounded-2xl border border-[var(--color-border)] bg-[var(--color-secondary)] p-3">
        <p className="text-sm text-[var(--color-primary)]">
          Ders tipi: {lessonText}
        </p>
        {teacher.hourlyRateMin ? (
          <p className="text-sm text-[var(--color-muted)]">Ücret: ₺{teacher.hourlyRateMin}+ / saat (bilgilendirme)</p>
        ) : (
          <p className="text-sm text-[var(--color-muted)]">Ücret bilgisi görüşme sonrası netleşir.</p>
        )}
        <p className="text-xs text-[var(--color-muted)]">
          Studyom ders satmaz; program ve ödeme öğretmenle doğrudan konuşulur.
        </p>
      </div>
    </Card>
  );
}

function TagSection({ title, items, emptyLabel = "Belirtilmedi" }: { title: string; items: string[]; emptyLabel?: string }) {
  return (
    <div className="space-y-2">
      <p className="text-xs font-semibold text-[var(--color-muted)]">{title}</p>
      <div className="flex flex-wrap gap-2">
        {items && items.length > 0 ? (
          items.map((item) => (
            <Badge key={item} variant="outline">
              {item}
            </Badge>
          ))
        ) : (
          <span className="text-sm text-[var(--color-muted)]">{emptyLabel}</span>
        )}
      </div>
    </div>
  );
}

function StudiosCard({ studios }: { studios?: string[] }) {
  const list = studios ?? [];
  return (
    <Card className="space-y-4 p-6">
      <p className="text-sm font-semibold text-[var(--color-primary)]">Çalıştığı stüdyolar</p>
      {list.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          {list.map((studio) => (
            <Link
              key={studio}
              href={`/studyo/${slugify(studio)}`}
              className="rounded-full border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-1 text-xs text-[var(--color-primary)] transition hover:border-[var(--color-accent)]"
            >
              {studio}
            </Link>
          ))}
        </div>
      ) : (
        <p className="text-sm text-[var(--color-muted)]">Henüz eklenmemiş.</p>
      )}
    </Card>
  );
}

function PortfolioCard({ links }: { links: { href: string; label: string }[] }) {
  const getDomain = (value: string) => {
    try {
      return new URL(value).hostname.replace(/^www\./, "");
    } catch {
      return value;
    }
  };

  return (
    <Card className="space-y-4 p-6">
      <p className="text-sm font-semibold text-[var(--color-primary)]">Portfolyo</p>
      {links.length === 0 ? (
        <p className="text-sm text-[var(--color-muted)]">Paylaşılan bağlantı yok.</p>
      ) : (
        <div className="space-y-3">
          {links.map((item, idx) => (
            <div
              key={`${item.href}-${idx}`}
              className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-3"
            >
              <div>
                <p className="text-sm font-semibold text-[var(--color-primary)]">Portföyü Aç</p>
                <p className="text-xs text-[var(--color-muted)]">{getDomain(item.href)}</p>
              </div>
              <Button asChild size="sm" variant="secondary">
                <a href={item.href} target="_blank" rel="noreferrer">
                  Portföyü Aç
                </a>
              </Button>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}

function StudentsCard({
  students,
}: {
  students: { initials: string; image: string | null }[];
}) {
  return (
    <Card className="space-y-3 p-6">
      <p className="text-sm font-semibold text-[var(--color-primary)]">Studyom&apos;daki Öğrencileri</p>
      <div className="flex flex-wrap gap-2">
        {students.map((student, idx) =>
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
              className="flex h-10 w-10 items-center justify-center rounded-full border border-[var(--color-border)] bg-[var(--color-secondary)] text-sm font-semibold text-[var(--color-primary)]"
              aria-label="Öğrenci"
            >
              {student.initials}
            </div>
          ),
        )}
      </div>
    </Card>
  );
}
