import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin";
import { Section } from "@/components/design-system/components/shared/section";
import { Card } from "@/components/design-system/components/ui/card";

export const revalidate = 0;

export default async function AdminApplicationsPage() {
  await requireAdmin();

  const [studioPending, teacherPending, producerPending] = await Promise.all([
    prisma.studio.count({
      where: { applicationStatus: { in: ["pending", "changes_requested"] } },
    }),
    prisma.teacherApplication.count({
      where: { status: { in: ["pending", "changes_requested"] } },
    }),
    countProducerApplications(),
  ]);

  return (
    <Section containerClassName="space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold text-[var(--color-primary)]">Başvurular</h1>
        <p className="text-sm text-[var(--color-muted)]">Stüdyo, hoca ve üretici başvurularını ayrı sekmelerde inceleyin.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <ApplicationCard
          title="Stüdyo başvuruları"
          count={studioPending}
          href="/admin/applications/studios"
        />
        <ApplicationCard
          title="Hoca başvuruları"
          count={teacherPending}
          href="/admin/applications/teachers"
        />
        <ApplicationCard
          title="Üretici başvuruları"
          count={producerPending}
          href="/admin/applications/producers"
        />
      </div>
    </Section>
  );
}

function ApplicationCard({ title, count, href }: { title: string; count: number; href: string }) {
  return (
    <Card className="space-y-3 p-4">
      <div>
        <p className="text-sm text-[var(--color-muted)]">{title}</p>
        <p className="text-3xl font-semibold text-[var(--color-primary)]">{count}</p>
      </div>
      <Link href={href} className="text-sm font-semibold text-[var(--color-accent)]">
        Listeyi aç →
      </Link>
    </Card>
  );
}

async function countProducerApplications() {
  try {
    const rows = await prisma.$queryRaw<{ count: bigint }[]>`
      SELECT COUNT(*)::bigint AS count FROM "ProducerApplication"
      WHERE status IN ('pending', 'changes_requested')
    `;
    const value = rows[0]?.count;
    return typeof value === "bigint" ? Number(value) : Number(value ?? 0);
  } catch (err) {
    console.error("producer application count failed", err);
    return 0;
  }
}
