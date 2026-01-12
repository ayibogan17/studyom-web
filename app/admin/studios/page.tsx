import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin";
import { Section } from "@/components/design-system/components/shared/section";
import { Card } from "@/components/design-system/components/ui/card";
import StudiosClient from "./studios-client";

export const revalidate = 0;

export default async function AdminStudiosPage() {
  await requireAdmin();
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const contactCounts = await prisma.contactEvent.groupBy({
    by: ["entityId"],
    where: { entityType: "studio", createdAt: { gte: thirtyDaysAgo } },
    _count: { _all: true },
  });
  const contactMap = new Map(contactCounts.map((row) => [row.entityId, row._count._all]));
  const reservationCounts = await prisma.studioReservationRequest.groupBy({
    by: ["studioId", "status"],
    _count: { _all: true },
  });
  const reservationTotalMap = new Map<string, number>();
  const reservationApprovedMap = new Map<string, number>();
  reservationCounts.forEach((row) => {
    const total = reservationTotalMap.get(row.studioId) ?? 0;
    reservationTotalMap.set(row.studioId, total + row._count._all);
    if (row.status === "approved") {
      reservationApprovedMap.set(row.studioId, row._count._all);
    }
  });
  const studios = await prisma.studio.findMany({
    orderBy: { createdAt: "desc" },
    take: 200,
    select: {
      id: true,
      name: true,
      slug: true,
      city: true,
      district: true,
      address: true,
      ownerEmail: true,
      phone: true,
      openingHours: true,
      isActive: true,
      visibilityStatus: true,
      moderationNote: true,
      complaintsCount: true,
      flagsCount: true,
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

  const items = studios.map((studio) => ({
    ...studio,
    contactCount: contactMap.get(studio.id) ?? 0,
    reservationRequestCount: reservationTotalMap.get(studio.id) ?? 0,
    reservationApprovedCount: reservationApprovedMap.get(studio.id) ?? 0,
  }));

  return (
    <Section containerClassName="space-y-4">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold text-[var(--color-primary)]">Stüdyo Moderasyonu</h1>
        <p className="text-sm text-[var(--color-muted)]">Yayın durumu, notlar ve görünürlük yönetimi.</p>
      </div>
      <Card className="p-4">
        <StudiosClient studios={items} />
      </Card>
    </Section>
  );
}
