import { getServerSession } from "next-auth";
import Link from "next/link";
import { redirect } from "next/navigation";
import { authOptions } from "@/auth";
import { prisma } from "@/lib/prisma";
import { isBlockingBlock, normalizeOpeningHours, type OpeningHours } from "@/lib/studio-availability";
import { buildHappyHourTemplatesByRoom, type HappyHourSlot } from "@/lib/happy-hour";
import { ExpensesEditor } from "./expenses-editor";

export const metadata = {
  title: "Rezervasyon İstatistikleri | Studyom",
  description: "Stüdyonuzun haftalık ve aylık doluluk özetleri.",
  robots: { index: false, follow: false },
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

type ExpenseItem = {
  label: string;
  amount: number;
};

const normalizeExpenseItems = (value: unknown): ExpenseItem[] => {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => {
      if (!item || typeof item !== "object") return null;
      const rawLabel = "label" in item ? item.label : "";
      const rawAmount = "amount" in item ? item.amount : 0;
      const label = typeof rawLabel === "string" ? rawLabel.trim() : "";
      const amount =
        typeof rawAmount === "number"
          ? rawAmount
          : typeof rawAmount === "string"
            ? Number.parseFloat(rawAmount.replace(/[^\d.,-]/g, "").replace(",", "."))
            : 0;
      if (!label && !Number.isFinite(amount)) return null;
      return {
        label,
        amount: Number.isFinite(amount) ? amount : 0,
      } satisfies ExpenseItem;
    })
    .filter((item): item is ExpenseItem => Boolean(item));
};

const getExpenseTotal = (items: ExpenseItem[]) =>
  items.reduce((sum, item) => sum + (Number.isFinite(item.amount) ? item.amount : 0), 0);

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

