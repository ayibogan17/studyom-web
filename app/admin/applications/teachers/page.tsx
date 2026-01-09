import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin";
import { Section } from "@/components/design-system/components/shared/section";
import { Card } from "@/components/design-system/components/ui/card";
import ApplicationsClient from "../applications-client";

export const revalidate = 0;

export default async function AdminTeacherApplicationsPage() {
  await requireAdmin();

  const apps = await prisma.teacherApplication.findMany({
    where: { status: { in: ["pending", "changes_requested"] } },
    orderBy: { createdAt: "desc" },
    take: 200,
  });
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
        <h1 className="text-2xl font-semibold text-[var(--color-primary)]">Hoca Başvuruları</h1>
        <p className="text-sm text-[var(--color-muted)]">Bekleyen başvurular.</p>
      </div>
      <Card className="p-4">
        <ApplicationsClient kind="teacher" studios={[]} teacherApps={items} producerApps={[]} />
      </Card>
    </Section>
  );
}
