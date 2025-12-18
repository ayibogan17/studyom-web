"use client";

import { useState } from "react";
import { Button } from "@/components/design-system/components/ui/button";

type LeadItem = {
  id: string;
  type: "teacher" | "lead";
  status: string;
  createdAt: Date;
  title: string;
  contact: string;
  city: string;
  message: string;
  extra: string | null;
};

const statuses = ["new", "contacted", "closed"] as const;

export default function LeadsClient({ items }: { items: LeadItem[] }) {
  const [rows, setRows] = useState(items);
  const [saving, setSaving] = useState<string | null>(null);

  const updateStatus = async (id: string, type: "teacher" | "lead", status: string) => {
    setSaving(id);
    try {
      const res = await fetch(`/api/admin/leads/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ kind: type, status }),
      });
      if (!res.ok) throw new Error("Kaydedilemedi");
      setRows((prev) => prev.map((l) => (l.id === id ? { ...l, status } : l)));
    } catch (err) {
      console.error(err);
      alert("Kaydedilemedi");
    } finally {
      setSaving(null);
    }
  };

  return (
    <div className="space-y-3">
      {rows.map((lead) => (
        <div key={lead.id} className="rounded-xl border border-[var(--color-border)] p-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-[var(--color-primary)]">{lead.title}</p>
              <p className="text-xs text-[var(--color-muted)]">
                {lead.contact} · {lead.city || "-"} · {new Date(lead.createdAt).toLocaleString("tr-TR")}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <select
                className="rounded-md border border-[var(--color-border)] bg-transparent px-2 py-1 text-sm"
                value={lead.status}
                disabled={saving === lead.id}
                onChange={(e) => updateStatus(lead.id, lead.type, e.target.value)}
              >
                {statuses.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
              <span className="rounded-full bg-[var(--color-secondary)] px-2 py-1 text-xs text-[var(--color-primary)]">
                {lead.type === "teacher" ? "Hoca" : "Genel"}
              </span>
            </div>
          </div>
          <div className="mt-2 text-sm text-[var(--color-primary)] whitespace-pre-wrap">{lead.message || "-"}</div>
          {lead.extra ? <p className="mt-1 text-xs text-[var(--color-muted)]">Ek: {lead.extra}</p> : null}
        </div>
      ))}
      {rows.length === 0 ? <p className="text-sm text-[var(--color-muted)]">Lead yok.</p> : null}
    </div>
  );
}
