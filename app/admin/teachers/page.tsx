import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin";
import { Section } from "@/components/design-system/components/shared/section";
import { Card } from "@/components/design-system/components/ui/card";
import TeachersClient from "./teachers-client";

export const revalidate = 0;

export default async function AdminTeachersPage() {
  await requireAdmin();
  const apps = await prisma.teacherApplication.findMany({
    orderBy: { createdAt: "desc" },
    take: 100,
  });
  const userIds = apps.map((a) => a.userId).filter(Boolean);
  const users = await prisma.user.findMany({
    where: { id: { in: userIds } },
    select: { id: true, email: true, fullName: true, city: true },
  });
  const userMap = new Map(users.map((u) => [u.id, u]));
  const items = apps.map((a) => ({
    id: a.id,
    userId: a.userId,
    status: a.status,
    createdAt: a.createdAt,
    data: a.data as any,
    user: userMap.get(a.userId) || null,
  }));

  return (
    <Section containerClassName="space-y-4">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold text-[var(--color-primary)]">Hoca başvuruları</h1>
        <p className="text-sm text-[var(--color-muted)]">Başvuruları görüntüle, durumunu güncelle.</p>
      </div>
      <Card className="p-4">
        <TeachersClient items={items} />
      </Card>
    </Section>
  );
}
