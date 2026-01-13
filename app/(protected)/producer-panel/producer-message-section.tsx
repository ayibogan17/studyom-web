"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/design-system/components/ui/button";
import { TeacherPanelSection } from "@/app/(protected)/teacher-panel/teacher-panel-section";
import { ProducerRequestsClient, type ProducerMessageRequestItem } from "./requests-client";

type MessagePayload = {
  requests: ProducerMessageRequestItem[];
  totalRequestCount: number;
  activeThreadCount: number;
};

export function ProducerMessageSection() {
  const [loading, setLoading] = useState(true);
  const [payload, setPayload] = useState<MessagePayload>({
    requests: [],
    totalRequestCount: 0,
    activeThreadCount: 0,
  });

  useEffect(() => {
    let alive = true;
    const load = async () => {
      try {
        const res = await fetch("/api/producer-panel/messages");
        if (!res.ok) return;
        const json = (await res.json()) as MessagePayload;
        if (alive) {
          setPayload(json);
        }
      } finally {
        if (alive) setLoading(false);
      }
    };
    load();
    return () => {
      alive = false;
    };
  }, []);

  const pendingCount = payload.requests.length;
  const emptyLabel = useMemo(() => (loading ? "Yükleniyor…" : "Yeni talep yok."), [loading]);

  return (
    <TeacherPanelSection title="Mesajlar" description="Yeni mesaj taleplerini ve iletişimi buradan yönetebilirsin." defaultOpen>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-xs text-[var(--color-muted)]">Sohbetleri görüntülemek için mesajlar sayfasına geç.</p>
        <Button asChild size="sm" variant="secondary">
          <Link href="/producer-panel/messages">Mesajları aç</Link>
        </Button>
      </div>
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
          <p className="text-sm font-semibold text-[var(--color-primary)]">Bekleyen talepler</p>
          <p className="text-2xl font-semibold text-[var(--color-primary)]">{pendingCount}</p>
          <p className="text-xs text-[var(--color-muted)]">Yanıtladığında sohbet açılır.</p>
        </div>
        <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
          <p className="text-sm font-semibold text-[var(--color-primary)]">Aktif sohbetler</p>
          <p className="text-2xl font-semibold text-[var(--color-primary)]">
            {loading ? "…" : payload.activeThreadCount}
          </p>
          <p className="text-xs text-[var(--color-muted)]">Konuşmaların açık olanları.</p>
        </div>
        <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
          <p className="text-sm font-semibold text-[var(--color-primary)]">Toplam talepler</p>
          <p className="text-2xl font-semibold text-[var(--color-primary)]">
            {loading ? "…" : payload.totalRequestCount}
          </p>
          <p className="text-xs text-[var(--color-muted)]">Geçmiş ve bekleyen istekler.</p>
        </div>
      </div>
      <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
        <p className="text-sm font-semibold text-[var(--color-primary)]">Mesaj talepleri</p>
        <div className="mt-3">
          {payload.requests.length ? <ProducerRequestsClient initial={payload.requests} /> : (
            <p className="text-xs text-[var(--color-muted)]">{emptyLabel}</p>
          )}
        </div>
      </div>
    </TeacherPanelSection>
  );
}
