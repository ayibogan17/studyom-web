"use client";

import { useState } from "react";
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
};

export default function StudiosClient({ studios }: { studios: StudioRow[] }) {
  const [rows, setRows] = useState(studios);
  const [saving, setSaving] = useState<string | null>(null);

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
            <tr key={studio.id} className="align-top">
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
              <td className="p-2">
                <Button
                  variant="secondary"
                  size="sm"
                  disabled={saving === studio.id}
                  onClick={() => toggleActive(studio.id, !studio.isActive)}
                >
                  {saving === studio.id ? "Kaydediliyor..." : studio.isActive ? "Pasifleştir" : "Aktifleştir"}
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
