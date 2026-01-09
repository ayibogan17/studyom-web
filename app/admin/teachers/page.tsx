import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin";
import { Section } from "@/components/design-system/components/shared/section";
import { Card } from "@/components/design-system/components/ui/card";
import TeachersClient from "./teachers-client";
import { slugify } from "@/lib/geo";

export const revalidate = 0;

export default async function AdminTeachersPage() {
  await requireAdmin();
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const contactCounts = await prisma.contactEvent.groupBy({
    by: ["entityId"],
    where: { entityType: "teacher", createdAt: { gte: thirtyDaysAgo } },
    _count: { _all: true },
  });
  const contactMap = new Map(contactCounts.map((row) => [row.entityId, row._count._all]));
  const apps = await prisma.teacherApplication.findMany({
    where: { status: "approved" },
    orderBy: { createdAt: "desc" },
    take: 200,
  });
  const userIds = apps.map((a) => a.userId).filter(Boolean);
  const users = await prisma.user.findMany({
    where: { id: { in: userIds } },
    select: { id: true, email: true, fullName: true, city: true },
  });
  const userMap = new Map(users.map((u) => [u.id, u]));
  const items = apps.map((a) => {
    const user = userMap.get(a.userId) || null;
    const displayName = user?.fullName || user?.email || "hoca";
    const slug = `${slugify(displayName)}-${a.id}`;
    return {
    id: a.id,
    userId: a.userId,
    status: a.status,
    visibilityStatus: a.visibilityStatus ?? "published",
    moderationNote: a.moderationNote ?? null,
    complaintsCount: a.complaintsCount ?? 0,
    flagsCount: a.flagsCount ?? 0,
    contactCount: contactMap.get(String(a.id)) ?? 0,
    createdAt: a.createdAt,
    data: a.data,
    user,
    slug,
  };
  });

  return (
    <Section containerClassName="space-y-4">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold text-[var(--color-primary)]">Hoca Moderasyonu</h1>
        <p className="text-sm text-[var(--color-muted)]">Yayın durumu ve moderasyon notları.</p>
      </div>
      <Card className="p-4">
        <TeachersClient items={items} />
      </Card>
    </Section>
  );
}
