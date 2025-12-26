"use client";

import { useState } from "react";
import { Button } from "@/components/design-system/components/ui/button";

export type ProducerMessageRequestItem = {
  id: string;
  message: string;
  createdAt: string;
  fromUser: {
    fullName?: string | null;
    email?: string | null;
  };
};

export function ProducerRequestsClient({ initial }: { initial: ProducerMessageRequestItem[] }) {
  const [rows, setRows] = useState(initial);
  const [saving, setSaving] = useState<{ id: string; action: "accept" | "decline" } | null>(null);

  const updateStatus = async (id: string, status: "accepted" | "declined") => {
    setSaving({ id, action: status === "accepted" ? "accept" : "decline" });
    try {
      const res = await fetch(`/api/producer-message/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error("Kaydedilemedi");
      setRows((prev) => prev.filter((row) => row.id !== id));
    } catch (err) {
      console.error(err);
      alert("Kaydedilemedi");
    } finally {
      setSaving(null);
    }
  };

  if (rows.length === 0) {
    return <p className="text-sm text-[var(--color-muted)]">Bekleyen mesaj talebi yok.</p>;
  }

  return (
    <div className="space-y-3">
      {rows.map((row) => (
        <div key={row.id} className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-[var(--color-primary)]">
                {row.fromUser.fullName || row.fromUser.email || "İsimsiz kullanıcı"}
              </p>
              <p className="text-xs text-[var(--color-muted)]">
                {row.fromUser.email || "E-posta yok"} · {new Date(row.createdAt).toLocaleString("tr-TR")}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="secondary"
                size="sm"
                disabled={saving?.id === row.id}
                onClick={() => updateStatus(row.id, "declined")}
                className="border-[var(--color-danger)]/40 text-[var(--color-danger)] hover:bg-[var(--color-danger)]/10"
              >
                {saving?.id === row.id && saving.action === "decline" ? "Reddediliyor..." : "Reddet"}
              </Button>
              <Button
                size="sm"
                disabled={saving?.id === row.id}
                onClick={() => updateStatus(row.id, "accepted")}
              >
                {saving?.id === row.id && saving.action === "accept" ? "Yanıtlanıyor..." : "Yanıtla"}
              </Button>
            </div>
          </div>
          <div className="mt-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-secondary)] p-3 text-sm text-[var(--color-primary)]">
            {row.message}
          </div>
          <p className="mt-2 text-xs text-[var(--color-muted)]">
            Yanıt verildiğinde sohbet açılır. İlk mesajlar tek seferliktir.
          </p>
        </div>
      ))}
    </div>
  );
}
