"use client";

import { useMemo, useState } from "react";
import { Card } from "@/components/design-system/components/ui/card";
import { Button } from "@/components/design-system/components/ui/button";
import { ThreadComplaint } from "@/components/design-system/components/shared/thread-complaint";

type MessageItem = {
  id: string;
  body: string;
  senderRole: "student" | "studio";
  createdAt: string;
};

type Props = {
  threadId: string;
  studioName: string;
  studentName: string;
  studentEmail: string | null;
  initialMessages: MessageItem[];
  locked: boolean;
};

const formatTime = (value: string) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleString("tr-TR", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });
};

export function StudioOwnerThreadClient({
  threadId,
  studioName,
  studentName,
  studentEmail,
  initialMessages,
  locked,
}: Props) {
  const [messages, setMessages] = useState<MessageItem[]>(initialMessages);
  const [body, setBody] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canSend = useMemo(() => {
    const trimmed = body.trim();
    return trimmed.length > 0 && trimmed.length <= 1200 && !locked;
  }, [body, locked]);

  const handleSend = async () => {
    if (!canSend || sending) return;
    setSending(true);
    setError(null);
    try {
      const res = await fetch("/api/studio-messages/send", {
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

  return (
    <Card className="space-y-4 p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1">
          <p className="text-base font-semibold text-[var(--color-primary)]">Sohbet</p>
          <p className="text-xs text-[var(--color-muted)]">
            {studentName} ile {studioName} arasında.
          </p>
          {studentEmail ? <p className="text-[11px] text-[var(--color-muted)]">{studentEmail}</p> : null}
        </div>
        <ThreadComplaint threadType="studio" threadId={threadId} />
      </div>

      <div className="space-y-2">
        {messages.length === 0 ? (
          <p className="text-sm text-[var(--color-muted)]">Henüz mesaj yok.</p>
        ) : (
          messages.map((msg) => {
            const isStudio = msg.senderRole === "studio";
            return (
              <div key={msg.id} className={`flex ${isStudio ? "justify-end" : "justify-start"}`}>
                <div
                  className={`max-w-[85%] rounded-2xl px-3 py-2 text-sm ${
                    isStudio
                      ? "bg-[var(--color-accent)] text-white"
                      : "bg-[var(--color-surface)] text-[var(--color-primary)]"
                  }`}
                >
                  <p className="whitespace-pre-line">{msg.body}</p>
                  <span className={`mt-1 block text-[10px] ${isStudio ? "text-white/70" : "text-[var(--color-muted)]"}`}>
                    {formatTime(msg.createdAt)}
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>

      <div className="space-y-2">
        <label htmlFor="studio-owner-message" className="text-xs font-semibold text-[var(--color-muted)]">
          Mesajın (max 1200 karakter)
        </label>
        {locked ? (
          <p className="text-xs text-[var(--color-danger)]">Sohbet kilitli. Mesaj gönderemezsin.</p>
        ) : null}
        <textarea
          id="studio-owner-message"
          value={body}
          onChange={(e) => setBody(e.target.value)}
          disabled={locked}
          rows={4}
          className="w-full rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-sm text-[var(--color-primary)] focus:border-[var(--color-accent)] focus:outline-none"
          placeholder="Merhaba, nasıl yardımcı olabilirim?"
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
          <Button size="sm" onClick={handleSend} disabled={!canSend || sending}>
            {sending ? "Gönderiliyor…" : "Gönder"}
          </Button>
        </div>
        {error ? <p className="text-xs text-[var(--color-danger)]">{error}</p> : null}
      </div>
    </Card>
  );
}
