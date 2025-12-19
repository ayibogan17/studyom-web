"use client";

import { useState } from "react";
import { Button } from "@/components/design-system/components/ui/button";

type StudioRow = {
  id: string;
  name: string;
  city: string | null;
  district: string | null;
  ownerEmail: string;
  phone: string | null;
  createdAt: Date;
  isActive: boolean;
};

type AppRow = {
  id: number;
  userId: string;
  status: string;
  createdAt: Date;
  data: any;
  user: { id: string; email: string; fullName: string | null; city: string | null } | null;
};

const statuses = ["pending", "approved", "rejected", "closed"] as const;

export default function ApplicationsClient({
  kind,
  studios,
  teacherApps,
  producerApps,
}: {
  kind: "studio" | "teacher" | "producer";
  studios: StudioRow[];
  teacherApps: AppRow[];
  producerApps: AppRow[];
}) {
  if (kind === "studio") {
    return <StudioApplications initial={studios} />;
  }
  if (kind === "teacher") {
    return <RoleApplications initial={teacherApps} apiBase="/api/admin/teachers" />;
  }
  return <RoleApplications initial={producerApps} apiBase="/api/admin/producers" />;
}

function StudioApplications({ initial }: { initial: StudioRow[] }) {
  const [rows, setRows] = useState(initial);
  const [saving, setSaving] = useState<string | null>(null);

  const approve = async (id: string) => {
    setSaving(id);
    try {
      const res = await fetch(`/api/admin/studios/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: true }),
      });
      if (!res.ok) throw new Error("Kaydedilemedi");
      setRows((prev) => prev.filter((r) => r.id !== id));
    } catch (err) {
      console.error(err);
      alert("Kaydedilemedi");
    } finally {
      setSaving(null);
    }
  };

  if (rows.length === 0) {
    return <p className="text-sm text-[var(--color-muted)]">Bekleyen başvuru yok.</p>;
  }

  return (
    <div className="space-y-3">
      {rows.map((studio) => (
        <div key={studio.id} className="rounded-xl border border-[var(--color-border)] p-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-[var(--color-primary)]">{studio.name}</p>
              <p className="text-xs text-[var(--color-muted)]">
                {studio.city || "-"} / {studio.district || "-"} · {studio.ownerEmail} ·{" "}
                {new Date(studio.createdAt).toLocaleString("tr-TR")}
              </p>
            </div>
            <Button
              variant="primary"
              size="sm"
              disabled={saving === studio.id}
              onClick={() => approve(studio.id)}
            >
              {saving === studio.id ? "Onaylanıyor..." : "Onayla"}
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
}

function RoleApplications({ initial, apiBase }: { initial: AppRow[]; apiBase: string }) {
  const [rows, setRows] = useState(initial);
  const [saving, setSaving] = useState<number | null>(null);
  const [openRow, setOpenRow] = useState<number | null>(null);

  const updateStatus = async (id: number, status: string) => {
    setSaving(id);
    try {
      const res = await fetch(`${apiBase}/${id}`, {
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

  if (rows.length === 0) {
    return <p className="text-sm text-[var(--color-muted)]">Bekleyen başvuru yok.</p>;
  }

  return (
    <div className="space-y-3">
      {rows.map((row) => (
        <div key={row.id} className="rounded-xl border border-[var(--color-border)] p-3">
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
                variant="ghost"
                size="sm"
                onClick={() => setOpenRow(openRow === row.id ? null : row.id)}
              >
                {openRow === row.id ? "Detay gizle" : "Detaylar"}
              </Button>
            </div>
          </div>
          <div className="mt-2 text-sm text-[var(--color-primary)]">
            {row.data?.statement || "Açıklama yok."}
          </div>
          {openRow === row.id ? (
            <pre className="mt-2 whitespace-pre-wrap rounded-xl border border-[var(--color-border)] bg-[var(--color-secondary)] p-2 text-[10px] text-[var(--color-primary)]">
              {JSON.stringify(row.data, null, 2)}
            </pre>
          ) : null}
        </div>
      ))}
    </div>
  );
}
