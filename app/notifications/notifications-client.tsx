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

export type StudioRequestItem = {
  id: string;
  status: "pending" | "approved" | "rejected";
  studioName: string;
  teacherName: string;
  teacherEmail?: string | null;
  createdAt: string;
};

export type ProducerStudioRequestItem = {
  id: string;
  status: "pending" | "approved" | "rejected";
  studioName: string;
  producerName: string;
  producerEmail?: string | null;
  createdAt: string;
};

type Props = {
  items: NotificationItem[];
  studioRequests: StudioRequestItem[];
  producerRequests: ProducerStudioRequestItem[];
};

type FilterKey = "all" | "unread" | "read";

const filters: Array<{ key: FilterKey; label: string }> = [
  { key: "all", label: "Tümü" },
  { key: "unread", label: "Okunmadı" },
  { key: "read", label: "Okundu" },
];

export default function NotificationsClient({ items, studioRequests, producerRequests }: Props) {
  const [filter, setFilter] = useState<FilterKey>("all");
  const [rows, setRows] = useState(items);
  const [requests, setRequests] = useState(studioRequests);
  const [producerRequestsState, setProducerRequestsState] = useState(producerRequests);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [savingRequestId, setSavingRequestId] = useState<string | null>(null);
  const [savingProducerId, setSavingProducerId] = useState<string | null>(null);
  const [openItems, setOpenItems] = useState<Record<string, boolean>>({});
  const [openRequests, setOpenRequests] = useState<Record<string, boolean>>({});
  const [openProducerRequests, setOpenProducerRequests] = useState<Record<string, boolean>>({});

  const filteredItems = useMemo(() => {
    if (filter === "all") return rows;
    if (filter === "unread") return rows.filter((item) => item.status === "unread");
    return rows.filter((item) => item.status === "read");
  }, [rows, filter]);

  const leadItems = filteredItems.filter((item) => item.kind !== "reservation");

  const toggleItem = (id: string) => {
    setOpenItems((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const toggleRequest = (id: string) => {
    setOpenRequests((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const toggleProducerRequest = (id: string) => {
    setOpenProducerRequests((prev) => ({ ...prev, [id]: !prev[id] }));
  };

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

  const updateRequest = async (id: string, status: StudioRequestItem["status"]) => {
    setSavingRequestId(id);
    try {
      const res = await fetch(`/api/studio-links/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.error || "Güncellenemedi");
      setRequests((prev) => prev.map((row) => (row.id === id ? { ...row, status } : row)));
    } catch (err) {
      console.error(err);
      alert("Güncellenemedi");
    } finally {
      setSavingRequestId(null);
    }
  };

  const updateProducerRequest = async (id: string, status: ProducerStudioRequestItem["status"]) => {
    setSavingProducerId(id);
    try {
      const res = await fetch(`/api/producer-studio-links/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.error || "Güncellenemedi");
      setProducerRequestsState((prev) => prev.map((row) => (row.id === id ? { ...row, status } : row)));
    } catch (err) {
      console.error(err);
      alert("Güncellenemedi");
    } finally {
      setSavingProducerId(null);
    }
  };

  return (
    <div className="mx-auto w-full max-w-4xl px-6 py-10">
      <div className="mb-6 flex items-start justify-between gap-4">
        <div className="space-y-2">
          <h1 className="text-2xl font-semibold text-[var(--color-primary)]">Bildirimler</h1>
          <p className="text-sm text-[var(--color-muted)]">
            Lead ve başvuruları burada görürsün.
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
            variant={filter === item.key ? "primary" : "secondary"}
            onClick={() => setFilter(item.key)}
          >
            {item.label}
          </Button>
        ))}
      </div>

      <div className="grid gap-6">
        <Card className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-[var(--color-primary)]">Hoca stüdyo talepleri</h2>
            <Badge variant="muted">{requests.length}</Badge>
          </div>
          {requests.length === 0 ? (
            <p className="text-sm text-[var(--color-muted)]">Henüz talep yok.</p>
          ) : (
            <div className="space-y-3">
              {requests.map((item) => {
                const statusText =
                  item.status === "approved" ? "Onaylandı" : item.status === "rejected" ? "Reddedildi" : "Beklemede";
                const isOpen = openRequests[item.id];
                return (
                  <div
                    key={item.id}
                    className="rounded-xl border border-[var(--color-border)] bg-[var(--color-secondary)] p-3"
                    onClick={() => toggleRequest(item.id)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") toggleRequest(item.id);
                    }}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <p className="truncate text-sm font-semibold text-[var(--color-primary)]">
                        {item.studioName} — {item.teacherName}
                      </p>
                      <div className="flex items-center gap-2 text-xs text-[var(--color-muted)]">
                        <Badge
                          variant={item.status === "pending" ? "outline" : "default"}
                          className={cn(item.status === "rejected" ? "bg-[var(--color-danger)] text-white" : "")}
                        >
                          {statusText}
                        </Badge>
                        <span>{new Date(item.createdAt).toLocaleDateString("tr-TR")}</span>
                      </div>
                    </div>
                    {isOpen && (
                      <div className="mt-2 space-y-2">
                        {item.teacherEmail && (
                          <p className="text-xs text-[var(--color-muted)]">{item.teacherEmail}</p>
                        )}
                        <p className="text-sm text-[var(--color-primary)]">
                          {item.teacherName} stüdyonuzda ders vermek istiyor.
                        </p>
                        {item.status === "pending" && (
                          <div className="flex flex-wrap gap-2">
                            <Button
                              type="button"
                              size="sm"
                              variant="primary"
                              disabled={savingRequestId === item.id}
                              onClick={(e) => {
                                e.stopPropagation();
                                updateRequest(item.id, "approved");
                              }}
                            >
                              Kabul et
                            </Button>
                            <Button
                              type="button"
                              size="sm"
                              variant="secondary"
                              disabled={savingRequestId === item.id}
                              onClick={(e) => {
                                e.stopPropagation();
                                updateRequest(item.id, "rejected");
                              }}
                            >
                              Reddet
                            </Button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </Card>

        <Card className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-[var(--color-primary)]">Üretici stüdyo talepleri</h2>
            <Badge variant="muted">{producerRequestsState.length}</Badge>
          </div>
          {producerRequestsState.length === 0 ? (
            <p className="text-sm text-[var(--color-muted)]">Henüz talep yok.</p>
          ) : (
            <div className="space-y-3">
              {producerRequestsState.map((item) => {
                const statusText =
                  item.status === "approved" ? "Onaylandı" : item.status === "rejected" ? "Reddedildi" : "Beklemede";
                const isOpen = openProducerRequests[item.id];
                return (
                  <div
                    key={item.id}
                    className="rounded-xl border border-[var(--color-border)] bg-[var(--color-secondary)] p-3"
                    onClick={() => toggleProducerRequest(item.id)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") toggleProducerRequest(item.id);
                    }}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <p className="truncate text-sm font-semibold text-[var(--color-primary)]">
                        {item.studioName} — {item.producerName}
                      </p>
                      <div className="flex items-center gap-2 text-xs text-[var(--color-muted)]">
                        <Badge
                          variant={item.status === "pending" ? "outline" : "default"}
                          className={cn(item.status === "rejected" ? "bg-[var(--color-danger)] text-white" : "")}
                        >
                          {statusText}
                        </Badge>
                        <span>{new Date(item.createdAt).toLocaleDateString("tr-TR")}</span>
                      </div>
                    </div>
                    {isOpen && (
                      <div className="mt-2 space-y-2">
                        {item.producerEmail && (
                          <p className="text-xs text-[var(--color-muted)]">{item.producerEmail}</p>
                        )}
                        <p className="text-sm text-[var(--color-primary)]">
                          {item.producerName} stüdyonuzla çalıştığını belirtti.
                        </p>
                        {item.status === "pending" && (
                          <div className="flex flex-wrap gap-2">
                            <Button
                              type="button"
                              size="sm"
                              variant="primary"
                              disabled={savingProducerId === item.id}
                              onClick={(e) => {
                                e.stopPropagation();
                                updateProducerRequest(item.id, "approved");
                              }}
                            >
                              Kabul et
                            </Button>
                            <Button
                              type="button"
                              size="sm"
                              variant="secondary"
                              disabled={savingProducerId === item.id}
                              onClick={(e) => {
                                e.stopPropagation();
                                updateProducerRequest(item.id, "rejected");
                              }}
                            >
                              Reddet
                            </Button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
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
              {leadItems.map((item) => {
                const isOpen = openItems[item.id];
                return (
                  <div
                    key={item.id}
                    className="rounded-xl border border-[var(--color-border)] bg-[var(--color-secondary)] p-3"
                    onClick={() => toggleItem(item.id)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") toggleItem(item.id);
                    }}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <p className="truncate text-sm font-semibold text-[var(--color-primary)]">
                        {item.title} — {item.subtitle}
                      </p>
                      <div className="flex items-center gap-2 text-xs text-[var(--color-muted)]">
                        <Badge
                          variant={item.status === "read" ? "outline" : "default"}
                          className={cn(item.status === "read" ? "" : "bg-[var(--color-warning)] text-white")}
                        >
                          {item.status === "read" ? "Okundu" : "Okunmadı"}
                        </Badge>
                        <span>{new Date(item.createdAt).toLocaleDateString("tr-TR")}</span>
                      </div>
                    </div>
                    {isOpen && (
                      <div className="mt-2 space-y-2">
                        <p className="text-sm text-[var(--color-primary)]">{item.message}</p>
                        {item.status === "unread" && (
                          <Button
                            type="button"
                            size="sm"
                            variant="secondary"
                            className="h-8 px-3 text-xs"
                            disabled={savingId === item.id}
                            onClick={(e) => {
                              e.stopPropagation();
                              markRead(item);
                            }}
                          >
                            Okundu işaretle
                          </Button>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
