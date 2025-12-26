"use client";

import { useMemo, useState } from "react";
import { Card } from "@/components/design-system/components/ui/card";
import { Button } from "@/components/design-system/components/ui/button";
import { Badge } from "@/components/design-system/components/ui/badge";
import { Input } from "@/components/design-system/components/ui/input";
import { cn } from "@/components/design-system/lib/cn";

type StudioOption = {
  id: string;
  name: string;
  city?: string | null;
  district?: string | null;
};

type StudioLink = {
  id: string;
  status: "pending" | "approved" | "rejected";
  createdAt: string;
  studio: StudioOption;
};

type Props = {
  initialLinks: StudioLink[];
};

const statusMap: Record<StudioLink["status"], { label: string; variant: "default" | "outline" | "muted" }> = {
  approved: { label: "Bağlı", variant: "default" },
  pending: { label: "Onay bekliyor", variant: "outline" },
  rejected: { label: "Reddedildi", variant: "muted" },
};

function studioLabel(studio: StudioOption) {
  return [studio.name, studio.district, studio.city].filter(Boolean).join(" • ");
}

export function TeacherStudioLinksClient({ initialLinks }: Props) {
  const [links, setLinks] = useState<StudioLink[]>(initialLinks);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<StudioOption[]>([]);
  const [searching, setSearching] = useState(false);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);

  const linkedIds = useMemo(() => new Set(links.map((link) => link.studio.id)), [links]);
  const approved = links.filter((link) => link.status === "approved");
  const pending = links.filter((link) => link.status === "pending");

  const runSearch = async () => {
    setStatus(null);
    const trimmed = query.trim();
    if (!trimmed) {
      setResults([]);
      return;
    }
    setSearching(true);
    try {
      const res = await fetch(`/api/teacher-panel/studios?query=${encodeURIComponent(trimmed)}`);
      if (!res.ok) throw new Error("Arama yapılamadı");
      const json = (await res.json()) as { studios: StudioOption[] };
      setResults(json.studios || []);
    } catch (err) {
      console.error(err);
      setStatus("Arama sırasında hata oluştu.");
    } finally {
      setSearching(false);
    }
  };

  const createRequest = async (studio: StudioOption) => {
    setSavingId(studio.id);
    setStatus(null);
    try {
      const res = await fetch("/api/teacher-panel/studio-links", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ studioId: studio.id }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.error || "İstek gönderilemedi");
      const link = json.link as StudioLink;
      setLinks((prev) => {
        const exists = prev.find((item) => item.studio.id === link.studio.id);
        if (exists) {
          return prev.map((item) => (item.studio.id === link.studio.id ? link : item));
        }
        return [link, ...prev];
      });
      setStatus("İstek gönderildi. Stüdyo sahibi onayladığında burada görünecek.");
    } catch (err) {
      console.error(err);
      setStatus(err instanceof Error ? err.message : "İstek gönderilemedi.");
    } finally {
      setSavingId(null);
    }
  };

  return (
    <Card className="space-y-5 p-6">
      <div className="space-y-1">
        <h2 className="text-base font-semibold text-[var(--color-primary)]">Bağlı olduğu stüdyolar</h2>
        <p className="text-sm text-[var(--color-muted)]">
          Hocalara açık stüdyolardan seçim yapabilirsin. Talep gönderdiğinde stüdyo sahibi onaylar veya reddeder.
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Stüdyo adı yazın"
          className="h-10 min-w-[220px] flex-1"
        />
        <Button type="button" variant="secondary" onClick={runSearch} disabled={searching}>
          {searching ? "Aranıyor..." : "Stüdyo ekle"}
        </Button>
      </div>

      {status && <p className="text-xs text-[var(--color-muted)]">{status}</p>}

      {results.length > 0 && (
        <div className="space-y-2">
          {results.map((studio) => {
            const linked = linkedIds.has(studio.id);
            const existing = links.find((link) => link.studio.id === studio.id);
            const statusInfo = existing ? statusMap[existing.status] : null;
            return (
              <div
                key={studio.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-3"
              >
                <div>
                  <p className="text-sm font-semibold text-[var(--color-primary)]">{studio.name}</p>
                  <p className="text-xs text-[var(--color-muted)]">{studioLabel(studio)}</p>
                </div>
                <div className="flex items-center gap-2">
                  {statusInfo ? (
                    <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>
                  ) : (
                    <Badge variant="outline">Uygun</Badge>
                  )}
                  <Button
                    type="button"
                    size="sm"
                    variant="primary"
                    disabled={linked || savingId === studio.id}
                    onClick={() => createRequest(studio)}
                  >
                    {linked ? "İstek gönderildi" : savingId === studio.id ? "Gönderiliyor..." : "İstek gönder"}
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2 rounded-2xl border border-[var(--color-border)] bg-[var(--color-secondary)] p-4">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-[var(--color-primary)]">Bağlı stüdyolar</p>
            <Badge variant="muted">{approved.length}</Badge>
          </div>
          {approved.length === 0 ? (
            <p className="text-xs text-[var(--color-muted)]">Henüz bağlı stüdyo yok.</p>
          ) : (
            <ul className="space-y-2 text-sm text-[var(--color-primary)]">
              {approved.map((link) => (
                <li key={link.id}>{studioLabel(link.studio)}</li>
              ))}
            </ul>
          )}
        </div>

        <div className="space-y-2 rounded-2xl border border-[var(--color-border)] bg-[var(--color-secondary)] p-4">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-[var(--color-primary)]">Onay bekleyen</p>
            <Badge variant="muted">{pending.length}</Badge>
          </div>
          {pending.length === 0 ? (
            <p className="text-xs text-[var(--color-muted)]">Bekleyen talep yok.</p>
          ) : (
            <ul className="space-y-2 text-sm text-[var(--color-primary)]">
              {pending.map((link) => (
                <li key={link.id} className="flex items-center justify-between gap-2">
                  <span>{studioLabel(link.studio)}</span>
                  <Badge variant={statusMap.pending.variant} className={cn("text-[10px]")}>
                    {statusMap.pending.label}
                  </Badge>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </Card>
  );
}
