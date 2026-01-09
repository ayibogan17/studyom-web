import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin";
import { Section } from "@/components/design-system/components/shared/section";
import { Card } from "@/components/design-system/components/ui/card";
import ContentClient from "./content-client";

export const revalidate = 0;

export default async function AdminContentPage() {
  await requireAdmin();
  const blocks = await prisma.contentBlock.findMany({
    orderBy: { updatedAt: "desc" },
  });

  return (
    <Section containerClassName="space-y-4">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold text-[var(--color-primary)]">İçerik Blokları</h1>
        <p className="text-sm text-[var(--color-muted)]">SEO ve FAQ içeriklerini yönetin.</p>
      </div>
      <Card className="p-4">
        <ContentClient blocks={blocks} />
      </Card>
    </Section>
  );
}
