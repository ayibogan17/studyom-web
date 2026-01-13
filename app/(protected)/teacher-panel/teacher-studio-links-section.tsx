import { prisma } from "@/lib/prisma";
import { TeacherPanelSection } from "./teacher-panel-section";
import { TeacherStudioLinksClient } from "./teacher-studio-links-client";

export async function TeacherStudioLinksSection({ userId }: { userId: string }) {
  const studioLinks = await prisma.teacherStudioLink.findMany({
    where: { teacherUserId: userId },
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
      description="Stüdyolarla paylaştığın bağlantıları buradan yönetebilirsin."
    >
      <TeacherStudioLinksClient studioLinks={studioLinkItems} />
    </TeacherPanelSection>
  );
}
