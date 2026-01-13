export type OpeningHours = {
  open: boolean;
  openTime: string;
  closeTime: string;
};

const defaultHours: OpeningHours[] = Array.from({ length: 7 }, () => ({
  open: true,
  openTime: "09:00",
  closeTime: "21:00",
}));

export const normalizeOpeningHours = (value?: OpeningHours[] | null) =>
  Array.isArray(value) && value.length === 7 ? value : defaultHours;

const weekdayIndex = (d: Date) => (d.getDay() + 6) % 7;

const getZonedParts = (date: Date, timeZone: string) => {
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone,
    hour12: false,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
  const parts = formatter.formatToParts(date);
  const map = new Map(parts.map((part) => [part.type, part.value]));
  return {
    year: Number(map.get("year") ?? "0"),
    month: Number(map.get("month") ?? "1"),
    day: Number(map.get("day") ?? "1"),
    hour: Number(map.get("hour") ?? "0"),
    minute: Number(map.get("minute") ?? "0"),
    second: Number(map.get("second") ?? "0"),
  };
};

const getTimeZoneOffsetMs = (date: Date, timeZone: string) => {
  const parts = getZonedParts(date, timeZone);
  const asUtc = Date.UTC(parts.year, parts.month - 1, parts.day, parts.hour, parts.minute, parts.second);
  return asUtc - date.getTime();
};

const makeZonedDate = (year: number, month: number, day: number, minutes: number, timeZone: string) => {
  const hour = Math.floor(minutes / 60);
  const minute = minutes % 60;
  const utcDate = new Date(Date.UTC(year, month - 1, day, hour, minute, 0));
  const offset = getTimeZoneOffsetMs(utcDate, timeZone);
  return new Date(utcDate.getTime() - offset);
};

const getBusinessDayStartZoned = (date: Date, cutoffHour: number, timeZone: string) => {
  const parts = getZonedParts(date, timeZone);
  const hour = parts.hour + parts.minute / 60;
  let baseYear = parts.year;
  let baseMonth = parts.month;
  let baseDay = parts.day;
  if (hour < cutoffHour) {
    const prev = new Date(Date.UTC(parts.year, parts.month - 1, parts.day - 1));
    baseYear = prev.getUTCFullYear();
    baseMonth = prev.getUTCMonth() + 1;
    baseDay = prev.getUTCDate();
  }
  return makeZonedDate(baseYear, baseMonth, baseDay, 0, timeZone);
};

const weekdayIndexFromZonedDate = (date: Date, timeZone: string) => {
  const parts = getZonedParts(date, timeZone);
  const utcDate = new Date(Date.UTC(parts.year, parts.month - 1, parts.day));
  return (utcDate.getUTCDay() + 6) % 7;
};

const minutesFromTime = (value: string) => {
  const [h, m] = value.split(":").map(Number);
  if (!Number.isFinite(h) || !Number.isFinite(m)) return null;
  return h * 60 + m;
};

const getBusinessDayStart = (date: Date, cutoffHour: number) => {
  const base = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const hour = date.getHours() + date.getMinutes() / 60;
  if (hour < cutoffHour) {
    base.setDate(base.getDate() - 1);
  }
  return base;
};

const getOpenRangeForDay = (day: Date, openingHours: OpeningHours[]) => {
  const info = openingHours[weekdayIndex(day)];
  if (!info || !info.open) return null;
  const start = minutesFromTime(info.openTime);
  const end = minutesFromTime(info.closeTime);
  if (start === null || end === null) {
    return { start: 0, end: 24 * 60 };
  }
  let rangeEnd = end;
  if (rangeEnd <= start) rangeEnd += 24 * 60;
  return { start, end: rangeEnd };
};

const getOpenRangeForDayZoned = (day: Date, openingHours: OpeningHours[], timeZone: string) => {
  const info = openingHours[weekdayIndexFromZonedDate(day, timeZone)];
  if (!info || !info.open) return null;
  const start = minutesFromTime(info.openTime);
  const end = minutesFromTime(info.closeTime);
  if (start === null || end === null) {
    return { start: 0, end: 24 * 60 };
  }
  let rangeEnd = end;
  if (rangeEnd <= start) rangeEnd += 24 * 60;
  return { start, end: rangeEnd };
};

export const isWithinOpeningHours = (
  startAt: Date,
  endAt: Date,
  openingHours: OpeningHours[],
  cutoffHour: number,
) => {
  const businessStart = getBusinessDayStart(startAt, cutoffHour);
  const range = getOpenRangeForDay(businessStart, openingHours);
  if (!range) return false;
  const startMinutes = (startAt.getTime() - businessStart.getTime()) / 60000;
  const endMinutes = (endAt.getTime() - businessStart.getTime()) / 60000;
  return startMinutes >= range.start && endMinutes <= range.end;
};

export const isWithinOpeningHoursZoned = (
  startAt: Date,
  endAt: Date,
  openingHours: OpeningHours[],
  cutoffHour: number,
  timeZone: string,
) => {
  const businessStart = getBusinessDayStartZoned(startAt, cutoffHour, timeZone);
  const range = getOpenRangeForDayZoned(businessStart, openingHours, timeZone);
  if (!range) return false;
  const startMinutes = (startAt.getTime() - businessStart.getTime()) / 60000;
  const endMinutes = (endAt.getTime() - businessStart.getTime()) / 60000;
  return startMinutes >= range.start && endMinutes <= range.end;
};

export const toTimeZoneDate = (date: Date, timeZone: string) => {
  const offset = getTimeZoneOffsetMs(date, timeZone);
  return new Date(date.getTime() + offset);
};

export const isBlockingBlock = (block: { type?: string | null; status?: string | null }) => {
  const type = (block.type ?? "").toLowerCase();
  if (type.includes("manual") || type.includes("manuel") || type.includes("blok") || type.includes("block")) {
    return true;
  }
  if (type !== "reservation" && type !== "rezervasyon") return false;
  const status = (block.status ?? "").toLowerCase();
  return status === "approved" || status === "onaylı" || status === "onayli";
};
