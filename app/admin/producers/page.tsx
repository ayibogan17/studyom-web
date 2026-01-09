import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin";
import { Section } from "@/components/design-system/components/shared/section";
import { Card } from "@/components/design-system/components/ui/card";
import ProducersClient from "./producers-client";
import { slugify } from "@/lib/geo";

export const revalidate = 0;

type ProducerAppRow = {
  id: number;
  userId: string;
  status: string;
  visibilityStatus: string | null;
  moderationNote: string | null;
  complaintsCount: number;
  flagsCount: number;
  createdAt: Date;
  data: unknown;
};

export default async function AdminProducersPage() {
  await requireAdmin();
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const contactCounts = await prisma.contactEvent.groupBy({
    by: ["entityId"],
    where: { entityType: "producer", createdAt: { gte: thirtyDaysAgo } },
    _count: { _all: true },
  });
  const contactMap = new Map(contactCounts.map((row) => [row.entityId, row._count._all]));

  const apps = await fetchProducerApplications();
  const userIds = apps.map((a) => a.userId).filter(Boolean);
  const users = userIds.length
    ? await prisma.user.findMany({
        where: { id: { in: userIds } },
        select: { id: true, email: true, fullName: true, city: true },
      })
    : [];
  const userMap = new Map(users.map((u) => [u.id, u]));

  const items = apps.map((app) => {
    const user = userMap.get(app.userId) || null;
    const displayName = user?.fullName || user?.email || "uretici";
    const slug = `${slugify(displayName)}-${app.id}`;
    return {
      id: app.id,
      userId: app.userId,
      status: app.status,
      visibilityStatus: app.visibilityStatus ?? "published",
      moderationNote: app.moderationNote ?? null,
      complaintsCount: app.complaintsCount ?? 0,
      flagsCount: app.flagsCount ?? 0,
      contactCount: contactMap.get(String(app.id)) ?? 0,
      createdAt: app.createdAt,
      data: app.data,
      user,
      slug,
    };
  });

  return (
    <Section containerClassName="space-y-4">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold text-[var(--color-primary)]">Üretici Moderasyonu</h1>
        <p className="text-sm text-[var(--color-muted)]">Yayın durumu ve moderasyon notları.</p>
      </div>
      <Card className="p-4">
        <ProducersClient items={items} />
      </Card>
    </Section>
  );
}

async function fetchProducerApplications(): Promise<ProducerAppRow[]> {
  try {
    const rows = await prisma.$queryRaw<ProducerAppRow[]>`
      SELECT id, "userId", status, "visibilityStatus", "moderationNote",
             "complaintsCount", "flagsCount", "createdAt", data
      FROM "ProducerApplication"
      WHERE status = 'approved'
      ORDER BY "createdAt" DESC
      LIMIT 200
    `;
    return rows;
  } catch (err) {
    console.error("producer application list failed", err);
    return [];
  }
}
