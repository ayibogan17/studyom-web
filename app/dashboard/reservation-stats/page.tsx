import { getServerSession } from "next-auth";
import Link from "next/link";
import { redirect } from "next/navigation";
import { authOptions } from "@/auth";
import { prisma } from "@/lib/prisma";
import { isBlockingBlock, normalizeOpeningHours, type OpeningHours } from "@/lib/studio-availability";
import { buildHappyHourTemplatesByRoom, type HappyHourSlot } from "@/lib/happy-hour";

export const metadata = {
  title: "Rezervasyon İstatistikleri | Studyom",
  description: "Stüdyonuzun haftalık ve aylık doluluk özetleri.",
};

const weekdayIndex = (d: Date) => (d.getDay() + 6) % 7;

const minutesFromTime = (value: string) => {
  const [h, m] = value.split(":").map(Number);
  const hours = Number.isFinite(h) ? h : 0;
  const minutes = Number.isFinite(m) ? m : 0;
  return hours * 60 + minutes;
};

const getBusinessDayStart = (date: Date, cutoffHour: number) => {
  const base = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const minutes = date.getHours() * 60 + date.getMinutes();
  if (minutes < cutoffHour * 60) {
    base.setDate(base.getDate() - 1);
  }
  return base;
};

const getOpenRangeForDay = (day: Date, openingHours: OpeningHours[]) => {
  const info = openingHours[weekdayIndex(day)];
  if (!info || !info.open) return null;
  const start = minutesFromTime(info.openTime);
  let end = minutesFromTime(info.closeTime);
  if (end <= start) end += 24 * 60;
  return { start, end };
};

const getIstanbulNow = () =>
  new Date(new Date().toLocaleString("en-US", { timeZone: "Europe/Istanbul" }));

const startOfWeek = (date: Date) => {
  const d = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  d.setDate(d.getDate() - weekdayIndex(d));
  d.setHours(0, 0, 0, 0);
  return d;
};

const startOfMonth = (date: Date) => {
  const d = new Date(date.getFullYear(), date.getMonth(), 1);
  d.setHours(0, 0, 0, 0);
  return d;
};

