import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin";
import { Section } from "@/components/design-system/components/shared/section";
import { Card } from "@/components/design-system/components/ui/card";
import StudiosClient from "./studios-client";

export const revalidate = 0;

export default async function AdminStudiosPage() {
  await requireAdmin();
  const studios = await prisma.studio.findMany({
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
      isActive: true,
      createdAt: true,
      updatedAt: true,
      rooms: {
        select: {
          id: true,
          name: true,
          type: true,
          color: true,
          pricingModel: true,
          flatRate: true,
          minRate: true,
          dailyRate: true,
          hourlyRate: true,
          equipmentJson: true,
          featuresJson: true,
          extrasJson: true,
          imagesJson: true,
          createdAt: true,
          updatedAt: true,
        },
      },
      notifications: {
        select: {
          id: true,
          message: true,
          createdAt: true,
        },
      },
      ratings: {
        select: {
          id: true,
          value: true,
          comment: true,
          createdAt: true,
        },
      },
    },
  });

  return (
    <Section containerClassName="space-y-4">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold text-[var(--color-primary)]">Stüdyolar</h1>
        <p className="text-sm text-[var(--color-muted)]">Aktiflik durumlarını ve iletişim bilgilerini yönet.</p>
      </div>
      <Card className="p-4">
        <StudiosClient studios={studios} />
      </Card>
    </Section>
  );
}
