import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin";
import { Card } from "@/components/design-system/components/ui/card";
import { Section } from "@/components/design-system/components/shared/section";

export const revalidate = 0;

const dayMs = 24 * 60 * 60 * 1000;

async function safeProducerApplicationCount() {
  try {
    const rows = await prisma.$queryRaw<{ count: bigint }[]>`
      SELECT COUNT(*)::bigint AS count FROM "ProducerApplication"
    `;
    const value = rows[0]?.count;
    return typeof value === "bigint" ? Number(value) : Number(value ?? 0);
  } catch (err) {
    console.error("producer application count failed", err);
    return 0;
  }
}

export default async function AdminHomePage() {
  await requireAdmin();
  const now = Date.now();
  const sevenDaysAgo = new Date(now - 7 * dayMs);
  const thirtyDaysAgo = new Date(now - 30 * dayMs);

  const [
    newUsers,
    teacherApps,
    producerApps,
    studioApps,
    contactEvents,
    studioMessageCount,
    teacherMessageCount,
    producerMessageCount,
    topStudios,
    topTeachers,
    topProducers,
  ] = await Promise.all([
    prisma.user.count({ where: { createdAt: { gte: sevenDaysAgo } } }),
    prisma.teacherApplication.count({ where: { createdAt: { gte: sevenDaysAgo } } }),
    safeProducerApplicationCount(),
    prisma.studio.count({ where: { createdAt: { gte: sevenDaysAgo } } }),
    prisma.contactEvent.groupBy({
      by: ["channel"],
      where: { createdAt: { gte: sevenDaysAgo } },
      _count: { _all: true },
    }),
    prisma.studioMessage.count({ where: { createdAt: { gte: sevenDaysAgo } } }),
    prisma.teacherMessage.count({ where: { createdAt: { gte: sevenDaysAgo } } }),
    prisma.producerMessage.count({ where: { createdAt: { gte: sevenDaysAgo } } }),
    prisma.contactEvent.groupBy({
      by: ["entityId"],
      where: { entityType: "studio", createdAt: { gte: thirtyDaysAgo } },
      _count: { _all: true },
      orderBy: { _count: { entityId: "desc" } },
      take: 10,
    }),
    prisma.contactEvent.groupBy({
      by: ["entityId"],
      where: { entityType: "teacher", createdAt: { gte: thirtyDaysAgo } },
      _count: { _all: true },
      orderBy: { _count: { entityId: "desc" } },
      take: 10,
    }),
    prisma.contactEvent.groupBy({
      by: ["entityId"],
      where: { entityType: "producer", createdAt: { gte: thirtyDaysAgo } },
      _count: { _all: true },
      orderBy: { _count: { entityId: "desc" } },
      take: 10,
    }),
  ]);

  const studioIds = topStudios.map((row) => row.entityId);
  const studios = studioIds.length
    ? await prisma.studio.findMany({
        where: { id: { in: studioIds } },
        select: { id: true, name: true, city: true },
      })
    : [];
  const studioMap = new Map(studios.map((studio) => [studio.id, studio]));

  const contactCounts = contactEvents.reduce<Record<string, number>>((acc, row) => {
    acc[row.channel] = row._count._all;
    return acc;
  }, {});

  const messageCount = studioMessageCount + teacherMessageCount + producerMessageCount;

  return (
    <Section containerClassName="space-y-6">
      <div className="space-y-2">
        <p className="text-xs uppercase tracking-[0.2em] text-[var(--color-muted)]">Admin</p>
        <h1 className="text-2xl font-semibold text-[var(--color-primary)]">Dashboard</h1>
        <p className="text-sm text-[var(--color-muted)]">
          Son 7 günün özetini ve son 30 günün performanslarını görüntüleyin.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Yeni kullanıcı" value={newUsers} sub="Son 7 gün" />
        <StatCard label="Yeni stüdyo başvurusu" value={studioApps} sub="Son 7 gün" />
        <StatCard label="Yeni hoca başvurusu" value={teacherApps} sub="Son 7 gün" />
        <StatCard label="Yeni üretici başvurusu" value={producerApps} sub="Son 7 gün" />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="space-y-3 p-4">
          <h2 className="text-lg font-semibold text-[var(--color-primary)]">İletişim kanalları</h2>
          <div className="space-y-2 text-sm text-[var(--color-muted)]">
            <StatLine label="Uygulama içi" value={contactCounts.in_app ?? 0} />
            <StatLine label="WhatsApp" value={contactCounts.whatsapp ?? 0} />
            <StatLine label="Telefon" value={contactCounts.phone ?? 0} />
          </div>
        </Card>
        <Card className="space-y-3 p-4">
          <h2 className="text-lg font-semibold text-[var(--color-primary)]">Mesaj sayısı</h2>
          <p className="text-3xl font-semibold text-[var(--color-primary)]">{messageCount}</p>
          <p className="text-xs text-[var(--color-muted)]">Stüdyo + hoca + üretici mesajları (son 7 gün)</p>
        </Card>
        <Card className="space-y-3 p-4">
          <h2 className="text-lg font-semibold text-[var(--color-primary)]">Uyarılar</h2>
          <ul className="space-y-2 text-sm text-[var(--color-muted)]">
            <li>Yüksek reddedilme oranlı ilanlar: Yakında</li>
            <li>Şikayeti olan ilanlar: Yakında</li>
          </ul>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <TopList
          title="En çok etkileşim alan stüdyolar"
          rows={topStudios.map((row) => ({
            id: row.entityId,
            label: studioMap.get(row.entityId)?.name || row.entityId,
            detail: studioMap.get(row.entityId)?.city || "-",
            value: row._count._all,
          }))}
          empty="Stüdyo etkinliği yok."
        />
        <TopList
          title="En çok etkileşim alan hocalar"
          rows={topTeachers.map((row) => ({
            id: row.entityId,
            label: row.entityId,
            detail: "Hoca",
            value: row._count._all,
          }))}
          empty="Hoca etkinliği yok."
        />
        <TopList
          title="En çok etkileşim alan üreticiler"
          rows={topProducers.map((row) => ({
            id: row.entityId,
            label: row.entityId,
            detail: "Üretici",
            value: row._count._all,
          }))}
          empty="Üretici etkinliği yok."
        />
      </div>
    </Section>
  );
}