const monthKeyFromDate = (date: Date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;

const parseMonthKey = (value: string | null | undefined, fallback: Date) => {
  if (!value) return startOfMonth(fallback);
  const match = value.match(/^(\d{4})-(\d{2})$/);
  if (!match) return startOfMonth(fallback);
  const year = Number.parseInt(match[1], 10);
  const month = Number.parseInt(match[2], 10) - 1;
  if (!Number.isFinite(year) || !Number.isFinite(month) || month < 0 || month > 11) {
    return startOfMonth(fallback);
  }
  return startOfMonth(new Date(year, month, 1));
};

const formatMonthLabel = (date: Date) =>
  date.toLocaleString("tr-TR", { month: "long", year: "numeric" });

const formatPercent = (value: number) =>
  Number.isInteger(value) ? `${value}%` : `${value.toFixed(1)}%`;

const formatCurrency = (value: number) =>
  `${Math.round(value).toLocaleString("tr-TR")} TL`;

const parsePrice = (value?: string | null) => {
  if (!value) return null;
  const normalized = value.replace(/[^\d.,]/g, "").replace(",", ".");
  const num = Number.parseFloat(normalized);
  return Number.isFinite(num) ? num : null;
};

const getTotalOpenMinutes = (openingHours: OpeningHours[], rangeStart: Date, rangeEnd: Date) => {
  let minutes = 0;
  const cursor = new Date(rangeStart);
  while (cursor < rangeEnd) {
    const range = getOpenRangeForDay(cursor, openingHours);
    if (range) {
      minutes += Math.max(0, range.end - range.start);
    }
    cursor.setDate(cursor.getDate() + 1);
  }
  return minutes;
};

const getOccupiedMinutes = (
  blocks: { startAt: Date; endAt: Date; type: string | null; status: string | null }[],
  openingHours: OpeningHours[],
  cutoffHour: number,
  rangeStart: Date,
  rangeEnd: Date,
) => {
  const rangeStartMs = rangeStart.getTime();
  const rangeEndMs = rangeEnd.getTime();
  return blocks.reduce((acc, block) => {
    if (!isBlockingBlock(block)) return acc;
    const start = new Date(block.startAt);
    const end = new Date(block.endAt);
    const clampedStart = Math.max(start.getTime(), rangeStartMs);
    const clampedEnd = Math.min(end.getTime(), rangeEndMs);
    if (clampedEnd <= clampedStart) return acc;
    const businessStart = getBusinessDayStart(new Date(clampedStart), cutoffHour);
    const openRange = getOpenRangeForDay(businessStart, openingHours);
    if (!openRange) return acc;
    const openStartMs = businessStart.getTime() + openRange.start * 60000;
    const openEndMs = businessStart.getTime() + openRange.end * 60000;
    const finalStart = Math.max(clampedStart, openStartMs);
    const finalEnd = Math.min(clampedEnd, openEndMs);
    if (finalEnd <= finalStart) return acc;
    return acc + (finalEnd - finalStart) / 60000;
  }, 0);
};

type ReservationStatsSearchParams = { compareA?: string; compareB?: string; as?: string; calc?: string };

export default async function ReservationStatsPage({
  searchParams,
}: {
  searchParams?: ReservationStatsSearchParams | Promise<ReservationStatsSearchParams>;
}) {
  const resolvedSearchParams = await Promise.resolve(searchParams);
  const session = await getServerSession(authOptions);
  const email = session?.user?.email?.toLowerCase();
  if (!email) redirect("/login");

  const studio = await prisma.studio.findFirst({
    where: { ownerEmail: email },
    select: {
      id: true,
      name: true,
      city: true,
      openingHours: true,
      calendarSettings: { select: { weeklyHours: true, dayCutoffHour: true } },
      rooms: {
        select: {
          id: true,
          name: true,
          pricingModel: true,
          hourlyRate: true,
          flatRate: true,
          minRate: true,
          dailyRate: true,
          happyHourRate: true,
        },
        orderBy: { order: "asc" },
      },
    },
  });
  if (!studio) redirect("/studio/new");

  const shouldCompute = resolvedSearchParams?.calc === "1";
  const computeParams = new URLSearchParams();
  if (typeof resolvedSearchParams?.compareA === "string") {
    computeParams.set("compareA", resolvedSearchParams.compareA);
  }
  if (typeof resolvedSearchParams?.compareB === "string") {
    computeParams.set("compareB", resolvedSearchParams.compareB);
  }
  if (typeof resolvedSearchParams?.as === "string") {
    computeParams.set("as", resolvedSearchParams.as);
  }
  computeParams.set("calc", "1");
  const computeUrl = `/dashboard/reservation-stats?${computeParams.toString()}`;

  const openingHours = normalizeOpeningHours(
    (studio.calendarSettings?.weeklyHours as OpeningHours[] | null | undefined) ??
      (studio.openingHours as OpeningHours[] | null | undefined),
  );
  const dayCutoffHour = studio.calendarSettings?.dayCutoffHour ?? 4;

  const now = getIstanbulNow();
  const weekStart = startOfWeek(now);
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 7);
  const monthStart = startOfMonth(now);
  const monthEnd = new Date(monthStart.getFullYear(), monthStart.getMonth() + 1, 1);

  const defaultMonthKey = monthKeyFromDate(now);
  const compareAKey =
    typeof resolvedSearchParams?.compareA === "string" ? resolvedSearchParams.compareA : defaultMonthKey;
  const compareBKey =
    typeof resolvedSearchParams?.compareB === "string" ? resolvedSearchParams.compareB : defaultMonthKey;
  const compareAStart = parseMonthKey(compareAKey, now);
  const compareBStart = parseMonthKey(compareBKey, now);
  const compareAEnd = new Date(compareAStart.getFullYear(), compareAStart.getMonth() + 1, 1);
  const compareBEnd = new Date(compareBStart.getFullYear(), compareBStart.getMonth() + 1, 1);

  const rangeStart = new Date(
    Math.min(weekStart.getTime(), monthStart.getTime(), compareAStart.getTime(), compareBStart.getTime()),
  );
  const rangeEnd = new Date(
    Math.max(weekEnd.getTime(), monthEnd.getTime(), compareAEnd.getTime(), compareBEnd.getTime()),
  );

  const blocks = shouldCompute
    ? await prisma.studioCalendarBlock.findMany({
        where: {
          studioId: studio.id,
          startAt: { lt: rangeEnd },
          endAt: { gt: rangeStart },
        },
        select: { roomId: true, startAt: true, endAt: true, type: true, status: true },
      })
    : [];

  const totalWeekOpenMinutes = shouldCompute
    ? getTotalOpenMinutes(openingHours, weekStart, weekEnd) * studio.rooms.length
    : 0;
  const totalMonthOpenMinutes = shouldCompute
    ? getTotalOpenMinutes(openingHours, monthStart, monthEnd) * studio.rooms.length
    : 0;

  const totalWeekOccupied = shouldCompute
    ? getOccupiedMinutes(blocks, openingHours, dayCutoffHour, weekStart, weekEnd)
    : 0;
  const totalMonthOccupied = shouldCompute
    ? getOccupiedMinutes(blocks, openingHours, dayCutoffHour, monthStart, monthEnd)
    : 0;

  const totalWeekOccupancy =
    totalWeekOpenMinutes === 0 ? 0 : Math.round((totalWeekOccupied / totalWeekOpenMinutes) * 1000) / 10;
  const totalMonthOccupancy =
    totalMonthOpenMinutes === 0 ? 0 : Math.round((totalMonthOccupied / totalMonthOpenMinutes) * 1000) / 10;

  const compareMonthOccupancy = (rangeStart: Date, rangeEnd: Date) => {
    const totalOpenMinutes = getTotalOpenMinutes(openingHours, rangeStart, rangeEnd) * studio.rooms.length;
    const occupiedMinutes = getOccupiedMinutes(blocks, openingHours, dayCutoffHour, rangeStart, rangeEnd);
    return totalOpenMinutes === 0 ? 0 : Math.round((occupiedMinutes / totalOpenMinutes) * 1000) / 10;
  };

  const priceByRoomId = new Map(
    studio.rooms.map((room) => [
      room.id,
      parsePrice(room.hourlyRate) ??
        parsePrice(room.flatRate) ??
        parsePrice(room.minRate) ??
        parsePrice(room.dailyRate) ??
        0,
    ]),
  );
  const happyHourPriceById = new Map(
    studio.rooms.map((room) => {
      const base =
        parsePrice(room.hourlyRate) ??
        parsePrice(room.flatRate) ??
        parsePrice(room.minRate) ??
        parsePrice(room.dailyRate) ??
        0;
      const happy = parsePrice(room.happyHourRate);
      return [room.id, happy ?? base] as const;
    }),
  );

  const happyHourSlots = shouldCompute
    ? await prisma.studioHappyHourSlot.findMany({
        where: { studioId: studio.id },
        select: { roomId: true, startAt: true, endAt: true },
      })
    : [];
  const happyHourByRoom: Map<
    string,
    Array<{ weekday: number; startMinutes: number; endMinutes: number }>
  > = shouldCompute
    ? buildHappyHourTemplatesByRoom(
        happyHourSlots.map((slot) => ({
          roomId: slot.roomId,
          startAt: slot.startAt,
          endAt: slot.endAt,
        })) as HappyHourSlot[],
        openingHours,
        dayCutoffHour,
      )
    : new Map();

  const getBlockRevenue = (
    block: { startAt: Date; endAt: Date; roomId: string; type?: string | null; status?: string | null },
    rangeStart: Date,
    rangeEnd: Date,
  ) => {
    if (!isBlockingBlock(block)) return 0;
    const start = new Date(block.startAt);
    const end = new Date(block.endAt);
    if (end <= rangeStart || start >= rangeEnd) return 0;
    const clampedStart = Math.max(start.getTime(), rangeStart.getTime());
    const clampedEnd = Math.min(end.getTime(), rangeEnd.getTime());
    if (clampedEnd <= clampedStart) return 0;
    const hourly = priceByRoomId.get(block.roomId ?? "") ?? 0;
    if (!hourly) return 0;
    const happyHourly = happyHourPriceById.get(block.roomId ?? "") ?? hourly;
    const businessStart = getBusinessDayStart(new Date(clampedStart), dayCutoffHour);
    const weekday = weekdayIndex(businessStart);
    const blockStartMinutes = (clampedStart - businessStart.getTime()) / 60000;
    const blockEndMinutes = (clampedEnd - businessStart.getTime()) / 60000;
    const templates =
      happyHourByRoom.get(block.roomId ?? "") ??
      ([] as Array<{ weekday: number; startMinutes: number; endMinutes: number }>);
    let happyMinutes = 0;
    templates.forEach((tpl) => {
      if (tpl.weekday !== weekday) return;
      const overlapStart = Math.max(blockStartMinutes, tpl.startMinutes);
      const overlapEnd = Math.min(blockEndMinutes, tpl.endMinutes);
      if (overlapEnd > overlapStart) {
        happyMinutes += overlapEnd - overlapStart;
      }
    });
    const totalMinutes = Math.max(0, blockEndMinutes - blockStartMinutes);
    const normalMinutes = Math.max(0, totalMinutes - happyMinutes);
    return (happyMinutes / 60) * happyHourly + (normalMinutes / 60) * hourly;
  };

  const getRevenueForRange = (rangeStart: Date, rangeEnd: Date) =>
    blocks.reduce((acc, block) => acc + getBlockRevenue(block, rangeStart, rangeEnd), 0);

  const compareAOccupancy = shouldCompute ? compareMonthOccupancy(compareAStart, compareAEnd) : 0;
  const compareBOccupancy = shouldCompute ? compareMonthOccupancy(compareBStart, compareBEnd) : 0;
  const compareARevenue = shouldCompute ? getRevenueForRange(compareAStart, compareAEnd) : 0;
  const compareBRevenue = shouldCompute ? getRevenueForRange(compareBStart, compareBEnd) : 0;

  const monthOptions = Array.from({ length: 25 }, (_, idx) => {
    const offset = idx - 12;
    const date = new Date(now.getFullYear(), now.getMonth() + offset, 1);
    return {
      key: monthKeyFromDate(date),
      label: formatMonthLabel(date),
    };
  });

  const roomStats = studio.rooms.map((room) => {
    const roomBlocks = blocks.filter((block) => block.roomId === room.id);
    const roomWeekOpen = shouldCompute ? getTotalOpenMinutes(openingHours, weekStart, weekEnd) : 0;
    const roomMonthOpen = shouldCompute ? getTotalOpenMinutes(openingHours, monthStart, monthEnd) : 0;
    const roomWeekOcc = shouldCompute
      ? getOccupiedMinutes(roomBlocks, openingHours, dayCutoffHour, weekStart, weekEnd)
      : 0;
    const roomMonthOcc = shouldCompute
      ? getOccupiedMinutes(roomBlocks, openingHours, dayCutoffHour, monthStart, monthEnd)
      : 0;
    const weekOccupancy =
      roomWeekOpen === 0 ? 0 : Math.round((roomWeekOcc / roomWeekOpen) * 1000) / 10;
    const monthOccupancy =
      roomMonthOpen === 0 ? 0 : Math.round((roomMonthOcc / roomMonthOpen) * 1000) / 10;

    const price =
      parsePrice(room.hourlyRate) ??
      parsePrice(room.flatRate) ??
      parsePrice(room.minRate) ??
      parsePrice(room.dailyRate) ??
      0;
    const monthRevenue = shouldCompute
      ? roomBlocks.reduce((acc, block) => acc + getBlockRevenue(block, monthStart, monthEnd), 0)
      : 0;

    return {
      id: room.id,
      name: room.name || "Oda",
      weekOccupancy,
      monthOccupancy,
      monthRevenue,
      price,
    };
  });

  return (
    <div className="bg-gradient-to-b from-white via-orange-50/60 to-white">
      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="mb-6">
          <p className="text-xs font-semibold uppercase tracking-wide text-orange-700">
            Rezervasyon istatistikleri
          </p>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h1 className="text-2xl font-semibold text-orange-950">
              {studio.name}
              {studio.city ? ` · ${studio.city}` : ""}
            </h1>
            <Link
              href={computeUrl}
              className="inline-flex h-9 items-center justify-center rounded-full border border-orange-200 bg-white px-4 text-xs font-semibold text-orange-800 transition hover:border-orange-300 hover:text-orange-900"
            >
              Hesapla
            </Link>
          </div>
          <p className="mt-1 text-sm text-orange-700">
            Haftalık ve aylık doluluk özetleri.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <div className="rounded-2xl border border-orange-200/60 bg-orange-50/80 p-4">
            <p className="text-sm font-semibold text-orange-900">Bu haftaki doluluk</p>
            <p className="mt-2 text-2xl font-semibold text-orange-950">
              {shouldCompute ? formatPercent(totalWeekOccupancy) : "Hesaplanmadı"}
            </p>
          </div>
          <div className="rounded-2xl border border-orange-200/60 bg-orange-50/80 p-4">
            <p className="text-sm font-semibold text-orange-900">Bu ayki doluluk</p>
            <p className="mt-2 text-2xl font-semibold text-orange-950">
              {shouldCompute ? formatPercent(totalMonthOccupancy) : "Hesaplanmadı"}
            </p>
          </div>
          <div className="rounded-2xl border border-orange-200/60 bg-orange-50/80 p-4">
            <p className="text-sm font-semibold text-orange-900">Tahmini aylık gelir</p>
            <p className="mt-2 text-2xl font-semibold text-orange-950">
              {shouldCompute
                ? formatCurrency(roomStats.reduce((acc, room) => acc + room.monthRevenue, 0))
                : "Hesaplanmadı"}
            </p>
          </div>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-2">
          {roomStats.map((room) => (
            <div
              key={room.id}
              className="rounded-2xl border border-orange-200/50 bg-orange-50/70 p-5 shadow-sm"
            >
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-orange-950">{room.name}</p>
                <span className="rounded-full border border-orange-200 px-2 py-1 text-xs font-semibold text-orange-700">
                  {room.price ? `${room.price}₺/saat` : "Fiyat yok"}
                </span>
              </div>
              <div className="mt-4 grid gap-3 sm:grid-cols-3">
                <div className="rounded-xl border border-orange-200/60 bg-orange-50/80 p-3">
                  <p className="text-xs font-semibold text-orange-700">Bu hafta</p>
                  <p className="mt-1 text-lg font-semibold text-orange-950">
                    {shouldCompute ? formatPercent(room.weekOccupancy) : "Hesaplanmadı"}
                  </p>
                </div>
                <div className="rounded-xl border border-orange-200/60 bg-orange-50/80 p-3">
                  <p className="text-xs font-semibold text-orange-700">Bu ay</p>
                  <p className="mt-1 text-lg font-semibold text-orange-950">
                    {shouldCompute ? formatPercent(room.monthOccupancy) : "Hesaplanmadı"}
                  </p>
                </div>
                <div className="rounded-xl border border-orange-200/60 bg-orange-50/80 p-3">
                  <p className="text-xs font-semibold text-orange-700">Aylık gelir</p>
                  <p className="mt-1 text-lg font-semibold text-orange-950">
                    {shouldCompute ? formatCurrency(room.monthRevenue) : "Hesaplanmadı"}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-8 rounded-2xl border border-orange-200/60 bg-orange-50/80 p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-orange-700">
                İstatistikleri Karşılaştır
              </p>
              <p className="text-sm text-orange-700">
                İki ay seçerek doluluk oranlarını karşılaştırabilirsin.
              </p>
            </div>
            <span className="text-xs font-semibold text-orange-600">
              {shouldCompute
                ? `${formatPercent(compareAOccupancy)} · ${formatPercent(compareBOccupancy)}`
                : "Hesaplanmadı"}
            </span>
          </div>

          <form className="mt-4 grid gap-4 md:grid-cols-2" method="get">
            {resolvedSearchParams?.as ? (
              <input type="hidden" name="as" value={resolvedSearchParams.as} />
            ) : null}
            <div className="rounded-2xl border border-orange-200/60 bg-white/80 p-4">
              <label className="text-xs font-semibold text-orange-700" htmlFor="compareA">
                1. Ay seçimi
              </label>
              <select
                id="compareA"
                name="compareA"
                defaultValue={compareAKey}
                className="mt-2 h-11 w-full rounded-xl border border-orange-200 bg-white px-3 text-sm font-semibold text-orange-950 focus:border-orange-400 focus:outline-none"
              >
                {monthOptions.map((option) => (
                  <option key={option.key} value={option.key}>
                    {option.label}
                  </option>
                ))}
              </select>
              <div className="mt-2 text-sm text-orange-700">
                <p>
                  Doluluk:{" "}
                  <span className="font-semibold">
                    {shouldCompute ? formatPercent(compareAOccupancy) : "Hesaplanmadı"}
                  </span>
                </p>
                <p>
                  Tahmini gelir:{" "}
                  <span className="font-semibold">
                    {shouldCompute ? formatCurrency(compareARevenue) : "Hesaplanmadı"}
                  </span>
                </p>
              </div>
            </div>

            <div className="rounded-2xl border border-orange-200/60 bg-white/80 p-4">
              <label className="text-xs font-semibold text-orange-700" htmlFor="compareB">
                2. Ay seçimi
              </label>
              <select
                id="compareB"
                name="compareB"
                defaultValue={compareBKey}
                className="mt-2 h-11 w-full rounded-xl border border-orange-200 bg-white px-3 text-sm font-semibold text-orange-950 focus:border-orange-400 focus:outline-none"
              >
                {monthOptions.map((option) => (
                  <option key={option.key} value={option.key}>
                    {option.label}
                  </option>
                ))}
              </select>
              <div className="mt-2 text-sm text-orange-700">
                <p>
                  Doluluk:{" "}
                  <span className="font-semibold">
                    {shouldCompute ? formatPercent(compareBOccupancy) : "Hesaplanmadı"}
                  </span>
                </p>
                <p>
                  Tahmini gelir:{" "}
                  <span className="font-semibold">
                    {shouldCompute ? formatCurrency(compareBRevenue) : "Hesaplanmadı"}
                  </span>
                </p>
              </div>
            </div>

            <div className="md:col-span-2 flex justify-end">
              <button
                type="submit"
                className="h-11 rounded-xl bg-orange-600 px-6 text-sm font-semibold text-white shadow-sm transition hover:bg-orange-700"
              >
                Karşılaştır
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
