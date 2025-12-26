import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin";
import { Section } from "@/components/design-system/components/shared/section";
import { Card } from "@/components/design-system/components/ui/card";
import LeadsClient from "./leads-client";

export const revalidate = 0;

export default async function AdminLeadsPage() {
  await requireAdmin();
  const [teacherLeads, generalLeads] = await Promise.all([
    prisma.teacherLead.findMany({ orderBy: { createdAt: "desc" }, take: 200 }),
    prisma.lead.findMany({ orderBy: { createdAt: "desc" }, take: 200 }),
  ]);

  const combined = [
    ...teacherLeads.map((l) => ({
      id: l.id,
      type: "teacher" as const,
      status: l.status,
      createdAt: l.createdAt,
      title: l.teacherName || l.teacherSlug,
      contact: l.studentEmail,
      city: l.city,
      message: l.message,
      extra: l.preferredLessonType,
    })),
    ...generalLeads.map((l) => ({
      id: l.id,
      type: "lead" as const,
      status: l.status,
      createdAt: l.createdAt,
      title: l.name || "Genel lead",
      contact: l.email,
      city: "",
      message: l.note || "",
      extra: l.source || "",
    })),
  ].sort((a, b) => (new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));

  return (
    <Section containerClassName="space-y-4">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold text-[var(--color-primary)]">Lead&apos;ler</h1>
        <p className="text-sm text-[var(--color-muted)]">Hoca lead&apos;leri ve genel iletişim talepleri.</p>
      </div>
      <Card className="p-4">
        <LeadsClient items={combined} />
      </Card>
    </Section>
  );
}
