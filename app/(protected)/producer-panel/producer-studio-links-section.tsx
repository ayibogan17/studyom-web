import { prisma } from "@/lib/prisma";
import { TeacherPanelSection } from "@/app/(protected)/teacher-panel/teacher-panel-section";
import { ProducerStudioLinksClient } from "./producer-studio-links-client";

export async function ProducerStudioLinksSection({ userId }: { userId: string }) {
  const studioLinks = await prisma.producerStudioLink.findMany({
    where: { producerUserId: userId },
    include: { studio: { select: { id: true, name: true, city: true, district: true } } },
    orderBy: { createdAt: "desc" },
  });

  const studioLinkItems = studioLinks.map((link) => ({
    id: link.id,
    status: link.status as "pending" | "approved" | "rejected",
    createdAt: link.createdAt.toISOString(),
    studio: link.studio,
  }));

  return (
    <TeacherPanelSection
      title="Stüdyo bağlantıları"
      description="Birlikte çalıştığın stüdyolarla bağlantılarını buradan yönetebilirsin."
    >
      <ProducerStudioLinksClient studioLinks={studioLinkItems} />
    </TeacherPanelSection>
  );
}