type ReservationStatsSearchParams = {
  compareA?: string;
  compareB?: string;
  roomId?: string;
  month?: string;
  as?: string;
  calc?: string;
};

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
          extrasJson: true,
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
  if (typeof resolvedSearchParams?.roomId === "string") {
    computeParams.set("roomId", resolvedSearchParams.roomId);
  }
  if (typeof resolvedSearchParams?.month === "string") {
    computeParams.set("month", resolvedSearchParams.month);
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
  const selectedMonthRaw =
    typeof resolvedSearchParams?.month === "string" ? resolvedSearchParams.month : defaultMonthKey;
  const compareARaw =
    typeof resolvedSearchParams?.compareA === "string" ? resolvedSearchParams.compareA : defaultMonthKey;
  const compareBRaw =
    typeof resolvedSearchParams?.compareB === "string" ? resolvedSearchParams.compareB : defaultMonthKey;
  const selectedRoomId =
    typeof resolvedSearchParams?.roomId === "string" && studio.rooms.some((room) => room.id === resolvedSearchParams.roomId)
      ? resolvedSearchParams.roomId
      : (studio.rooms[0]?.id ?? "");
  const selectedMonthKey = monthKeyFromDate(parseMonthKey(selectedMonthRaw, now));
  const selectedMonthStart = parseMonthKey(selectedMonthKey, now);
  const selectedMonthEnd = new Date(selectedMonthStart.getFullYear(), selectedMonthStart.getMonth() + 1, 1);
  const compareAKey = monthKeyFromDate(parseMonthKey(compareARaw, now));
  const compareBKey = monthKeyFromDate(parseMonthKey(compareBRaw, now));
  const compareAStart = parseMonthKey(compareAKey, now);
  const compareBStart = parseMonthKey(compareBKey, now);
  const compareAEnd = new Date(compareAStart.getFullYear(), compareAStart.getMonth() + 1, 1);
  const compareBEnd = new Date(compareBStart.getFullYear(), compareBStart.getMonth() + 1, 1);

  const rangeStart = new Date(
    Math.min(
      weekStart.getTime(),
      monthStart.getTime(),
      selectedMonthStart.getTime(),
      compareAStart.getTime(),
      compareBStart.getTime(),
    ),
  );
  const rangeEnd = new Date(
    Math.max(
      weekEnd.getTime(),
      monthEnd.getTime(),
      selectedMonthEnd.getTime(),
      compareAEnd.getTime(),
      compareBEnd.getTime(),
    ),
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

  const monthOptions = Array.from({ length: 25 }, (_, idx) => {
    const offset = idx - 12;
    const date = new Date(now.getFullYear(), now.getMonth() + offset, 1);
    return {
      key: monthKeyFromDate(date),
      label: formatMonthLabel(date),
    };
  });

  const selectedRoom = studio.rooms.find((room) => room.id === selectedRoomId) ?? studio.rooms[0] ?? null;
  const selectedRoomBlocks = selectedRoom ? blocks.filter((block) => block.roomId === selectedRoom.id) : [];
  const selectedRoomExtras =
    selectedRoom?.extrasJson &&
    typeof selectedRoom.extrasJson === "object" &&
    !Array.isArray(selectedRoom.extrasJson)
      ? (selectedRoom.extrasJson as Record<string, unknown>)
      : {};
  const monthlyExpensesSource =
    selectedRoomExtras.monthlyExpenses &&
    typeof selectedRoomExtras.monthlyExpenses === "object" &&
    !Array.isArray(selectedRoomExtras.monthlyExpenses)
      ? (selectedRoomExtras.monthlyExpenses as Record<string, unknown>)
      : {};
  const expensesByMonth = new Map(
    Object.entries(monthlyExpensesSource).map(([monthKey, items]) => [monthKey, normalizeExpenseItems(items)]),
  );
  const selectedRoomExpenses = expensesByMonth.get(selectedMonthKey) ?? [];
  const selectedRoomExpenseTotal = getExpenseTotal(selectedRoomExpenses);
  const selectedRoomPrice = selectedRoom
    ? parsePrice(selectedRoom.hourlyRate) ??
      parsePrice(selectedRoom.flatRate) ??
      parsePrice(selectedRoom.minRate) ??
      parsePrice(selectedRoom.dailyRate) ??
      0
    : 0;
  const selectedRoomMonthOpen = shouldCompute ? getTotalOpenMinutes(openingHours, selectedMonthStart, selectedMonthEnd) : 0;
  const selectedRoomMonthOccupied =
    shouldCompute && selectedRoom
      ? getOccupiedMinutes(selectedRoomBlocks, openingHours, dayCutoffHour, selectedMonthStart, selectedMonthEnd)
      : 0;
  const selectedRoomMonthOccupancy =
    selectedRoomMonthOpen === 0 ? 0 : Math.round((selectedRoomMonthOccupied / selectedRoomMonthOpen) * 1000) / 10;
  const selectedRoomMonthRevenue =
    shouldCompute && selectedRoom
      ? selectedRoomBlocks.reduce((sum, block) => sum + getBlockRevenue(block, selectedMonthStart, selectedMonthEnd), 0)
      : 0;
  const selectedRoomMonthNetRevenue = selectedRoomMonthRevenue - selectedRoomExpenseTotal;

  const compareRoomOccupancy = (rangeStart: Date, rangeEnd: Date) => {
    if (!selectedRoom || !shouldCompute) return 0;
    const totalOpenMinutes = getTotalOpenMinutes(openingHours, rangeStart, rangeEnd);
    const occupiedMinutes = getOccupiedMinutes(selectedRoomBlocks, openingHours, dayCutoffHour, rangeStart, rangeEnd);
    return totalOpenMinutes === 0 ? 0 : Math.round((occupiedMinutes / totalOpenMinutes) * 1000) / 10;
  };

  const compareRoomRevenue = (rangeStart: Date, rangeEnd: Date) => {
    if (!selectedRoom || !shouldCompute) return 0;
    return selectedRoomBlocks.reduce((sum, block) => sum + getBlockRevenue(block, rangeStart, rangeEnd), 0);
  };

  const compareAExpenseTotal = getExpenseTotal(expensesByMonth.get(compareAKey) ?? []);
  const compareBExpenseTotal = getExpenseTotal(expensesByMonth.get(compareBKey) ?? []);
  const compareARoomOccupancy = compareRoomOccupancy(compareAStart, compareAEnd);
  const compareBRoomOccupancy = compareRoomOccupancy(compareBStart, compareBEnd);
  const compareARoomRevenue = compareRoomRevenue(compareAStart, compareAEnd);
  const compareBRoomRevenue = compareRoomRevenue(compareBStart, compareBEnd);
  const compareARoomNetRevenue = compareARoomRevenue - compareAExpenseTotal;
  const compareBRoomNetRevenue = compareBRoomRevenue - compareBExpenseTotal;

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
              className="inline-flex h-9 items-center justify-center rounded-full border border-orange-500 bg-orange-500 px-4 text-xs font-semibold text-white transition hover:border-orange-600 hover:bg-orange-600"
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
                ? formatCurrency(studio.rooms.reduce((acc, room) => {
                    const roomBlocks = blocks.filter((block) => block.roomId === room.id);
                    return acc + roomBlocks.reduce((roomSum, block) => roomSum + getBlockRevenue(block, monthStart, monthEnd), 0);
                  }, 0))
                : "Hesaplanmadı"}
            </p>
          </div>
        </div>

        {studio.rooms.length === 0 ? (
          <div className="mt-6 rounded-2xl border border-orange-200/50 bg-orange-50/70 p-5 shadow-sm">
            <p className="text-sm font-semibold text-orange-950">Henüz oda eklenmemiş.</p>
            <p className="mt-2 text-sm text-orange-700">
              Oda ekledikten sonra oda bazlı gelir, doluluk ve gider istatistikleri burada görünecek.
            </p>
          </div>
        ) : (
        <>
        <div className="mt-6 rounded-2xl border border-orange-200/50 bg-orange-50/70 p-5 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-orange-700">
                Oda bazlı aylık istatistik
              </p>
              <p className="text-sm text-orange-700">
                Her oda için aylık gelir ve doluluk oranını dropdown ile inceleyebilirsin.
              </p>
            </div>
            {selectedRoom ? (
              <span className="rounded-full border border-orange-200 px-3 py-1 text-xs font-semibold text-orange-700">
                {selectedRoomPrice ? `${selectedRoomPrice}₺/saat` : "Fiyat yok"}
              </span>
            ) : null}
          </div>

          <form className="mt-4 grid gap-4 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto]" method="get">
            {resolvedSearchParams?.as ? <input type="hidden" name="as" value={resolvedSearchParams.as} /> : null}
            {shouldCompute ? <input type="hidden" name="calc" value="1" /> : null}
            <input type="hidden" name="compareA" value={compareAKey} />
            <input type="hidden" name="compareB" value={compareBKey} />
            <div>
              <label className="text-xs font-semibold text-orange-700" htmlFor="roomId">
                Oda
              </label>
              <select
                id="roomId"
                name="roomId"
                defaultValue={selectedRoomId}
                className="mt-2 h-11 w-full rounded-xl border border-orange-200 bg-white px-3 text-sm font-semibold text-orange-950 focus:border-orange-400 focus:outline-none"
              >
                {studio.rooms.map((room) => (
                  <option key={room.id} value={room.id}>
                    {room.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-orange-700" htmlFor="month">
                Ay
              </label>
              <select
                id="month"
                name="month"
                defaultValue={selectedMonthKey}
                className="mt-2 h-11 w-full rounded-xl border border-orange-200 bg-white px-3 text-sm font-semibold text-orange-950 focus:border-orange-400 focus:outline-none"
              >
                {monthOptions.map((option) => (
                  <option key={option.key} value={option.key}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex items-end">
              <button
                type="submit"
                className="h-11 rounded-xl bg-orange-600 px-5 text-sm font-semibold text-white shadow-sm transition hover:bg-orange-700"
              >
                Göster
              </button>
            </div>
          </form>

          <div className="mt-4 grid gap-3 sm:grid-cols-4">
            <div className="rounded-xl border border-orange-200/60 bg-orange-50/80 p-3">
              <p className="text-xs font-semibold text-orange-700">Seçili ay doluluk</p>
              <p className="mt-1 text-lg font-semibold text-orange-950">
                {shouldCompute ? formatPercent(selectedRoomMonthOccupancy) : "Hesaplanmadı"}
              </p>
            </div>
            <div className="rounded-xl border border-orange-200/60 bg-orange-50/80 p-3">
              <p className="text-xs font-semibold text-orange-700">Brüt gelir</p>
              <p className="mt-1 text-lg font-semibold text-orange-950">
                {shouldCompute ? formatCurrency(selectedRoomMonthRevenue) : "Hesaplanmadı"}
              </p>
            </div>
            <div className="rounded-xl border border-orange-200/60 bg-orange-50/80 p-3">
              <p className="text-xs font-semibold text-orange-700">Giderler</p>
              <p className="mt-1 text-lg font-semibold text-orange-950">
                {formatCurrency(selectedRoomExpenseTotal)}
              </p>
            </div>
            <div className="rounded-xl border border-orange-200/60 bg-white p-3">
              <p className="text-xs font-semibold text-orange-700">Net gelir</p>
              <p className="mt-1 text-lg font-semibold text-orange-950">
                {shouldCompute ? formatCurrency(selectedRoomMonthNetRevenue) : "Hesaplanmadı"}
              </p>
            </div>
          </div>
        </div>

        <div className="mt-6">
          <ExpensesEditor
            key={`${selectedRoomId}-${selectedMonthKey}`}
            roomId={selectedRoomId}
            roomName={selectedRoom?.name ?? "Oda"}
            monthKey={selectedMonthKey}
            monthLabel={formatMonthLabel(selectedMonthStart)}
            roomOptions={studio.rooms.map((room) => ({ id: room.id, name: room.name }))}
            monthOptions={monthOptions}
            initialItems={selectedRoomExpenses}
            searchAs={resolvedSearchParams?.as}
            compareAKey={compareAKey}
            compareBKey={compareBKey}
            shouldCompute={shouldCompute}
          />
        </div>

        <div className="mt-8 rounded-2xl border border-orange-200/60 bg-orange-50/80 p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-orange-700">
                İstatistikleri Karşılaştır
              </p>
              <p className="text-sm text-orange-700">
                {selectedRoom ? `${selectedRoom.name} için` : "Seçili oda için"} iki ay seçerek doluluk ve net geliri karşılaştırabilirsin.
              </p>
            </div>
            <span className="text-xs font-semibold text-orange-600">
              {shouldCompute
                ? `${formatPercent(compareARoomOccupancy)} · ${formatPercent(compareBRoomOccupancy)}`
                : "Hesaplanmadı"}
            </span>
          </div>

          <form className="mt-4 grid gap-4 md:grid-cols-2" method="get">
            {resolvedSearchParams?.as ? (
              <input type="hidden" name="as" value={resolvedSearchParams.as} />
            ) : null}
            <input type="hidden" name="roomId" value={selectedRoomId} />
            <input type="hidden" name="month" value={selectedMonthKey} />
            {shouldCompute ? <input type="hidden" name="calc" value="1" /> : null}
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
                    {shouldCompute ? formatPercent(compareARoomOccupancy) : "Hesaplanmadı"}
                  </span>
                </p>
                <p>
                  Net gelir:{" "}
                  <span className="font-semibold">
                    {shouldCompute ? formatCurrency(compareARoomNetRevenue) : "Hesaplanmadı"}
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
                    {shouldCompute ? formatPercent(compareBRoomOccupancy) : "Hesaplanmadı"}
                  </span>
                </p>
                <p>
                  Net gelir:{" "}
                  <span className="font-semibold">
                    {shouldCompute ? formatCurrency(compareBRoomNetRevenue) : "Hesaplanmadı"}
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
        </>
        )}
      </div>
    </div>
  );
}
