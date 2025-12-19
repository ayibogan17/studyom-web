"use client";

import { Fragment, useState } from "react";
import { Button } from "@/components/design-system/components/ui/button";

type StudioRow = {
  id: string;
  name: string;
  city: string | null;
  district: string | null;
  address: string | null;
  ownerEmail: string;
  phone: string | null;
  isActive: boolean;
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

  const toggleActive = async (id: string, next: boolean) => {
    setSaving(id);
    try {
      const res = await fetch(`/api/admin/studios/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: next }),
      });
      if (!res.ok) throw new Error("Güncellenemedi");
      setRows((prev) => prev.map((s) => (s.id === id ? { ...s, isActive: next } : s)));
    } catch (err) {
      console.error(err);
      alert("Kaydedilemedi");
    } finally {
      setSaving(null);
    }
  };

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full text-sm">
        <thead className="text-left text-[var(--color-muted)]">
          <tr>
            <th className="p-2">Stüdyo</th>
            <th className="p-2">Şehir</th>
            <th className="p-2">İlçe</th>
            <th className="p-2">Adres</th>
            <th className="p-2">İletişim</th>
            <th className="p-2">Durum</th>
            <th className="p-2">İşlem</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[var(--color-border)]">
          {rows.map((studio) => (
            <Fragment key={studio.id}>
              <tr className="align-top">
                <td className="p-2 font-semibold text-[var(--color-primary)]">{studio.name}</td>
                <td className="p-2">{studio.city || "-"}</td>
                <td className="p-2">{studio.district || "-"}</td>
                <td className="p-2 text-[var(--color-muted)]">{studio.address || "-"}</td>
                <td className="p-2">
                  <div className="space-y-1 text-[var(--color-muted)]">
                    <div>{studio.ownerEmail}</div>
                    {studio.phone ? <div>{studio.phone}</div> : null}
                  </div>
                </td>
                <td className="p-2">
                  <span
                    className={`rounded-full px-2 py-1 text-xs ${
                      studio.isActive
                        ? "bg-[var(--color-success)]/20 text-[var(--color-success)]"
                        : "bg-[var(--color-danger)]/20 text-[var(--color-danger)]"
                    }`}
                  >
                    {studio.isActive ? "Aktif" : "Pasif"}
                  </span>
                </td>
                <td className="p-2 space-x-2">
                  <Button
                    variant="secondary"
                    size="sm"
                    disabled={saving === studio.id}
                    onClick={() => toggleActive(studio.id, !studio.isActive)}
                  >
                    {saving === studio.id ? "Kaydediliyor..." : studio.isActive ? "Pasifleştir" : "Aktifleştir"}
                  </Button>
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
                    <div className="grid gap-2 sm:grid-cols-2">
                      <div>
                        <span className="font-semibold text-[var(--color-primary)]">ID:</span> {studio.id}
                      </div>
                      <div>
                        <span className="font-semibold text-[var(--color-primary)]">Güncellendi:</span>{" "}
                        {new Date(studio.updatedAt).toLocaleString("tr-TR")}
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
