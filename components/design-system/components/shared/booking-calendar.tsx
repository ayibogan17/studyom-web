import { addDays, format } from "date-fns";
import { tr } from "date-fns/locale";
import { Card } from "../../components/ui/card";

type BookingCalendarProps = {
  loading?: boolean;
};

export function BookingCalendar({ loading }: BookingCalendarProps) {
  const today = new Date();
  const days = Array.from({ length: 14 }, (_, i) => addDays(today, i));

  return (
    <Card className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold text-[var(--color-primary)]">Müsaitlik (demo)</p>
        <p className="text-xs text-[var(--color-muted)]">2 hafta görünür</p>
      </div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {days.map((day) => (
          <div
            key={day.toISOString()}
            className="rounded-xl border border-[var(--color-border)] bg-[var(--color-secondary)] p-3 text-sm text-[var(--color-primary)]"
          >
            <p className="font-semibold">{format(day, "EEE d MMM", { locale: tr })}</p>
            <p className="mt-1 text-xs text-[var(--color-muted)]">
              {loading ? "Kontrol ediliyor..." : "Müsait"}
            </p>
          </div>
        ))}
      </div>
    </Card>
  );
}
