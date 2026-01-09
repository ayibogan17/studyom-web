"use client";

import { useEffect, useMemo, useState } from "react";
import { useSession } from "next-auth/react";
import { Card } from "@/components/design-system/components/ui/card";
import { Button } from "@/components/design-system/components/ui/button";
import { ThreadComplaint } from "@/components/design-system/components/shared/thread-complaint";

type MessageItem = {
  id: string;
  body: string;
  senderRole: "student" | "studio";
  createdAt: string;
};

export function StudioMessageThread({
  threadId: initialThreadId,
  studioId,
  studioName,
}: {
  threadId?: string | null;
  studioId?: string | null;
  studioName: string;
}) {
  const { status } = useSession();
  const [messages, setMessages] = useState<MessageItem[]>([]);
  const [threadId, setThreadId] = useState<string | null>(initialThreadId ?? null);
  const [locked, setLocked] = useState(false);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [body, setBody] = useState("");
  const [error, setError] = useState<string | null>(null);

  const canSend = useMemo(
    () => body.trim().length > 0 && body.trim().length <= 1200 && !locked,
    [body, locked],
  );
  const isAuthed = status === "authenticated";

  useEffect(() => {
    if (!isAuthed) return;
    if (!threadId && !studioId) return;
    setLoading(true);
    setError(null);
    const payload = threadId ? { threadId } : { studioId };
    fetch("/api/messages/threads", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    })
      .then((res) => res.json())
      .then((json) => {
        if (!json.ok) {
          setError(json.error || "Mesajlar alınamadı.");
          return;
        }
        if (json.threadId) {
          setThreadId(json.threadId);
        }
        setLocked(Boolean(json.locked));
        const incoming = (json.messages || []) as MessageItem[];
        const unique = new Map<string, MessageItem>();
        for (const msg of incoming) {
          if (!msg?.id) continue;
          unique.set(msg.id, msg);
        }
        setMessages(Array.from(unique.values()));
      })
      .catch(() => setError("Mesajlar alınamadı."))
      .finally(() => setLoading(false));
  }, [isAuthed, studioId, threadId]);

  const handleSend = async () => {
    if (!canSend || sending || !threadId) return;
    setSending(true);
    setError(null);
    try {
      const res = await fetch("/api/messages/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ threadId, body }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(json.error || "Mesaj gönderilemedi.");
        return;
      }
      const nextMessage = json.message as MessageItem;
      setMessages((prev) => (prev.some((msg) => msg.id === nextMessage.id) ? prev : [...prev, nextMessage]));
      setBody("");
    } catch {
      setError("Mesaj gönderilemedi.");
    } finally {
      setSending(false);
    }
  };

  if (!isAuthed) {
    return (
      <Card id="messages" className="space-y-4 p-5">
        <p className="text-base font-semibold text-[var(--color-primary)]">Mesaj gönder</p>
        <p className="text-sm text-[var(--color-muted)]">
          {studioName} ile mesajlaşmak için giriş yapmanız gerekir.
        </p>
      </Card>
    );
  }

  return (
    <Card id="messages" className="space-y-4 p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1">
          <p className="text-base font-semibold text-[var(--color-primary)]">Mesaj gönder</p>
          <p className="text-xs text-[var(--color-muted)]">
            Bu sohbet yalnızca {studioName} ile aranızdadır.
          </p>
        </div>
        {threadId ? <ThreadComplaint threadType="studio" threadId={threadId} /> : null}
      </div>

      {loading ? (
        <div className="space-y-3">
          <p className="text-sm text-[var(--color-muted)]">Mesajlar yükleniyor…</p>
          <div className="h-24 rounded-2xl border border-[var(--color-border)] bg-[var(--color-secondary)]/70" />
        </div>
      ) : (
        <div className="space-y-3">
          {messages.length === 0 ? (
            <p className="text-sm text-[var(--color-muted)]">Henüz mesaj yok.</p>
          ) : (
            <div className="space-y-2">
              {messages.map((msg) => {
                const isStudent = msg.senderRole === "student";
                return (
                  <div key={msg.id} className={`flex ${isStudent ? "justify-end" : "justify-start"}`}>
                    <div
                      className={`max-w-[85%] rounded-2xl px-3 py-2 text-sm ${
                        isStudent
                          ? "bg-[var(--color-accent)] text-white"
                          : "bg-[var(--color-secondary)] text-[var(--color-primary)]"
                      }`}
                    >
                      <p className="whitespace-pre-line">{msg.body}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      <div className="space-y-2">
        <label htmlFor={`studio-message-${threadId ?? "new"}`} className="text-xs font-semibold text-[var(--color-muted)]">
          Mesajın (max 1200 karakter)
        </label>
        {locked ? (
          <p className="text-xs text-[var(--color-danger)]">Sohbet kilitli. Mesaj gönderemezsin.</p>
        ) : null}
        <textarea
          id={`studio-message-${threadId ?? "new"}`}
          value={body}
          onChange={(e) => setBody(e.target.value)}
          disabled={locked}
          rows={4}
          className="w-full rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-sm text-[var(--color-primary)] focus:border-[var(--color-accent)] focus:outline-none"
          placeholder="Merhaba, stüdyo hakkında bilgi almak istiyorum."
          onKeyDown={(e) => {
            if (e.key !== "Enter" || e.shiftKey) return;
            e.preventDefault();
            if (canSend && !sending) {
              handleSend();
            }
          }}
        />
        <div className="flex items-center justify-between gap-3">
          <span className="text-xs text-[var(--color-muted)]">{body.trim().length} / 1200</span>
          <Button size="sm" onClick={handleSend} disabled={!canSend || sending || !threadId}>
            {sending ? "Gönderiliyor…" : "Gönder"}
          </Button>
        </div>
        {error ? <p className="text-xs text-[var(--color-danger)]">{error}</p> : null}
      </div>
    </Card>
  );
}
