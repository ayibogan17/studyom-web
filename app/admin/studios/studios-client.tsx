"use client";

import { Fragment, useState } from "react";
import { Button } from "@/components/design-system/components/ui/button";

type StudioRow = {
  id: string;
  name: string;
  slug: string | null;
  city: string | null;
  district: string | null;
  address: string | null;
  ownerEmail: string;
  phone: string | null;
  isActive: boolean;
  visibilityStatus: string | null;
  moderationNote: string | null;
  complaintsCount: number;
  flagsCount: number;
  contactCount: number;
  createdAt: Date;
  updatedAt: Date;
  openingHours: unknown;
  rooms: Array<{
    id: string;
    name: string;
    type: string;
    color: string | null;
    pricingModel: string;
    flatRate: string | null;
    minRate: string | null;
    dailyRate: string | null;
    hourlyRate: string | null;
    equipmentJson: unknown;
    featuresJson: unknown;
    extrasJson: unknown;
    imagesJson: unknown;
    createdAt: Date;
    updatedAt: Date;
  }>;
  notifications: Array<{ id: string; message: string; createdAt: Date }>;
  ratings: Array<{ id: string; value: number; comment: string | null; createdAt: Date }>;
};

export default function StudiosClient({ studios }: { studios: StudioRow[] }) {
  const [rows, setRows] = useState(studios);
  const [saving, setSaving] = useState<string | null>(null);
  const [openRow, setOpenRow] = useState<string | null>(null);

  const updateRow = (id: string, patch: Partial<StudioRow>) => {
    setRows((prev) => prev.map((row) => (row.id === id ? { ...row, ...patch } : row)));
  };

  const updateStudio = async (id: string, payload: Record<string, unknown>) => {
    setSaving(id);
    try {
      const res = await fetch(`/api/admin/studios/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error("Güncellenemedi");
      setRows((prev) => prev.map((s) => (s.id === id ? { ...s, ...payload } : s)));
    } catch (err) {
      console.error(err);
      alert("Kaydedilemedi");
    } finally {
      setSaving(null);
    }
  };

  const publish = (studio: StudioRow) =>
    updateStudio(studio.id, { visibilityStatus: "published" });

  const hide = (studio: StudioRow) =>
    updateStudio(studio.id, { visibilityStatus: "hidden" });

  const markNeedsChanges = (studio: StudioRow) =>
    updateStudio(studio.id, { visibilityStatus: "draft", moderationNote: studio.moderationNote ?? null });

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full text-sm">
        <thead className="text-left text-[var(--color-muted)]">
          <tr>
            <th className="p-2">Stüdyo</th>
            <th className="p-2">Şehir</th>
            <th className="p-2">Durum</th>
            <th className="p-2">Etkileşim (30g)</th>
            <th className="p-2">Şikayet</th>
            <th className="p-2">Flag</th>
            <th className="p-2">İşlem</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[var(--color-border)]">
          {rows.map((studio) => (
            <Fragment key={studio.id}>
              <tr className="align-top">
                <td className="p-2 font-semibold text-[var(--color-primary)]">{studio.name}</td>
                <td className="p-2">{studio.city || "-"}</td>
                <td className="p-2">
                  <span
                    className={`rounded-full px-2 py-1 text-xs ${
                      (studio.visibilityStatus || (studio.isActive ? "published" : "hidden")) === "published"
                        ? "bg-[var(--color-success)]/20 text-[var(--color-success)]"
                        : "bg-[var(--color-warning)]/20 text-[var(--color-warning)]"
                    }`}
                  >
                    {studio.visibilityStatus || (studio.isActive ? "published" : "hidden")}
                  </span>
                </td>
                <td className="p-2">{studio.contactCount ?? 0}</td>
                <td className="p-2">{studio.complaintsCount ?? 0}</td>
                <td className="p-2">{studio.flagsCount ?? 0}</td>
                <td className="p-2 space-x-2">
                  <Button
                    variant="secondary"
                    size="sm"
                    disabled={saving === studio.id}
                    onClick={() => publish(studio)}
                  >
                    {saving === studio.id ? "Kaydediliyor..." : "Yayınla"}
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    disabled={saving === studio.id}
                    onClick={() => hide(studio)}
                    className="border-[var(--color-danger)]/40 text-[var(--color-danger)] hover:bg-[var(--color-danger)]/10"
                  >
                    Gizle
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    disabled={saving === studio.id}
                    onClick={() => markNeedsChanges(studio)}
                  >
                    Değişiklik iste
                  </Button>
                  {studio.slug ? (
                    <a
                      href={`/studyo/${studio.slug}`}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex rounded-lg px-2 py-1 text-xs font-semibold text-[var(--color-accent)]"
                    >
                      Görüntüle
                    </a>
                  ) : null}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setOpenRow(openRow === studio.id ? null : studio.id)}
                  >
                    {openRow === studio.id ? "Detay gizle" : "Detaylar"}
                  </Button>
                </td>
              </tr>
              {openRow === studio.id ? (
                <tr className="bg-[var(--color-secondary)]/40">
                  <td colSpan={7} className="p-3 text-xs text-[var(--color-muted)]">
                    <div className="mb-3 grid gap-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-secondary)] p-3">
                      <div>
                        <div className="font-semibold text-[var(--color-primary)]">Moderasyon notu</div>
                        <textarea
                          value={studio.moderationNote ?? ""}
                          onChange={(e) => updateRow(studio.id, { moderationNote: e.target.value })}
                          className="mt-2 h-20 w-full resize-none rounded-lg border border-[var(--color-border)] bg-transparent p-2 text-[var(--color-primary)]"
                          placeholder="Needs changes notu"
                        />
                      </div>
                      <div className="flex justify-end">
                        <Button
                          variant="secondary"
                          size="sm"
                          disabled={saving === studio.id}
                          onClick={() => updateStudio(studio.id, { moderationNote: studio.moderationNote ?? null })}
                        >
                          {saving === studio.id ? "Kaydediliyor..." : "Notu kaydet"}
                        </Button>
                      </div>
                    </div>
                    <div className="grid gap-2 sm:grid-cols-2">
                      <div>
                        <span className="font-semibold text-[var(--color-primary)]">ID:</span> {studio.id}
                      </div>
                      <div>
                        <span className="font-semibold text-[var(--color-primary)]">Güncellendi:</span>{" "}
                        {new Date(studio.updatedAt).toLocaleString("tr-TR")}
                      </div>
                      <div>
                        <span className="font-semibold text-[var(--color-primary)]">İletişim:</span>{" "}
                        {studio.ownerEmail} {studio.phone ? `· ${studio.phone}` : ""}
                      </div>
                      <div>
                        <span className="font-semibold text-[var(--color-primary)]">Açılış saatleri:</span>{" "}
                        {studio.openingHours ? JSON.stringify(studio.openingHours) : "-"}
                      </div>
                      <div>
                        <span className="font-semibold text-[var(--color-primary)]">Oda sayısı:</span>{" "}
                        {studio.rooms.length}
                      </div>
                    </div>
                    <div className="mt-3">
                      <p className="font-semibold text-[var(--color-primary)]">Odalar</p>
                      <pre className="mt-1 whitespace-pre-wrap rounded-xl border border-[var(--color-border)] bg-[var(--color-secondary)] p-2 text-[10px] text-[var(--color-primary)]">
                        {JSON.stringify(studio.rooms, null, 2)}
                      </pre>
                    </div>
                    <div className="mt-3">
                      <p className="font-semibold text-[var(--color-primary)]">Bildirimler</p>
                      <pre className="mt-1 whitespace-pre-wrap rounded-xl border border-[var(--color-border)] bg-[var(--color-secondary)] p-2 text-[10px] text-[var(--color-primary)]">
                        {JSON.stringify(studio.notifications, null, 2)}
                      </pre>
                    </div>
                    <div className="mt-3">
                      <p className="font-semibold text-[var(--color-primary)]">Puanlar</p>
                      <pre className="mt-1 whitespace-pre-wrap rounded-xl border border-[var(--color-border)] bg-[var(--color-secondary)] p-2 text-[10px] text-[var(--color-primary)]">
                        {JSON.stringify(studio.ratings, null, 2)}
                      </pre>
                    </div>
                  </td>
                </tr>
              ) : null}
            </Fragment>
          ))}
        </tbody>
      </table>
    </div>
  );
}
