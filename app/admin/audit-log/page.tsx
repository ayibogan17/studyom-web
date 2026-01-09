import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin";
import { Section } from "@/components/design-system/components/shared/section";
import { Card } from "@/components/design-system/components/ui/card";

export const revalidate = 0;

function formatDate(value: Date) {
  return value.toISOString().slice(0, 10);
}

export default async function AdminAuditLogPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  await requireAdmin();
  const params = await searchParams;
  const action = typeof params.action === "string" ? params.action : "";
  const adminId = typeof params.adminId === "string" ? params.adminId : "";
  const fromParam = typeof params.from === "string" ? params.from : "";
  const toParam = typeof params.to === "string" ? params.to : "";
  const now = new Date();
  const fromDate = fromParam ? new Date(fromParam) : new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);
  const toDate = toParam ? new Date(toParam) : now;

  const logs = await prisma.adminAuditLog.findMany({
    where: {
      createdAt: { gte: fromDate, lte: toDate },
      action: action ? { contains: action, mode: "insensitive" } : undefined,
      adminId: adminId || undefined,
    },
    orderBy: { createdAt: "desc" },
    take: 200,
  });

  return (
    <Section containerClassName="space-y-4">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold text-[var(--color-primary)]">Audit Log</h1>
        <p className="text-sm text-[var(--color-muted)]">Admin işlemleri ve inceleme kayıtları.</p>
      </div>
      <Card className="space-y-3 p-4">
        <form className="grid gap-3 md:grid-cols-4">
          <label className="space-y-1 text-xs text-[var(--color-muted)]">
            Aksiyon
            <input
              type="text"
              name="action"
              defaultValue={action}
              className="mt-1 h-9 w-full rounded-lg border border-[var(--color-border)] bg-transparent px-2 text-[var(--color-primary)]"
            />
          </label>
          <label className="space-y-1 text-xs text-[var(--color-muted)]">
            Admin ID
            <input
              type="text"
              name="adminId"
              defaultValue={adminId}
              className="mt-1 h-9 w-full rounded-lg border border-[var(--color-border)] bg-transparent px-2 text-[var(--color-primary)]"
            />
          </label>
          <label className="space-y-1 text-xs text-[var(--color-muted)]">
            Başlangıç
            <input
              type="date"
              name="from"
              defaultValue={formatDate(fromDate)}
              className="mt-1 h-9 w-full rounded-lg border border-[var(--color-border)] bg-transparent px-2 text-[var(--color-primary)]"
            />
          </label>
          <label className="space-y-1 text-xs text-[var(--color-muted)]">
            Bitiş
            <input
              type="date"
              name="to"
              defaultValue={formatDate(toDate)}
              className="mt-1 h-9 w-full rounded-lg border border-[var(--color-border)] bg-transparent px-2 text-[var(--color-primary)]"
            />
          </label>
          <div className="md:col-span-4 flex justify-end">
            <button
              type="submit"
              className="rounded-lg bg-[var(--color-accent)] px-3 py-2 text-xs font-semibold text-white"
            >
              Filtrele
            </button>
          </div>
        </form>
        <div className="divide-y divide-[var(--color-border)] text-sm">
          {logs.length === 0 ? (
            <p className="p-3 text-sm text-[var(--color-muted)]">Kayıt yok.</p>
          ) : (
            logs.map((log) => (
              <div key={log.id} className="flex items-center justify-between gap-4 py-2">
                <div className="space-y-1">
                  <p className="font-medium text-[var(--color-primary)]">
                    {log.action} — {log.entityType} ({log.entityId})
                  </p>
                  <p className="text-xs text-[var(--color-muted)]">
                    {new Date(log.createdAt).toLocaleString("tr-TR")}
                  </p>
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
