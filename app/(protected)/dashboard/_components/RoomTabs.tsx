"use client";

import clsx from "clsx";

export type RoomChip = { id: string; name: string; color?: string };

type RoomTabsProps = {
  rooms: RoomChip[];
  selectedRoomId?: string;
  onSelect: (id: string) => void;
  onAddRoom?: () => void;
};

export function RoomTabs({ rooms, selectedRoomId, onSelect, onAddRoom }: RoomTabsProps) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      {rooms.map((room) => {
        const isActive = room.id === selectedRoomId;
        return (
          <button
            key={room.id}
            type="button"
            aria-pressed={isActive}
            onClick={() => onSelect(room.id)}
            style={isActive && room.color ? { backgroundColor: room.color, borderColor: room.color } : undefined}
            className={clsx(
              "flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold transition",
              isActive
                ? "text-white shadow-sm"
                : "border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-primary)] hover:border-[var(--color-accent)]",
            )}
          >
            <span
              className="inline-block h-2.5 w-2.5 rounded-full border border-white/60"
              style={{ backgroundColor: room.color ?? "var(--color-accent)" }}
              aria-hidden
            />
            <span className="truncate">{room.name}</span>
          </button>
        );
      })}
      {onAddRoom ? (
        <button
          type="button"
          onClick={onAddRoom}
          className="rounded-full border border-dashed border-[var(--color-border)] px-3 py-1.5 text-xs font-semibold text-[var(--color-primary)] hover:border-[var(--color-accent)] hover:text-[var(--color-accent)]"
        >
          + Oda ekle
        </button>
      ) : null}
    </div>
  );
}
