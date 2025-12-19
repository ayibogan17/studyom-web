"use client";

import { Fragment, useState } from "react";
import { Button } from "@/components/design-system/components/ui/button";

type TeacherItem = {
  id: number;
  userId: string;
  status: string;
  createdAt: Date;
  data: any;
  user: { id: string; email: string; fullName: string | null; city: string | null } | null;
};

const statuses = ["pending", "approved", "rejected", "closed"] as const;

export default function TeachersClient({ items }: { items: TeacherItem[] }) {
  const [rows, setRows] = useState(items);
  const [saving, setSaving] = useState<number | null>(null);
  const [openRow, setOpenRow] = useState<number | null>(null);

  const updateStatus = async (id: number, status: string) => {
    setSaving(id);
    try {
      const res = await fetch(`/api/admin/teachers/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error("Kaydedilemedi");
      setRows((prev) => prev.map((r) => (r.id === id ? { ...r, status } : r)));
    } catch (err) {
      console.error(err);
      alert("Kaydedilemedi");
    } finally {
      setSaving(null);
    }
  };

  return (
    <div className="space-y-3">
      {rows.map((row) => (
        <Fragment key={row.id}>
          <div className="rounded-xl border border-[var(--color-border)] p-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-[var(--color-primary)]">
                  {row.user?.fullName || "İsim yok"} — {row.user?.email || row.userId}
                </p>
                <p className="text-xs text-[var(--color-muted)]">
                  {row.user?.city || "-"} · {new Date(row.createdAt).toLocaleString("tr-TR")}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <select
                  className="rounded-md border border-[var(--color-border)] bg-transparent px-2 py-1 text-sm"
                  value={row.status}
                  disabled={saving === row.id}
                  onChange={(e) => updateStatus(row.id, e.target.value)}
                >
                  {statuses.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
                <Button
                  variant="secondary"
                  size="sm"
                  disabled={saving === row.id}
                  onClick={() => updateStatus(row.id, row.status === "approved" ? "pending" : "approved")}
                >
                  {saving === row.id ? "Kaydediliyor..." : row.status === "approved" ? "Beklemeye al" : "Onayla"}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setOpenRow(openRow === row.id ? null : row.id)}
                >
                  {openRow === row.id ? "Detay gizle" : "Detaylar"}
                </Button>
              </div>
            </div>
            <div className="mt-3 grid gap-2 text-sm text-[var(--color-primary)] sm:grid-cols-2 lg:grid-cols-3">
              <div>
                <p className="text-[var(--color-muted)]">Alanlar</p>
                <p>{row.data?.instruments?.join(", ") || "-"}</p>
              </div>
              <div>
                <p className="text-[var(--color-muted)]">Seviyeler</p>
                <p>{row.data?.levels?.join(", ") || "-"}</p>
              </div>
              <div>
                <p className="text-[var(--color-muted)]">Format</p>
                <p>{row.data?.formats?.join(", ") || "-"}</p>
              </div>
              <div>
                <p className="text-[var(--color-muted)]">Şehir</p>
                <p>{row.data?.city || "-"}</p>
              </div>
              <div className="sm:col-span-2 lg:col-span-3">
                <p className="text-[var(--color-muted)]">Açıklama</p>
                <p className="whitespace-pre-wrap text-[var(--color-primary)]">{row.data?.statement || "-"}</p>
              </div>
            </div>
          </div>
          {openRow === row.id ? (
            <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-secondary)]/40 p-3 text-xs text-[var(--color-muted)]">
              <p className="font-semibold text-[var(--color-primary)]">Tüm veri</p>
              <pre className="mt-2 whitespace-pre-wrap text-[10px] text-[var(--color-primary)]">
                {JSON.stringify(row.data, null, 2)}
              </pre>
            </div>
          ) : null}
        </Fragment>
      ))}
      {rows.length === 0 ? <p className="text-sm text-[var(--color-muted)]">Başvuru yok.</p> : null}
    </div>
  );
}
