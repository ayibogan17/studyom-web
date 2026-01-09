import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin";
import { Section } from "@/components/design-system/components/shared/section";
import { Card } from "@/components/design-system/components/ui/card";
import ApplicationsClient from "../applications-client";

export const revalidate = 0;

type ProducerAppRow = {
  id: number;
  userId: string;
  status: string;
  adminNote?: string | null;
  adminTags?: string[];
  rejectReason?: string | null;
  visibilityStatus?: string | null;
  moderationNote?: string | null;
  createdAt: Date;
  data: unknown;
};

export default async function AdminProducerApplicationsPage() {
  await requireAdmin();

  const apps = await fetchProducerApplications();
  const userIds = apps.map((a) => a.userId).filter(Boolean);
  const users = userIds.length
    ? await prisma.user.findMany({
        where: { id: { in: userIds } },
        select: { id: true, email: true, fullName: true, city: true },
      })
    : [];
  const userMap = new Map(users.map((u) => [u.id, u]));

  const items = apps.map((app) => ({
    id: app.id,
    userId: app.userId,
    status: app.status,
    adminNote: app.adminNote ?? null,
    adminTags: app.adminTags ?? [],
    rejectReason: app.rejectReason ?? null,
    visibilityStatus: app.visibilityStatus ?? "published",
    moderationNote: app.moderationNote ?? null,
    createdAt: app.createdAt,
    data: app.data,
    user: userMap.get(app.userId) || null,
  }));

  return (
    <Section containerClassName="space-y-4">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold text-[var(--color-primary)]">Üretici Başvuruları</h1>
        <p className="text-sm text-[var(--color-muted)]">Bekleyen başvurular.</p>
      </div>
      <Card className="p-4">
        <ApplicationsClient kind="producer" studios={[]} teacherApps={[]} producerApps={items} />
      </Card>
    </Section>
  );
}

async function fetchProducerApplications(): Promise<ProducerAppRow[]> {
  try {
    const rows = await prisma.$queryRaw<ProducerAppRow[]>`
      SELECT id, "userId", status, "adminNote", "adminTags", "rejectReason",
             "visibilityStatus", "moderationNote",
             "createdAt", data
      FROM "ProducerApplication"
      WHERE status IN ('pending', 'changes_requested')
      ORDER BY "createdAt" DESC
      LIMIT 200
    `;
    return rows;
  } catch (err) {
    console.error("producer application list failed", err);
    return [];
  }
}
