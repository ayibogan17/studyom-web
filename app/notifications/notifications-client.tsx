"use client";

import { useState } from "react";
import { Bell } from "lucide-react";
import { Card } from "@/components/design-system/components/ui/card";
import { Badge } from "@/components/design-system/components/ui/badge";
import { Button } from "@/components/design-system/components/ui/button";
import { cn } from "@/components/design-system/lib/cn";

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
  studioRequests: StudioRequestItem[];
  producerRequests: ProducerStudioRequestItem[];
};

export default function NotificationsClient({ studioRequests, producerRequests }: Props) {
  const [requests, setRequests] = useState(studioRequests);
  const [producerRequestsState, setProducerRequestsState] = useState(producerRequests);
  const [savingRequestId, setSavingRequestId] = useState<string | null>(null);
  const [savingProducerId, setSavingProducerId] = useState<string | null>(null);
  const [openRequests, setOpenRequests] = useState<Record<string, boolean>>({});
  const [openProducerRequests, setOpenProducerRequests] = useState<Record<string, boolean>>({});

  const toggleRequest = (id: string) => {
    setOpenRequests((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const toggleProducerRequest = (id: string) => {
    setOpenProducerRequests((prev) => ({ ...prev, [id]: !prev[id] }));
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
    <div className="mx-auto w-full max-w-4xl px-4 py-10 sm:px-6">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-2">
          <h1 className="text-2xl font-semibold text-[var(--color-primary)]">Bildirimler</h1>
          <p className="text-sm text-[var(--color-muted)]">Stüdyo taleplerini burada görürsün.</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-[var(--color-border)]">
            <Bell className="h-5 w-5 text-[var(--color-primary)]" aria-hidden />
          </span>
        </div>
      </div>

      <div className="grid gap-6">
        <Card className="space-y-4">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
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
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                      <p className="truncate text-sm font-semibold text-[var(--color-primary)]">
                        {item.studioName} — {item.teacherName}
                      </p>
                      <div className="flex flex-wrap items-center gap-2 text-xs text-[var(--color-muted)]">
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
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
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
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                      <p className="truncate text-sm font-semibold text-[var(--color-primary)]">
                        {item.studioName} — {item.producerName}
                      </p>
                      <div className="flex flex-wrap items-center gap-2 text-xs text-[var(--color-muted)]">
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
      </div>
    </div>
  );
}