function StatCard({ label, value, sub }: { label: string; value: number; sub?: string }) {
  return (
    <Card className="space-y-2 p-4">
      <p className="text-sm text-[var(--color-muted)]">{label}</p>
      <p className="text-2xl font-semibold text-[var(--color-primary)]">{value}</p>
      {sub ? <p className="text-xs text-[var(--color-muted)]">{sub}</p> : null}
    </Card>
  );
}

function StatLine({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex items-center justify-between">
      <span>{label}</span>
      <span className="font-semibold text-[var(--color-primary)]">{value}</span>
    </div>
  );
}

function TopList({
  title,
  rows,
  empty,
}: {
  title: string;
  rows: Array<{ id: string; label: string; detail: string; value: number }>;
  empty: string;
}) {
  return (
    <Card className="space-y-3 p-4">
      <h2 className="text-lg font-semibold text-[var(--color-primary)]">{title}</h2>
      {rows.length === 0 ? (
        <p className="text-sm text-[var(--color-muted)]">{empty}</p>
      ) : (
        <div className="space-y-2 text-sm">
          {rows.map((row) => (
            <div key={row.id} className="flex items-center justify-between">
              <div>
                <p className="font-medium text-[var(--color-primary)]">{row.label}</p>
                <p className="text-xs text-[var(--color-muted)]">{row.detail}</p>
              </div>
              <span className="font-semibold text-[var(--color-primary)]">{row.value}</span>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}
