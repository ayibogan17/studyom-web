import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin";
import { Section } from "@/components/design-system/components/shared/section";
import { Card } from "@/components/design-system/components/ui/card";
import UsersClient from "./users-client";
import { normalizeRoles } from "@/lib/roles";

export const revalidate = 0;

export default async function AdminUsersPage() {
  await requireAdmin();
  const users = await prisma.user.findMany({
    orderBy: { createdAt: "desc" },
    take: 200,
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      roles: true,
      city: true,
      fullName: true,
      intent: true,
      isDisabled: true,
      isSuspended: true,
      isBanned: true,
      banReason: true,
      adminNote: true,
      isTeacher: true,
      isProducer: true,
      isStudioOwner: true,
      emailVerified: true,
      createdAt: true,
      updatedAt: true,
    },
  });
  const userIds = users.map((u) => u.id);
  const emails = users.map((u) => u.email);
  const studios = emails.length
    ? await prisma.studio.findMany({
        where: { ownerEmail: { in: emails } },
        select: { id: true, name: true, slug: true, ownerEmail: true },
      })
    : [];
  const studioMap = new Map<string, { id: string; name: string; slug: string | null }[]>();
  studios.forEach((studio) => {
    const list = studioMap.get(studio.ownerEmail) ?? [];
    studioMap.set(studio.ownerEmail, [...list, { id: studio.id, name: studio.name, slug: studio.slug }]);
  });

  const teacherApps = userIds.length
    ? await prisma.teacherApplication.findMany({
        where: { userId: { in: userIds } },
        select: { id: true, userId: true, status: true },
        orderBy: { createdAt: "desc" },
      })
    : [];
  const teacherMap = new Map<string, { id: number; status: string }>();
  teacherApps.forEach((app) => {
    if (!teacherMap.has(app.userId)) teacherMap.set(app.userId, { id: app.id, status: app.status });
  });

  const producerApps = userIds.length ? await fetchProducerApplications(userIds) : [];
  const producerMap = new Map<string, { id: number; status: string }>();
  producerApps.forEach((app) => {
    if (!producerMap.has(app.userId)) producerMap.set(app.userId, { id: app.id, status: app.status });
  });

  const items = users.map((user) => ({
    ...user,
    roles: normalizeRoles(user),
    studios: studioMap.get(user.email) ?? [],
    teacherApp: teacherMap.get(user.id) ?? null,
    producerApp: producerMap.get(user.id) ?? null,
  }));

  return (
    <Section containerClassName="space-y-4">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold text-[var(--color-primary)]">Kullanıcılar</h1>
        <p className="text-sm text-[var(--color-muted)]">Rolleri ve hesap durumunu yönet.</p>
      </div>
      <Card className="p-4">
        <UsersClient users={items} />
      </Card>
    </Section>
  );
}

async function fetchProducerApplications(userIds: string[]) {
  try {
    const rows = await prisma.$queryRaw<{ id: number; userId: string; status: string }[]>`
      SELECT id, "userId", status
      FROM "ProducerApplication"
      WHERE "userId" = ANY(${userIds})
      ORDER BY "createdAt" DESC
    `;
    return rows;
  } catch (err) {
    console.error("producer application list failed", err);
    return [];
  }
}
