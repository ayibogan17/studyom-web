"use client";

import type { Room, Slot, OpeningHours } from "@/types/panel";

const shortDays = ["Pzt", "Sal", "Çar", "Per", "Cum", "Cmt", "Paz"];

type CalendarViewProps = {
  currentRoom: Room;
  openingHours: OpeningHours[];
  monthCursor: Date;
  onPrevMonth: () => void;
  onNextMonth: () => void;
  selectedDate: Date | null;
  onSelectDate: (date: Date) => void;
  slotList: Slot[];
  formatKey: (d: Date) => string;
  weekdayIndex: (d: Date) => number;
  pricingLabel: (room: Room) => string;
  orderedRooms: Room[];
  onSelectRoom: (roomId: string) => void;
  slotContent?: React.ReactNode;
};

export function CalendarView({
  currentRoom,
  openingHours,
  monthCursor,
  onPrevMonth,
  onNextMonth,
  selectedDate,
  onSelectDate,
  slotList,
  formatKey,
  weekdayIndex,
  pricingLabel,
  orderedRooms,
  onSelectRoom,
  slotContent,
}: CalendarViewProps) {
  const startOfMonth = new Date(monthCursor.getFullYear(), monthCursor.getMonth(), 1);
  const startOffset = weekdayIndex(startOfMonth);
  const daysInMonth = new Date(monthCursor.getFullYear(), monthCursor.getMonth() + 1, 0).getDate();
  const totalCells = Math.ceil((startOffset + daysInMonth) / 7) * 7;

  return (
    <section className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5 shadow-sm">
      <div className="mb-2 flex items-center gap-2 text-xs text-[var(--color-muted)]">
        <span className="inline-block h-3 w-3 rounded-full" style={{ backgroundColor: currentRoom.color }} />
        <span>Takvim vurguları oda rengine göre</span>
      </div>
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-sm font-semibold text-[var(--color-primary)]">Takvim</p>
          <p className="text-xs text-[var(--color-muted)]">
            {currentRoom.name} için slotları düzenle. Kapalı günler tıklanamaz.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onPrevMonth}
            className="rounded-xl border border-[var(--color-border)] px-3 py-2 text-sm text-[var(--color-primary)] hover:border-[var(--color-accent)]"
          >
            Önceki
          </button>
          <div className="min-w-[160px] text-center text-sm font-semibold text-[var(--color-primary)]">
            {monthCursor.toLocaleDateString("tr-TR", { month: "long", year: "numeric" })}
          </div>
          <button
            type="button"
            onClick={onNextMonth}
            className="rounded-xl border border-[var(--color-border)] px-3 py-2 text-sm text-[var(--color-primary)] hover:border-[var(--color-accent)]"
          >
            Sonraki
          </button>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {orderedRooms.map((room) => (
          <button
            key={room.id}
            type="button"
            aria-pressed={room.id === currentRoom.id}
            onClick={() => onSelectRoom(room.id)}
            style={
              room.id === currentRoom.id
                ? { backgroundColor: room.color, borderColor: room.color, color: "#fff" }
                : undefined
            }
            className={`rounded-full border px-3 py-1 text-xs font-semibold transition ${
              room.id === currentRoom.id
                ? "shadow-sm"
                : "border-[var(--color-border)] bg-[var(--color-secondary)] text-[var(--color-primary)] hover:border-[var(--color-accent)]"
            }`}
          >
            {room.name}
          </button>
        ))}
      </div>

      <div className="mt-4 rounded-2xl border border-[var(--color-border)] bg-[var(--color-secondary)] p-3">
        <div className="grid grid-cols-7 gap-2 text-center text-xs font-semibold text-[var(--color-muted)]">
          {shortDays.map((d) => (
            <div key={d} className="py-1">
              {d}
            </div>
          ))}
        </div>
        <div className="mt-2 grid grid-cols-7 gap-2 text-sm">
          {Array.from({ length: totalCells }).map((_, idx) => {
            const dayNum = idx - startOffset + 1;
            if (dayNum < 1 || dayNum > daysInMonth) return <div key={idx} />;
            const date = new Date(monthCursor.getFullYear(), monthCursor.getMonth(), dayNum);
            const key = formatKey(date);
            const dayIdx = weekdayIndex(date);
            const isOpen = openingHours[dayIdx]?.open;
            const slots = currentRoom.slots[key] || [];
            const confirmed = slots.filter((s) => s.status === "confirmed").length;
            const isSelected = selectedDate && formatKey(selectedDate) === key;
            const selectedStyle = isSelected
              ? { borderColor: currentRoom.color, backgroundColor: `${currentRoom.color}22` }
              : {};
            return (
              <button
                key={idx}
                type="button"
                onClick={() => isOpen && onSelectDate(date)}
                style={selectedStyle}
                className={`flex h-16 flex-col rounded-xl border text-left transition ${
                  !isOpen
                    ? "cursor-not-allowed border-red-100 bg-red-50 text-red-700"
                    : !isSelected
                      ? "border-[var(--color-border)] bg-[var(--color-surface)] hover:border-[var(--color-accent)]"
                      : ""
                }`}
              >
                <span className="px-2 py-1 text-sm font-semibold">{dayNum}</span>
                {confirmed > 0 && (
                  <span className="px-2 text-xs text-[var(--color-primary)]">
                    {confirmed} onaylı
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {selectedDate ? (
        <div className="mt-4 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-[var(--color-primary)]">
                {currentRoom.name} •{" "}
                {selectedDate.toLocaleDateString("tr-TR", {
                  weekday: "long",
                  day: "numeric",
                  month: "long",
                })}
              </p>
              <p className="text-xs text-[var(--color-muted)]">Slotların durumunu değiştir. İsim kutucuğu opsiyonel.</p>
            </div>
            <span className="rounded-full bg-[var(--color-secondary)] px-3 py-1 text-xs text-[var(--color-primary)]">
              {pricingLabel(currentRoom)}
            </span>
          </div>
          <div className="mt-3 space-y-2">
            {slotContent ??
              (slotList.length === 0 ? (
                <p className="text-sm text-[var(--color-muted)]">
                  Bu gün için slot yok (kapalı veya henüz oluşturulmadı).
                </p>
              ) : null)}
          </div>
        </div>
      ) : null}
    </section>
  );
}
