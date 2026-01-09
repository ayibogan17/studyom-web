import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin";
import { Section } from "@/components/design-system/components/shared/section";
import { Card } from "@/components/design-system/components/ui/card";

export const revalidate = 0;

export default async function AdminSettingsPage() {
  await requireAdmin();
  const flags = await prisma.systemFlag.findMany({ orderBy: { updatedAt: "desc" } });

  return (
    <Section containerClassName="space-y-4">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold text-[var(--color-primary)]">Ayarlar</h1>
        <p className="text-sm text-[var(--color-muted)]">Sistem bayrakları (placeholder).</p>
      </div>
      <Card className="p-4">
        {flags.length === 0 ? (
          <p className="text-sm text-[var(--color-muted)]">Tanımlı sistem bayrağı yok.</p>
        ) : (
          <div className="divide-y divide-[var(--color-border)] text-sm">
            {flags.map((flag) => (
              <div key={flag.id} className="flex items-center justify-between py-2">
                <span className="font-medium text-[var(--color-primary)]">{flag.key}</span>
                <span className="text-xs text-[var(--color-muted)]">
                  {flag.updatedAt.toLocaleString("tr-TR")}
                </span>
              </div>
            ))}
          </div>
        )}
      </Card>
    </Section>
  );
}
