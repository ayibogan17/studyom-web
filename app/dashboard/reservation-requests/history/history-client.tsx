"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Badge } from "@/components/design-system/components/ui/badge";
import { Button } from "@/components/design-system/components/ui/button";
import { Card } from "@/components/design-system/components/ui/card";

type HistoryItem = {
  id: string;
  roomName: string;
  requesterName: string;
  requesterPhone: string;
  requesterEmail: string | null;
  requesterImage: string | null;
  requesterIsAnon: boolean;
  note: string | null;
  status: string;
  createdAt: string;
  startAt: string;
  hours: number;
  totalPrice: number | null;
};

type Props = {
  items: HistoryItem[];
  studioName: string;
};

const formatStatus = (value?: string | null) => {
  const status = (value ?? "").toLowerCase();
  if (status === "approved" || status === "onaylı" || status === "onayli") return "Onaylandı";
  if (status === "rejected" || status === "reddedildi") return "Reddedildi";
  return "—";
};

const formatDateTime = (value?: string | null) => {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleString("tr-TR", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const formatPrice = (value?: number | null) => {
  if (value === null || value === undefined) return "Fiyat bilgisi yok";
  return `${Math.round(value).toLocaleString("tr-TR")} ₺`;
};

const parseDateTimeLocal = (value: string) => {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
};

const getInitials = (value: string) => {
  const parts = value
    .split(" ")
    .map((part) => part.trim())
    .filter(Boolean);
  const first = parts[0]?.[0] || "";
  const last = parts.length > 1 ? parts[parts.length - 1]?.[0] : "";
  return `${first}${last}`.toUpperCase();
};

function ReservationAvatar({
  name,
  image,
  isAnon,
}: {
  name: string;
  image?: string | null;
  isAnon?: boolean;
}) {
  if (image && !isAnon) {
    return <img src={image} alt={name} className="h-10 w-10 rounded-full object-cover" />;
  }
  const initials = isAnon ? "AN" : getInitials(name) || "AN";
  const label = isAnon ? "Anon kullanıcı" : name || "Kullanıcı";
  return (
    <div
      className="flex h-10 w-10 items-center justify-center rounded-full border border-orange-200 bg-orange-100 text-xs font-semibold text-orange-800"
      aria-label={label}
      title={label}
    >
      {initials}
    </div>
  );
}

export default function ReservationHistoryClient({ items, studioName }: Props) {
  const [fromValue, setFromValue] = useState("");
  const [toValue, setToValue] = useState("");

  const filteredItems = useMemo(() => {
    const fromDate = parseDateTimeLocal(fromValue);
    const toDate = parseDateTimeLocal(toValue);
    return items.filter((item) => {
      const createdAt = new Date(item.createdAt);
      if (Number.isNaN(createdAt.getTime())) return false;
      if (fromDate && createdAt < fromDate) return false;
      if (toDate && createdAt > toDate) return false;
      return true;
    });
  }, [items, fromValue, toValue]);

  const clearFilters = () => {
    setFromValue("");
    setToValue("");
  };

  return (
    <div className="bg-gradient-to-b from-white via-orange-50/60 to-white">
      <div className="mx-auto w-full max-w-5xl px-6 py-10">
        <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
            <Link
              href="/dashboard?as=studio&tab=panel"
              className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-orange-200 text-orange-600 transition hover:border-orange-400"
              aria-label="Panele dön"
              title="Panele dön"
            >
                <ArrowLeft className="h-4 w-4" />
              </Link>
              <h1 className="text-2xl font-semibold text-orange-950">Rezervasyon geçmişi</h1>
            </div>
            <p className="text-sm text-orange-700">
              {studioName} için onaylanan ve reddedilen istekler.
            </p>
          </div>
          <Badge
            variant="muted"
            className="border border-orange-200 bg-orange-100/80 text-orange-700"
          >
            {filteredItems.length}
          </Badge>
        </div>

        <Card className="space-y-4 border border-orange-200/60 bg-orange-50/80 p-4">
          <div className="grid gap-3 md:grid-cols-[1fr_1fr_auto]">
            <label className="flex flex-col gap-2 text-sm text-orange-700">
              Başlangıç zamanı
              <input
                type="datetime-local"
                value={fromValue}
                onChange={(event) => setFromValue(event.target.value)}
                className="rounded-lg border border-orange-200 bg-white px-3 py-2 text-sm text-orange-950 focus:border-orange-400 focus:outline-none"
              />
            </label>
            <label className="flex flex-col gap-2 text-sm text-orange-700">
              Bitiş zamanı
              <input
                type="datetime-local"
                value={toValue}
                onChange={(event) => setToValue(event.target.value)}
                className="rounded-lg border border-orange-200 bg-white px-3 py-2 text-sm text-orange-950 focus:border-orange-400 focus:outline-none"
              />
            </label>
            <div className="flex items-end">
              <Button
                type="button"
                size="sm"
                variant="secondary"
                onClick={clearFilters}
                disabled={!fromValue && !toValue}
                className="border-orange-200 text-orange-700 hover:bg-orange-50"
              >
                Filtreyi temizle
              </Button>
            </div>
          </div>

          {filteredItems.length === 0 ? (
            <p className="text-sm text-orange-700">Seçilen aralıkta geçmiş istek yok.</p>
          ) : (
            <div className="space-y-3">
              {filteredItems.map((item) => {
                const statusLabel = formatStatus(item.status);
                return (
                  <div key={item.id} className="rounded-xl border border-orange-200/60 bg-white/80 p-3">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div className="flex items-start gap-3">
                        <ReservationAvatar
                          name={item.requesterName}
                          image={item.requesterImage}
                          isAnon={item.requesterIsAnon}
                        />
                        <div className="space-y-1">
                          <p className="text-sm font-semibold text-orange-950">
                            {item.requesterName} · {item.roomName}
                          </p>
                          <p className="text-xs text-orange-700">
                            Rezervasyon: {formatDateTime(item.startAt)} · {item.hours} saat
                          </p>
                          <p className="text-xs text-orange-700">Talep zamanı: {formatDateTime(item.createdAt)}</p>
                        </div>
                      </div>
                      <span
                        className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                          statusLabel === "Onaylandı"
                            ? "bg-emerald-100 text-emerald-700"
                            : "bg-rose-100 text-rose-700"
                        }`}
                      >
                        {statusLabel}
                      </span>
                    </div>
                    <div className="mt-2 space-y-1 text-xs text-orange-700">
                      <p>Telefon: {item.requesterPhone}</p>
                      {item.requesterEmail && <p>E-posta: {item.requesterEmail}</p>}
                      {item.note && <p>Not: {item.note}</p>}
                      <p>Ücret: {formatPrice(item.totalPrice)}</p>
                    </div>
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
