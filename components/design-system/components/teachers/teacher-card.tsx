import Link from "next/link";
import { Card } from "../ui/card";
import type { Teacher } from "@/data/teachers";

type Props = {
  teacher: Teacher;
};

export function TeacherCard({ teacher }: Props) {
  return (
    <Card className="space-y-3 p-5 shadow-sm">
      <div className="flex items-center justify-between gap-2">
        <div>
          <p className="text-lg font-semibold text-[var(--color-primary)]">{teacher.displayName}</p>
          <p className="text-sm text-[var(--color-muted)]">
            {teacher.city}
            {teacher.district ? ` • ${teacher.district}` : ""}
          </p>
        </div>
        <span className="rounded-full border border-[var(--color-border)] bg-[var(--color-secondary)] px-3 py-1 text-xs text-[var(--color-primary)]">
          {teacher.level}
        </span>
      </div>
      <div className="flex flex-wrap gap-2 text-xs text-[var(--color-primary)]">
        {teacher.instruments.map((inst) => (
          <span key={inst} className="rounded-full bg-[var(--color-secondary)] px-3 py-1">
            {inst}
          </span>
        ))}
      </div>
      <div className="flex flex-wrap gap-2 text-xs text-[var(--color-primary)]">
        {teacher.lessonTypes.map((t) => (
          <span
            key={t}
            className="rounded-full border border-[var(--color-border)] px-3 py-1"
          >
            {t === "online" ? "Online" : t === "in-person" ? "Yüzyüze" : "Online + Yüzyüze"}
          </span>
        ))}
      </div>
      <p className="text-sm text-[var(--color-muted)] line-clamp-3">{teacher.bio}</p>
      <div className="flex items-center justify-between">
        <span className="text-sm font-semibold text-[var(--color-primary)]">
          {teacher.hourlyRateMin ? `₺${teacher.hourlyRateMin}+ / saat` : "Ücret bilgisi görüşülür"}
        </span>
        <Link
          href={`/hocalar/${teacher.slug}`}
          className="text-sm font-semibold text-[var(--color-accent)] hover:underline"
        >
          Profili gör
        </Link>
      </div>
    </Card>
  );
}
