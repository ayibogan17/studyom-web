"use client";

import { Fragment, useState } from "react";
import { Button } from "@/components/design-system/components/ui/button";

type ThreadRow = {
  id: string;
  type: "studio" | "teacher" | "producer";
  title: string;
  participants: string[];
  messageCount: number;
  createdAt: Date | string;
  updatedAt: Date | string;
  locked: boolean;
  resolved: boolean;
  complaintsCount: number;
  investigationEnabled: boolean;
  internalNote: string | null;
};

type MessageRow = {
  id: string;
  senderRole: string;
  senderUserId: string | null;
  body: string;
  createdAt: string;
};

export default function MessagesClient({ threads }: { threads: ThreadRow[] }) {
  const [rows, setRows] = useState(threads);
  const [openRow, setOpenRow] = useState<string | null>(null);
  const [saving, setSaving] = useState<string | null>(null);
  const [messages, setMessages] = useState<Record<string, MessageRow[]>>({});
  const [loadingMessages, setLoadingMessages] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const updateRow = (id: string, patch: Partial<ThreadRow>) => {
    setRows((prev) => prev.map((row) => (row.id === id ? { ...row, ...patch } : row)));
  };

  const updateThread = async (row: ThreadRow, payload: Record<string, unknown>) => {
    setSaving(row.id);
    setError(null);
    try {
      const res = await fetch(`/api/admin/messages/threads/${row.type}/${row.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error("Kaydedilemedi");
      updateRow(row.id, payload as Partial<ThreadRow>);
    } catch (err) {
      console.error(err);
      setError("Kaydedilemedi");
    } finally {
      setSaving(null);
    }
  };

  const fetchMessages = async (row: ThreadRow) => {
    setLoadingMessages(row.id);
    setError(null);
    try {
      const res = await fetch(`/api/admin/messages/threads/${row.type}/${row.id}/messages`);
      const json = await res.json().catch(() => null);
      if (!res.ok) throw new Error(json?.error || "Mesajlar alınamadı");
      setMessages((prev) => ({ ...prev, [row.id]: json.messages as MessageRow[] }));
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : "Mesajlar alınamadı");
    } finally {
      setLoadingMessages(null);
    }
  };

  return (
    <div className="space-y-3">
      {rows.map((row) => (
        <Fragment key={row.id}>
          <div className="rounded-xl border border-[var(--color-border)] p-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-[var(--color-primary)]">{row.title}</p>
                <p className="text-xs text-[var(--color-muted)]">
                  {row.type.toUpperCase()} · {row.participants.join(", ")}
                </p>
                <p className="text-xs text-[var(--color-muted)]">
                  {row.messageCount} mesaj · Son güncelleme {new Date(row.updatedAt).toLocaleString("tr-TR")}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  disabled={saving === row.id}
                  onClick={() => updateThread(row, { locked: !row.locked })}
                >
                  {row.locked ? "Kilidi aç" : "Kilitle"}
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  disabled={saving === row.id}
                  onClick={() => updateThread(row, { resolved: !row.resolved })}
                >
                  {row.resolved ? "Çözümü kaldır" : "Çözüldü"}
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  disabled={saving === row.id}
                  onClick={() => updateThread(row, { investigationEnabled: !row.investigationEnabled })}
                >
                  {row.investigationEnabled ? "İncelemeyi kapat" : "İnceleme modu"}
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
            <div className="mt-2 text-xs text-[var(--color-muted)]">
              Şikayet: {row.complaintsCount} · İnceleme: {row.investigationEnabled ? "Açık" : "Kapalı"}
            </div>
          </div>
          {openRow === row.id ? (
            <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-secondary)]/40 p-3 text-xs text-[var(--color-muted)]">
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <p className="font-semibold text-[var(--color-primary)]">İç not</p>
                  <textarea
                    value={row.internalNote ?? ""}
                    onChange={(e) => updateRow(row.id, { internalNote: e.target.value })}
                    className="mt-2 h-20 w-full resize-none rounded-lg border border-[var(--color-border)] bg-transparent p-2 text-[var(--color-primary)]"
                    placeholder="İnceleme notu"
                  />
                </div>
                <div>
                  <p className="font-semibold text-[var(--color-primary)]">Meta</p>
                  <p>Oluşturma: {new Date(row.createdAt).toLocaleString("tr-TR")}</p>
                  <p>Güncelleme: {new Date(row.updatedAt).toLocaleString("tr-TR")}</p>
                  <p>Mesaj sayısı: {row.messageCount}</p>
                </div>
              </div>
              <div className="mt-3 flex items-center gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  disabled={saving === row.id}
                  onClick={() => updateThread(row, { internalNote: row.internalNote ?? null })}
                >
                  {saving === row.id ? "Kaydediliyor..." : "Notu kaydet"}
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  disabled={loadingMessages === row.id}
                  onClick={() => fetchMessages(row)}
                >
                  {loadingMessages === row.id ? "Yükleniyor..." : "Mesajları görüntüle"}
                </Button>
              </div>
              {error ? <p className="mt-2 text-xs text-[var(--color-danger)]">{error}</p> : null}
              {messages[row.id] ? (
                <div className="mt-3 space-y-2">
                  {messages[row.id].length === 0 ? (
                    <p className="text-xs text-[var(--color-muted)]">Mesaj bulunamadı.</p>
                  ) : (
                    messages[row.id].map((msg) => (
                      <div key={msg.id} className="rounded-lg border border-[var(--color-border)] p-2">
                        <p className="text-[11px] text-[var(--color-muted)]">
                          {msg.senderRole} · {new Date(msg.createdAt).toLocaleString("tr-TR")}
                        </p>
                        <p className="text-sm text-[var(--color-primary)]">{msg.body}</p>
                      </div>
                    ))
                  )}
                </div>
              ) : (
                <p className="mt-3 text-xs text-[var(--color-muted)]">
                  İnceleme modu kapalıysa mesaj içerikleri gösterilmez.
                </p>
              )}
            </div>
          ) : null}
        </Fragment>
      ))}
    </div>
  );
}
