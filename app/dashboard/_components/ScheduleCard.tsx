"use client";

import type { OpeningHours } from "@/types/panel";

const longDays = ["Pazartesi", "Salı", "Çarşamba", "Perşembe", "Cuma", "Cumartesi", "Pazar"];

type ScheduleCardProps = {
  openingHours: OpeningHours[];
  editing: boolean;
  onToggleEdit: () => void;
  onChangeHour: (index: number, patch: Partial<OpeningHours>) => void;
  onSave?: () => void;
  saving?: boolean;
  note?: string | null;
};

export function ScheduleCard({
  openingHours,
  editing,
  onToggleEdit,
  onChangeHour,
  onSave,
  saving,
  note,
}: ScheduleCardProps) {
  return (
    <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5 shadow-sm">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-sm font-semibold text-[var(--color-primary)]">Açılış saatleri</p>
          <p className="text-xs text-[var(--color-muted)]">Tüm odalar için geçerli. Kapalı günler kırmızı görünür.</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onToggleEdit}
            className="rounded-xl border border-[var(--color-border)] px-3 py-2 text-xs font-semibold text-[var(--color-primary)] hover:border-[var(--color-accent)]"
          >
            {editing ? "İptal" : "Saatleri düzenle"}
          </button>
          {editing && onSave ? (
            <button
              type="button"
              onClick={onSave}
              disabled={saving}
              className="rounded-xl bg-[var(--color-accent)] px-3 py-2 text-xs font-semibold text-white hover:brightness-110 disabled:opacity-60"
            >
              {saving ? "Kaydediliyor..." : "Kaydet"}
            </button>
          ) : null}
        </div>
        {note ? (
          <span className="rounded-full bg-[var(--color-secondary)] px-3 py-1 text-xs font-semibold text-[var(--color-primary)]">
            {note}
          </span>
        ) : null}
      </div>
      <div className="mt-4 grid gap-2 sm:grid-cols-2 md:grid-cols-3">
        {openingHours.map((h, idx) => (
          <div
            key={idx}
            className={`flex flex-col gap-2 rounded-xl border px-3 py-2 text-sm ${
              h.open
                ? "border-[var(--color-border)] bg-[var(--color-secondary)] text-[var(--color-primary)]"
                : "border-red-100 bg-red-50 text-red-700"
            }`}
          >
            <div className="flex items-center justify-between gap-2">
              <span className="font-semibold">{longDays[idx]}</span>
              {editing ? (
                <label className="flex items-center gap-2 text-xs">
                  <input
                    type="checkbox"
                    checked={h.open}
                    onChange={(e) => onChangeHour(idx, { open: e.target.checked })}
                  />
                  Açık
                </label>
              ) : (
                <span>{h.open ? `${h.openTime} - ${h.closeTime}` : "Kapalı"}</span>
              )}
            </div>
            {editing && h.open ? (
              <div className="flex items-center gap-2 text-xs">
                <input
                  className="w-20 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-2 py-1"
                  value={h.openTime}
                  onChange={(e) => onChangeHour(idx, { openTime: e.target.value })}
                />
                <span>-</span>
                <input
                  className="w-20 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-2 py-1"
                  value={h.closeTime}
                  onChange={(e) => onChangeHour(idx, { closeTime: e.target.value })}
                />
              </div>
            ) : !editing ? (
              <span>{h.open ? `${h.openTime} - ${h.closeTime}` : "Kapalı"}</span>
            ) : null}
          </div>
        ))}
      </div>
    </div>
  );
}
