import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin";
import { Section } from "@/components/design-system/components/shared/section";
import { Card } from "@/components/design-system/components/ui/card";
import ApplicationsClient from "../applications-client";

export const revalidate = 0;

export default async function AdminStudioApplicationsPage() {
  await requireAdmin();

  const studios = await prisma.studio.findMany({
    where: {
      OR: [
        { applicationStatus: { in: ["pending", "changes_requested"] } },
        { isActive: false },
      ],
    },
    orderBy: { createdAt: "desc" },
    take: 200,
    select: {
      id: true,
      name: true,
      city: true,
      district: true,
      address: true,
      ownerEmail: true,
      phone: true,
      openingHours: true,
      applicationStatus: true,
      applicationAdminNote: true,
      applicationAdminTags: true,
      applicationRejectReason: true,
      visibilityStatus: true,
      moderationNote: true,
      createdAt: true,
      isActive: true,
      notifications: {
        select: { message: true, createdAt: true },
        orderBy: { createdAt: "desc" },
      },
    },
  });

  return (
    <Section containerClassName="space-y-4">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold text-[var(--color-primary)]">Stüdyo Başvuruları</h1>
        <p className="text-sm text-[var(--color-muted)]">Bekleyen başvurular.</p>
      </div>
      <Card className="p-4">
        <ApplicationsClient kind="studio" studios={studios} teacherApps={[]} producerApps={[]} />
      </Card>
    </Section>
  );
}
