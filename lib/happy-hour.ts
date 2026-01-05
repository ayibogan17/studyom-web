import { type OpeningHours } from "@/lib/studio-availability";

export type HappyHourSlot = {
  roomId: string;
  startAt: Date;
  endAt: Date;
};

export type HappyHourTemplate = {
  weekday: number;
  startMinutes: number;
  endMinutes: number;
};

const weekdayIndex = (d: Date) => (d.getDay() + 6) % 7;

const parseTimeMinutes = (value?: string | null) => {
  if (!value) return null;
  const [hours, minutes] = value.split(":").map((part) => Number(part));
  if (!Number.isFinite(hours) || !Number.isFinite(minutes)) return null;
  if (hours < 0 || hours > 23 || minutes < 0 || minutes > 59) return null;
  return hours * 60 + minutes;
};

const minutesToTime = (minutes: number) => {
  const safe = ((minutes % (24 * 60)) + 24 * 60) % (24 * 60);
  const hours = Math.floor(safe / 60);
  const mins = safe % 60;
  return `${String(hours).padStart(2, "0")}:${String(mins).padStart(2, "0")}`;
};

const getBusinessDayStart = (date: Date, cutoffHour: number) => {
  const base = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const hour = date.getHours() + date.getMinutes() / 60;
  if (hour < cutoffHour) {
    base.setDate(base.getDate() - 1);
  }
  return base;
};

const getOpenMinutesForWeekday = (openingHours: OpeningHours[], weekday: number) => {
  const info = openingHours[weekday];
  if (!info || !info.open) return null;
  return parseTimeMinutes(info.openTime);
};

export const buildHappyHourTemplatesByRoom = (
  slots: HappyHourSlot[],
  openingHours: OpeningHours[],
  cutoffHour: number,
) => {
  const byRoomWeekday = new Map<string, HappyHourTemplate>();
  slots.forEach((slot) => {
    const businessStart = getBusinessDayStart(slot.startAt, cutoffHour);
    const weekday = weekdayIndex(businessStart);
    const openMinutes = getOpenMinutesForWeekday(openingHours, weekday);
    if (openMinutes === null) return;
    const startMinutes = Math.round((slot.startAt.getTime() - businessStart.getTime()) / 60000);
    if (startMinutes !== openMinutes) return;
    let endMinutes = Math.round((slot.endAt.getTime() - businessStart.getTime()) / 60000);
    if (endMinutes <= startMinutes) {
      endMinutes += 24 * 60;
    }
    const key = `${slot.roomId}-${weekday}`;
    const existing = byRoomWeekday.get(key);
    if (!existing || endMinutes > existing.endMinutes) {
      byRoomWeekday.set(key, { weekday, startMinutes: openMinutes, endMinutes });
    }
  });

  const result = new Map<string, HappyHourTemplate[]>();
  byRoomWeekday.forEach((entry, key) => {
    const roomId = key.split("-").slice(0, -1).join("-");
    const list = result.get(roomId) ?? [];
    list.push(entry);
    result.set(roomId, list);
  });

  return result;
};

export const buildHappyHourDays = (
  slots: HappyHourSlot[],
  openingHours: OpeningHours[],
  cutoffHour: number,
) => {
  const byWeekday = new Map<number, number>();
  slots.forEach((slot) => {
    const businessStart = getBusinessDayStart(slot.startAt, cutoffHour);
    const weekday = weekdayIndex(businessStart);
    const openMinutes = getOpenMinutesForWeekday(openingHours, weekday);
    if (openMinutes === null) return;
    const startMinutes = Math.round((slot.startAt.getTime() - businessStart.getTime()) / 60000);
    if (startMinutes !== openMinutes) return;
    let endMinutes = Math.round((slot.endAt.getTime() - businessStart.getTime()) / 60000);
    if (endMinutes <= startMinutes) {
      endMinutes += 24 * 60;
    }
    const current = byWeekday.get(weekday);
    if (current === undefined || endMinutes > current) {
      byWeekday.set(weekday, endMinutes);
    }
  });

  return Array.from({ length: 7 }, (_, idx) => {
    const info = openingHours[idx];
    const openMinutes = getOpenMinutesForWeekday(openingHours, idx);
    const fallback = info?.closeTime ?? "22:00";
    const endMinutes = byWeekday.get(idx);
    return {
      weekday: idx,
      enabled: openMinutes !== null && endMinutes !== undefined,
      endTime:
        openMinutes !== null && endMinutes !== undefined ? minutesToTime(endMinutes) : fallback,
    };
  });
};
