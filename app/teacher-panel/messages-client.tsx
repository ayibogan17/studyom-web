"use client";

import { useEffect, useRef, useState } from "react";
import type { RealtimeChannel } from "@supabase/supabase-js";
import { Card } from "@/components/design-system/components/ui/card";
import { Button } from "@/components/design-system/components/ui/button";
import { getSupabaseBrowserClient } from "@/lib/supabase-browser";

export type TeacherThreadItem = {
  id: string;
  teacherSlug: string;
  channel?: string | null;
  student: { name: string; email: string | null };
  messages: { id: string; body: string; senderRole: string; createdAt: string }[];
};

export function TeacherMessagesClient({ initialThreads }: { initialThreads: TeacherThreadItem[] }) {
  const [threads, setThreads] = useState<TeacherThreadItem[]>(initialThreads);
  const [sending, setSending] = useState<Record<string, boolean>>({});
  const [errors, setErrors] = useState<Record<string, string | null>>({});
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const channelsRef = useRef<Map<string, RealtimeChannel>>(new Map());

  useEffect(() => {
    if (initialThreads.length === 0) return;
    const supabase = getSupabaseBrowserClient();
    if (!supabase) return;

    initialThreads.forEach((thread) => {
      if (!thread.channel) return;
      if (channelsRef.current.has(thread.channel)) return;
      const channel = supabase
        .channel(thread.channel)
        .on("broadcast", { event: "teacher-message" }, ({ payload }) => {
          const next = payload as {
            id: string;
            body: string;
            senderRole: string;
            createdAt: string;
            threadId?: string;
          };
          if (!next?.id) return;
          setThreads((prev) =>
            prev.map((t) => {
              if (next.threadId && t.id !== next.threadId) return t;
              if (t.messages.some((m) => m.id === next.id)) return t;
              return { ...t, messages: [...t.messages, next] };
            }),
          );
        })
        .subscribe();
      channelsRef.current.set(thread.channel, channel);
    });

    return () => {
      channelsRef.current.forEach((channel) => {
        supabase.removeChannel(channel);
      });
      channelsRef.current.clear();
    };
  }, [initialThreads]);

  const handleSend = async (threadId: string) => {
    const body = (drafts[threadId] || "").trim();
    if (!body) return;
    setSending((prev) => ({ ...prev, [threadId]: true }));
    setErrors((prev) => ({ ...prev, [threadId]: null }));
    try {
      const res = await fetch("/api/teacher-messages/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ threadId, body }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        setErrors((prev) => ({ ...prev, [threadId]: json.error || "Mesaj gönderilemedi." }));
        setSending((prev) => ({ ...prev, [threadId]: false }));
        return;
      }
      const message = json.message as { id: string; body: string; senderRole: string; createdAt: string };
      setThreads((prev) =>
        prev.map((t) =>
          t.id === threadId ? { ...t, messages: [...t.messages, message] } : t,
        ),
      );
      setDrafts((prev) => ({ ...prev, [threadId]: "" }));
      setSending((prev) => ({ ...prev, [threadId]: false }));
    } catch {
      setErrors((prev) => ({ ...prev, [threadId]: "Mesaj gönderilemedi." }));
      setSending((prev) => ({ ...prev, [threadId]: false }));
    }
  };

  if (threads.length === 0) {
    return (
      <Card className="p-5 text-sm text-[var(--color-muted)]">
        Şu anda mesaj talebi yok.
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {threads.map((thread) => (
        <Card key={thread.id} className="space-y-4 p-5">
          <div className="space-y-1">
            <p className="text-sm font-semibold text-[var(--color-primary)]">
              {thread.student.name}
            </p>
            <p className="text-xs text-[var(--color-muted)]">{thread.student.email || "E-posta yok"}</p>
          </div>
          <div className="space-y-2">
            {thread.messages.map((msg) => (
              <div key={msg.id} className="rounded-2xl bg-[var(--color-secondary)] px-3 py-2 text-sm text-[var(--color-primary)]">
                <p className="whitespace-pre-line">{msg.body}</p>
              </div>
            ))}
          </div>
          <div className="space-y-2">
            <textarea
              value={drafts[thread.id] || ""}
              onChange={(e) => setDrafts((prev) => ({ ...prev, [thread.id]: e.target.value }))}
              rows={3}
              className="w-full rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-sm text-[var(--color-primary)] focus:border-[var(--color-accent)] focus:outline-none"
              placeholder="Yanıtını yaz"
            />
            <div className="flex items-center justify-between gap-3">
              {errors[thread.id] ? (
                <p className="text-xs text-[var(--color-danger)]">{errors[thread.id]}</p>
              ) : (
                <span className="text-xs text-[var(--color-muted)]">
                  {drafts[thread.id]?.trim().length || 0} / 1200
                </span>
              )}
              <Button
                size="sm"
                onClick={() => handleSend(thread.id)}
                disabled={sending[thread.id] || !(drafts[thread.id] || "").trim()}
              >
                {sending[thread.id] ? "Gönderiliyor…" : "Yanıtla"}
              </Button>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}
