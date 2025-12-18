import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin";
import { Card } from "@/components/design-system/components/ui/card";
import { Section } from "@/components/design-system/components/shared/section";

export const revalidate = 0;

async function getStats() {
  const [userCount, studioCount, teacherAppCount, teacherLeadCount, leadCount] = await Promise.all([
    prisma.user.count(),
    prisma.studio.count(),
    prisma.teacherApplication.count(),
    prisma.teacherLead.count(),
    prisma.lead.count(),
  ]);
  return { userCount, studioCount, teacherAppCount, teacherLeadCount, leadCount };
}

export default async function AdminHomePage() {
  await requireAdmin();
  const stats = await getStats();
  const audits = await prisma.adminAuditLog.findMany({
    orderBy: { createdAt: "desc" },
    take: 20,
  });

  return (
    <Section containerClassName="space-y-6">
      <div className="space-y-2">
        <p className="text-xs uppercase tracking-[0.2em] text-[var(--color-muted)]">Admin</p>
        <h1 className="text-2xl font-semibold text-[var(--color-primary)]">Kontrol Paneli</h1>
        <p className="text-sm text-[var(--color-muted)]">
          Kullanıcı, stüdyo ve başvuruların hızlı özetini gör. Değişiklikler audit log’da kayıt altına alınır.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard label="Kullanıcı" value={stats.userCount} />
        <StatCard label="Stüdyo" value={stats.studioCount} />
        <StatCard label="Hoca başvurusu" value={stats.teacherAppCount} />
        <StatCard label="Hoca lead" value={stats.teacherLeadCount} />
        <StatCard label="Genel lead" value={stats.leadCount} />
      </div>

      <Card className="space-y-3 p-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-[var(--color-primary)]">Son işlemler</h2>
          <p className="text-xs text-[var(--color-muted)]">Son 20 kayıt</p>
        </div>
        <div className="divide-y divide-[var(--color-border)]">
          {audits.length === 0 ? (
            <p className="p-3 text-sm text-[var(--color-muted)]">Kayıt yok.</p>
          ) : (
            audits.map((log) => (
              <div key={log.id} className="flex items-center justify-between py-2 text-sm">
                <div className="space-y-1">
                  <p className="font-medium text-[var(--color-primary)]">
                    {log.action} — {log.entityType} ({log.entityId})
                  </p>
                  <p className="text-[var(--color-muted)]">{new Date(log.createdAt).toLocaleString("tr-TR")}</p>
                </div>
                <span className="text-xs text-[var(--color-muted)]">{log.adminId}</span>
              </div>
            ))
          )}
        </div>
      </Card>
    </Section>
  );
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <Card className="p-4">
      <p className="text-sm text-[var(--color-muted)]">{label}</p>
      <p className="text-2xl font-semibold text-[var(--color-primary)]">{value}</p>
    </Card>
  );
}
