import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { Card } from "@/components/design-system/components/ui/card";
import { Section } from "@/components/design-system/components/shared/section";
import { TeacherContactForm } from "@/components/design-system/components/teachers/teacher-contact-form";
import { getTeacherBySlug } from "@/lib/teachers";
import { getApprovedTeachers } from "@/lib/teacher-db";

type Params = { slug: string };

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const approved = await getApprovedTeachers();
  const teacher = getTeacherBySlug(params.slug, approved) ?? getTeacherBySlug(params.slug);
  if (!teacher) {
    return {
      title: "Hoca bulunamadı | Studyom",
    };
  }
  return {
    title: `${teacher.displayName} | Hocalar | Studyom`,
    description: `${teacher.displayName} - ${teacher.city} | ${teacher.instruments.join(", ")} dersleri`,
  };
}

export default async function TeacherDetailPage({ params }: { params: Params }) {
  const approved = await getApprovedTeachers();
  const teacher = getTeacherBySlug(params.slug, approved) ?? getTeacherBySlug(params.slug);
  if (!teacher) return notFound();

  return (
    <main className="bg-[var(--color-secondary)]">
      <Section containerClassName="max-w-6xl space-y-6">
        <header className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wide text-[var(--color-muted)]">Hocalar</p>
          <h1 className="text-3xl font-semibold text-[var(--color-primary)]">{teacher.displayName}</h1>
          <p className="text-sm text-[var(--color-muted)]">
            {teacher.city} • {teacher.instruments.join(", ")} • {teacher.lessonTypes.map((t) => (t === "online" ? "Online" : t === "in-person" ? "Yüzyüze" : "Online + Yüzyüze")).join(" / ")}
          </p>
        </header>

        <div className="grid gap-5 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="space-y-4">
            <Card className="space-y-3 p-5">
              <p className="text-base font-semibold text-[var(--color-primary)]">Hakkında</p>
              <p className="text-sm text-[var(--color-muted)]">{teacher.bio}</p>
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
              {teacher.portfolioUrls.length === 0 ? (
                <p className="text-sm text-[var(--color-muted)]">Paylaşılan bağlantı yok.</p>
              ) : (
                <ul className="list-disc space-y-2 pl-4 text-sm text-[var(--color-accent)]">
                  {teacher.portfolioUrls.slice(0, 5).map((url, idx) => (
                    <li key={`${url}-${idx}`}>
                      <a href={url} target="_blank" rel="noreferrer" className="hover:underline">
                        {url}
                      </a>
                    </li>
                  ))}
                </ul>
              )}
            </Card>

            {teacher.studiosUsed && teacher.studiosUsed.length > 0 && (
              <Card className="space-y-2 p-5">
                <p className="text-base font-semibold text-[var(--color-primary)]">Çalıştığı stüdyolar</p>
                <ul className="list-disc space-y-1 pl-4 text-sm text-[var(--color-primary)]">
                  {teacher.studiosUsed.map((s) => (
                    <li key={s}>{s}</li>
                  ))}
                </ul>
              </Card>
            )}
          </div>

          <TeacherContactForm teacherSlug={teacher.slug} teacherName={teacher.displayName} />
        </div>
      </Section>
    </main>
  );
}
