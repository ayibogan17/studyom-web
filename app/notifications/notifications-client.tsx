"use client";

import { useMemo, useState } from "react";
import { Bell } from "lucide-react";
import { Card } from "@/components/design-system/components/ui/card";
import { Badge } from "@/components/design-system/components/ui/badge";
import { Button } from "@/components/design-system/components/ui/button";
import { cn } from "@/components/design-system/lib/cn";

export type NotificationItem = {
  id: string;
  kind: "reservation" | "lead" | "teacher-lead";
  title: string;
  subtitle: string;
  message: string;
  createdAt: string;
  status: "unread" | "read";
};

type Props = {
  items: NotificationItem[];
};

type FilterKey = "all" | "unread" | "read";

const filters: Array<{ key: FilterKey; label: string }> = [
  { key: "all", label: "Tümü" },
  { key: "unread", label: "Okunmadı" },
  { key: "read", label: "Okundu" },
];

export default function NotificationsClient({ items }: Props) {
  const [filter, setFilter] = useState<FilterKey>("all");
  const [rows, setRows] = useState(items);
  const [savingId, setSavingId] = useState<string | null>(null);

  const filteredItems = useMemo(() => {
    if (filter === "all") return rows;
    if (filter === "unread") return rows.filter((item) => item.status === "unread");
    return rows.filter((item) => item.status === "read");
  }, [rows, filter]);

  const reservationItems = filteredItems.filter((item) => item.kind === "reservation");
  const leadItems = filteredItems.filter((item) => item.kind !== "reservation");

  const markRead = async (item: NotificationItem) => {
    if (item.status === "read") return;
    setSavingId(item.id);
    try {
      const res = await fetch("/api/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: item.id, kind: item.kind }),
      });
      if (!res.ok) throw new Error("Kaydedilemedi");
      setRows((prev) =>
        prev.map((row) => (row.id === item.id ? { ...row, status: "read" } : row)),
      );
    } catch (err) {
      console.error(err);
      alert("Kaydedilemedi");
    } finally {
      setSavingId(null);
    }
  };

  return (
    <div className="mx-auto w-full max-w-4xl px-6 py-10">
      <div className="mb-6 flex items-start justify-between gap-4">
        <div className="space-y-2">
          <h1 className="text-2xl font-semibold text-[var(--color-primary)]">Bildirimler</h1>
          <p className="text-sm text-[var(--color-muted)]">
            Lead ve rezervasyon isteklerini burada görürsün.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-[var(--color-border)]">
            <Bell className="h-5 w-5 text-[var(--color-primary)]" aria-hidden />
          </span>
        </div>
      </div>

      <div className="mb-6 flex flex-wrap gap-2">
        {filters.map((item) => (
          <Button
            key={item.key}
            type="button"
            size="sm"
            variant={filter === item.key ? "default" : "secondary"}
            onClick={() => setFilter(item.key)}
          >
            {item.label}
          </Button>
        ))}
      </div>

      <div className="grid gap-6">
        <Card className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-[var(--color-primary)]">Rezervasyon istekleri</h2>
            <Badge variant="muted">{reservationItems.length}</Badge>
          </div>
          {reservationItems.length === 0 ? (
            <p className="text-sm text-[var(--color-muted)]">Henüz rezervasyon isteği yok.</p>
          ) : (
            <div className="space-y-3">
              {reservationItems.map((item) => (
                <div
                  key={item.id}
                  className="rounded-xl border border-[var(--color-border)] bg-[var(--color-secondary)] p-4"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-[var(--color-primary)]">{item.title}</p>
                      <p className="text-xs text-[var(--color-muted)]">{item.subtitle}</p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2 text-xs text-[var(--color-muted)]">
                      <Badge
                        variant={item.status === "read" ? "outline" : "default"}
                        className={cn(item.status === "read" ? "" : "bg-[var(--color-warning)] text-white")}
                      >
                        {item.status === "read" ? "Okundu" : "Okunmadı"}
                      </Badge>
                      <span>{new Date(item.createdAt).toLocaleString("tr-TR")}</span>
                      {item.status === "unread" && (
                        <Button
                          type="button"
                          size="sm"
                          variant="secondary"
                          className="h-8 px-3 text-xs"
                          disabled={savingId === item.id}
                          onClick={() => markRead(item)}
                        >
                          Okundu işaretle
                        </Button>
                      )}
                    </div>
                  </div>
                  <p className="mt-2 text-sm text-[var(--color-primary)]">{item.message}</p>
                </div>
              ))}
            </div>
          )}
        </Card>

        <Card className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-[var(--color-primary)]">Lead&apos;ler</h2>
            <Badge variant="muted">{leadItems.length}</Badge>
          </div>
          {leadItems.length === 0 ? (
            <p className="text-sm text-[var(--color-muted)]">Henüz lead yok.</p>
          ) : (
            <div className="space-y-3">
              {leadItems.map((item) => (
                <div
                  key={item.id}
                  className="rounded-xl border border-[var(--color-border)] bg-[var(--color-secondary)] p-4"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-[var(--color-primary)]">{item.title}</p>
                      <p className="text-xs text-[var(--color-muted)]">{item.subtitle}</p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2 text-xs text-[var(--color-muted)]">
                      <Badge
                        variant={item.status === "read" ? "outline" : "default"}
                        className={cn(item.status === "read" ? "" : "bg-[var(--color-warning)] text-white")}
                      >
                        {item.status === "read" ? "Okundu" : "Okunmadı"}
                      </Badge>
                      <span>{new Date(item.createdAt).toLocaleString("tr-TR")}</span>
                      {item.status === "unread" && (
                        <Button
                          type="button"
                          size="sm"
                          variant="secondary"
                          className="h-8 px-3 text-xs"
                          disabled={savingId === item.id}
                          onClick={() => markRead(item)}
                        >
                          Okundu işaretle
                        </Button>
                      )}
                    </div>
                  </div>
                  <p className="mt-2 text-sm text-[var(--color-primary)]">{item.message}</p>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
