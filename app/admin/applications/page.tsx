import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin";
import { Section } from "@/components/design-system/components/shared/section";
import { Card } from "@/components/design-system/components/ui/card";
import ApplicationsClient from "./applications-client";

export const revalidate = 0;

export default async function AdminApplicationsPage() {
  await requireAdmin();

  const [studioApps, teacherApps, producerApps] = await Promise.all([
    prisma.studio.findMany({
      where: { isActive: false },
      orderBy: { createdAt: "desc" },
      take: 100,
      select: {
        id: true,
        name: true,
        city: true,
        district: true,
        ownerEmail: true,
        phone: true,
        createdAt: true,
        isActive: true,
      },
    }),
    prisma.teacherApplication.findMany({
      orderBy: { createdAt: "desc" },
      take: 100,
    }),
    fetchProducerApplications(),
  ]);

  const userIds = Array.from(
    new Set([...teacherApps, ...producerApps].map((app) => app.userId)),
  );
  const users = userIds.length
    ? await prisma.user.findMany({
        where: { id: { in: userIds } },
        select: { id: true, email: true, fullName: true, city: true },
      })
    : [];
  const userMap = new Map(users.map((u) => [u.id, u]));

  const teacherItems = teacherApps.map((app) => ({
    id: app.id,
    userId: app.userId,
    status: app.status,
    createdAt: app.createdAt,
    data: app.data as any,
    user: userMap.get(app.userId) || null,
  }));

  const producerItems = producerApps.map((app) => ({
    id: app.id,
    userId: app.userId,
    status: app.status,
    createdAt: app.createdAt,
    data: app.data as any,
    user: userMap.get(app.userId) || null,
  }));

  return (
    <Section containerClassName="space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold text-[var(--color-primary)]">Başvurular</h1>
        <p className="text-sm text-[var(--color-muted)]">Stüdyo, hoca ve üretici başvurularını tek yerden takip et.</p>
      </div>

      <Card className="space-y-4 p-4">
        <h2 className="text-lg font-semibold text-[var(--color-primary)]">Stüdyo başvuruları</h2>
        <ApplicationsClient
          kind="studio"
          studios={studioApps}
          teacherApps={[]}
          producerApps={[]}
        />
      </Card>

      <Card className="space-y-4 p-4">
        <h2 className="text-lg font-semibold text-[var(--color-primary)]">Hoca başvuruları</h2>
        <ApplicationsClient kind="teacher" studios={[]} teacherApps={teacherItems} producerApps={[]} />
      </Card>

      <Card className="space-y-4 p-4">
        <h2 className="text-lg font-semibold text-[var(--color-primary)]">Üretici başvuruları</h2>
        <ApplicationsClient kind="producer" studios={[]} teacherApps={[]} producerApps={producerItems} />
      </Card>
    </Section>
  );
}

type ProducerAppRow = {
  id: number;
  userId: string;
  status: string;
  createdAt: Date;
  data: unknown;
};

async function fetchProducerApplications(): Promise<ProducerAppRow[]> {
  try {
    const rows = await prisma.$queryRaw<ProducerAppRow[]>`
      SELECT id, "userId", status, "createdAt", data
      FROM "ProducerApplication"
      ORDER BY "createdAt" DESC
      LIMIT 100
    `;
    return rows;
  } catch (err) {
    console.error("producer application list failed", err);
    return [];
  }
}
