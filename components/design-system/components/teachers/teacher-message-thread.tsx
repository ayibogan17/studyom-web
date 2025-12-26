"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { Card } from "@/components/design-system/components/ui/card";
import { Button } from "@/components/design-system/components/ui/button";
import { getSupabaseBrowserClient } from "@/lib/supabase-browser";

type MessageItem = {
  id: string;
  body: string;
  senderRole: "student" | "teacher";
  createdAt: string;
};

export function TeacherMessageThread({
  teacherSlug,
  teacherName,
}: {
  teacherSlug: string;
  teacherName: string;
}) {
  const { data: session, status } = useSession();
  const [messages, setMessages] = useState<MessageItem[]>([]);
  const [threadId, setThreadId] = useState<string | null>(null);
  const [channelName, setChannelName] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [body, setBody] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const isAuthed = status === "authenticated";

  useEffect(() => {
    if (!isAuthed) return;
    setLoading(true);
    setError(null);
    fetch(`/api/teacher-messages/thread?teacherSlug=${encodeURIComponent(teacherSlug)}`)
      .then((res) => res.json())
      .then((json) => {
        if (!json.ok) {
          setError(json.error || "Mesajlar alınamadı.");
          return;
        }
        setThreadId(json.threadId || null);
        setChannelName(json.channel || null);
        setMessages((json.messages || []) as MessageItem[]);
      })
      .catch(() => setError("Mesajlar alınamadı."))
      .finally(() => setLoading(false));
  }, [teacherSlug, isAuthed]);

  useEffect(() => {
    if (!channelName) return;
    const supabase = getSupabaseBrowserClient();
    if (!supabase) return;
    const channel = supabase
      .channel(channelName)
      .on("broadcast", { event: "teacher-message" }, ({ payload }) => {
        const next = payload as MessageItem & { threadId?: string };
        if (threadId && next.threadId && next.threadId !== threadId) return;
        if (!next?.id) return;
        setMessages((prev) => (prev.some((msg) => msg.id === next.id) ? prev : [...prev, next]));
      })
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [channelName, threadId]);

  const canSend = useMemo(() => body.trim().length > 0 && body.trim().length <= 1200, [body]);

  const handleSend = async () => {
    if (!canSend || sending) return;
    setSending(true);
    setError(null);
    setInfo(null);
    try {
      const res = await fetch("/api/teacher-messages/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ teacherSlug, body }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(json.error || "Mesaj gönderilemedi.");
        setSending(false);
        return;
      }
      if (json.threadId) {
        setThreadId(json.threadId);
      }
      if (json.channel) {
        setChannelName(json.channel);
      }
      const nextMessage = json.message as MessageItem;
      setMessages((prev) => [...prev, nextMessage]);
      setBody("");
      setInfo("Mesajın iletildi.");
      setSending(false);
    } catch {
      setError("Mesaj gönderilemedi.");
      setSending(false);
    }
  };

  if (!isAuthed) {
    return (
      <Card id="messages" className="space-y-4 p-5">
        <p className="text-base font-semibold text-[var(--color-primary)]">Mesaj gönder</p>
        <p className="text-sm text-[var(--color-muted)]">
          {teacherName} ile mesajlaşmak için giriş yapmanız gerekir.
        </p>
        <Button asChild size="sm">
          <Link href={`/login?redirect=/hocalar/${teacherSlug}#messages`}>Giriş yap</Link>
        </Button>
      </Card>
    );
  }

  return (
    <Card id="messages" className="space-y-4 p-5">
      <div className="space-y-1">
        <p className="text-base font-semibold text-[var(--color-primary)]">Mesaj gönder</p>
        <p className="text-xs text-[var(--color-muted)]">
          Bu sohbet yalnızca {teacherName} ile aranızdadır.
        </p>
      </div>

      <div className="space-y-3">
        {loading ? (
          <p className="text-sm text-[var(--color-muted)]">Mesajlar yükleniyor…</p>
        ) : messages.length === 0 ? (
          <p className="text-sm text-[var(--color-muted)]">Henüz mesaj yok. İlk mesajını yazabilirsin.</p>
        ) : (
          <div className="space-y-2">
            {messages.map((msg) => {
              const isStudent = msg.senderRole === "student";
              return (
                <div
                  key={msg.id}
                  className={`flex ${isStudent ? "justify-end" : "justify-start"}`}
                >
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

      <div className="space-y-2">
        <label htmlFor="teacher-message" className="text-xs font-semibold text-[var(--color-muted)]">
          Mesajın (max 1200 karakter)
        </label>
        <textarea
          id="teacher-message"
          value={body}
          onChange={(e) => setBody(e.target.value)}
          rows={4}
          className="w-full rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-sm text-[var(--color-primary)] focus:border-[var(--color-accent)] focus:outline-none"
          placeholder="Merhaba, ders planı hakkında konuşabilir miyiz?"
        />
        <div className="flex items-center justify-between gap-3">
          <span className="text-xs text-[var(--color-muted)]">{body.trim().length} / 1200</span>
          <Button size="sm" onClick={handleSend} disabled={!canSend || sending}>
            {sending ? "Gönderiliyor…" : "Gönder"}
          </Button>
        </div>
        {error && <p className="text-xs text-[var(--color-danger)]">{error}</p>}
        {info && <p className="text-xs text-[var(--color-muted)]">{info}</p>}
      </div>
    </Card>
  );
}
