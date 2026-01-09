import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin";
import { Section } from "@/components/design-system/components/shared/section";
import { Card } from "@/components/design-system/components/ui/card";

export const revalidate = 0;

function formatDate(value: Date) {
  return value.toISOString().slice(0, 10);
}

export default async function AdminAnalyticsPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  await requireAdmin();
  const params = await searchParams;
  const now = new Date();
  const defaultFrom = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  const fromParam = typeof params.from === "string" ? params.from : "";
  const toParam = typeof params.to === "string" ? params.to : "";
  const entityType = typeof params.entityType === "string" ? params.entityType : "studio";
  const city = typeof params.city === "string" ? params.city : "";

  const fromDate = fromParam ? new Date(fromParam) : defaultFrom;
  const toDate = toParam ? new Date(toParam) : now;

  let events = await prisma.contactEvent.findMany({
    where: {
      createdAt: { gte: fromDate, lte: toDate },
      entityType: entityType ? entityType : undefined,
    },
    select: { id: true, entityType: true, entityId: true, channel: true, createdAt: true },
  });

  if (city) {
    const studioIds = Array.from(
      new Set(events.filter((event) => event.entityType === "studio").map((event) => event.entityId)),
    );
    const studios = studioIds.length
      ? await prisma.studio.findMany({
          where: { id: { in: studioIds }, city },
          select: { id: true },
        })
      : [];
    const studioSet = new Set(studios.map((studio) => studio.id));
    events = events.filter((event) => event.entityType === "studio" && studioSet.has(event.entityId));
  }

  const byDay = new Map<string, number>();
  events.forEach((event) => {
    const key = event.createdAt.toISOString().slice(0, 10);
    byDay.set(key, (byDay.get(key) ?? 0) + 1);
  });

  const topMap = new Map<string, number>();
  events.forEach((event) => {
    const key = `${event.entityType}:${event.entityId}`;
    topMap.set(key, (topMap.get(key) ?? 0) + 1);
  });
  const topList = Array.from(topMap.entries())
    .map(([key, value]) => {
      const [type, id] = key.split(":");
      return { type, id, value };
    })
    .sort((a, b) => b.value - a.value)
    .slice(0, 10);

  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const activeStudioEvents = await prisma.contactEvent.findMany({
    where: { entityType: "studio", createdAt: { gte: thirtyDaysAgo } },
    select: { entityId: true },
  });
  const activeStudioSet = new Set(activeStudioEvents.map((event) => event.entityId));
  const inactiveStudios = await prisma.studio.findMany({
    where: { visibilityStatus: "published" },
    select: { id: true, name: true, city: true },
  });
  const inactiveList = inactiveStudios.filter((studio) => !activeStudioSet.has(studio.id));

  return (
    <Section containerClassName="space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold text-[var(--color-primary)]">Analitik</h1>
        <p className="text-sm text-[var(--color-muted)]">İletişim ve performans metriklerini takip edin.</p>
      </div>

      <Card className="space-y-4 p-4">
        <form className="grid gap-3 md:grid-cols-4">
          <label className="space-y-1 text-xs text-[var(--color-muted)]">
            Tarih başlangıç
            <input
              type="date"
              name="from"
              defaultValue={formatDate(fromDate)}
              className="mt-1 h-9 w-full rounded-lg border border-[var(--color-border)] bg-transparent px-2 text-[var(--color-primary)]"
            />
          </label>
          <label className="space-y-1 text-xs text-[var(--color-muted)]">
            Tarih bitiş
            <input
              type="date"
              name="to"
              defaultValue={formatDate(toDate)}
              className="mt-1 h-9 w-full rounded-lg border border-[var(--color-border)] bg-transparent px-2 text-[var(--color-primary)]"
            />
          </label>
          <label className="space-y-1 text-xs text-[var(--color-muted)]">
            Tür
            <select
              name="entityType"
              defaultValue={entityType}
              className="mt-1 h-9 w-full rounded-lg border border-[var(--color-border)] bg-transparent px-2 text-[var(--color-primary)]"
            >
              <option value="studio">Stüdyo</option>
              <option value="teacher">Hoca</option>
              <option value="producer">Üretici</option>
            </select>
          </label>
          <label className="space-y-1 text-xs text-[var(--color-muted)]">
            Şehir
            <input
              type="text"
              name="city"
              defaultValue={city}
              placeholder="İstanbul"
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
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="space-y-3 p-4">
          <h2 className="text-lg font-semibold text-[var(--color-primary)]">Günlük temaslar</h2>
          {byDay.size === 0 ? (
            <p className="text-sm text-[var(--color-muted)]">Kayıt yok.</p>
          ) : (
            <div className="divide-y divide-[var(--color-border)] text-sm">
              {Array.from(byDay.entries())
                .sort(([a], [b]) => a.localeCompare(b))
                .map(([date, count]) => (
                <div key={date} className="flex items-center justify-between py-2">
                  <span>{date}</span>
                  <span className="font-semibold text-[var(--color-primary)]">{count}</span>
                </div>
              ))}
            </div>
          )}
        </Card>
        <Card className="space-y-3 p-4">
          <h2 className="text-lg font-semibold text-[var(--color-primary)]">Top performers</h2>
          {topList.length === 0 ? (
            <p className="text-sm text-[var(--color-muted)]">Kayıt yok.</p>
          ) : (
            <div className="divide-y divide-[var(--color-border)] text-sm">
              {topList.map((item) => (
                <div key={`${item.type}-${item.id}`} className="flex items-center justify-between py-2">
                  <span>{item.type} · {item.id}</span>
                  <span className="font-semibold text-[var(--color-primary)]">{item.value}</span>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      <Card className="space-y-3 p-4">
        <h2 className="text-lg font-semibold text-[var(--color-primary)]">30 gün temas almayan stüdyolar</h2>
        {inactiveList.length === 0 ? (
          <p className="text-sm text-[var(--color-muted)]">Tüm stüdyolar aktif.</p>
        ) : (
          <div className="divide-y divide-[var(--color-border)] text-sm">
            {inactiveList.map((studio) => (
              <div key={studio.id} className="flex items-center justify-between py-2">
                <span>{studio.name}</span>
                <span className="text-[var(--color-muted)]">{studio.city || "-"}</span>
              </div>
            ))}
          </div>
        )}
      </Card>
    </Section>
  );
}
