"use client";

import { useEffect, useRef, useState } from "react";
import type { RealtimeChannel } from "@supabase/supabase-js";
import { Card } from "@/components/design-system/components/ui/card";
import { Button } from "@/components/design-system/components/ui/button";
import { getSupabaseBrowserClient } from "@/lib/supabase-browser";
import { ThreadComplaint } from "@/components/design-system/components/shared/thread-complaint";

export type TeacherThreadItem = {
  id: string;
  teacherSlug: string;
  channel?: string | null;
  locked: boolean;
  student: { id: string; name: string; email: string | null; image?: string | null };
  messages: { id: string; body: string; senderRole: string; createdAt: string }[];
};

export type TeacherRequestItem = {
  id: string;
  teacherSlug: string;
  messageText: string;
  createdAt: string;
  student: { id: string; name: string; email: string | null };
};

type AvatarInfo = { image: string | null; initials: string; alt: string };

function getInitials(value: string) {
  const parts = value
    .split(" ")
    .map((part) => part.trim())
    .filter(Boolean);
  const first = parts[0]?.[0] || "";
  const last = parts.length > 1 ? parts[parts.length - 1]?.[0] : "";
  return `${first}${last}`.toUpperCase();
}

function Avatar({ info }: { info: AvatarInfo }) {
  if (info.image) {
    return <img src={info.image} alt={info.alt} className="h-7 w-7 rounded-full object-cover" />;
  }
  return (
    <div className="flex h-7 w-7 items-center justify-center rounded-full bg-[var(--color-secondary)] text-[10px] font-semibold text-[var(--color-primary)]">
      {info.initials}
    </div>
  );
}

export function TeacherMessagesClient({
  initialThreads,
  initialRequests,
  whatsappEnabled,
  initialStudentIds,
  teacherAvatar,
}: {
  initialThreads: TeacherThreadItem[];
  initialRequests: TeacherRequestItem[];
  whatsappEnabled: boolean;
  initialStudentIds: string[];
  teacherAvatar: { image: string | null; initials: string };
}) {
  const [threads, setThreads] = useState<TeacherThreadItem[]>(() =>
    initialThreads.map((thread) => {
      const unique = new Map<string, TeacherThreadItem["messages"][number]>();
      thread.messages.forEach((msg) => {
        if (msg?.id) unique.set(msg.id, msg);
      });
      return { ...thread, messages: Array.from(unique.values()) };
    }),
  );
  const [requests, setRequests] = useState<TeacherRequestItem[]>(initialRequests);
  const [sending, setSending] = useState<Record<string, boolean>>({});
  const [errors, setErrors] = useState<Record<string, string | null>>({});
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [requestDrafts, setRequestDrafts] = useState<Record<string, string>>({});
  const [openThreads, setOpenThreads] = useState<Record<string, boolean>>({});
  const [openRequests, setOpenRequests] = useState<Record<string, boolean>>({});
  const [savedStudentIds, setSavedStudentIds] = useState<string[]>(initialStudentIds);
  const [savingStudent, setSavingStudent] = useState<Record<string, boolean>>({});
  const channelsRef = useRef<Map<string, RealtimeChannel>>(new Map());

  useEffect(() => {
    if (threads.length === 0) return;
    const supabase = getSupabaseBrowserClient();
    if (!supabase) return;

    threads.forEach((thread) => {
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
  }, [threads]);

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
        prev.map((t) => {
          if (t.id !== threadId) return t;
          if (t.messages.some((msg) => msg.id === message.id)) return t;
          return { ...t, messages: [...t.messages, message] };
        }),
      );
      setDrafts((prev) => ({ ...prev, [threadId]: "" }));
      setSending((prev) => ({ ...prev, [threadId]: false }));
    } catch {
      setErrors((prev) => ({ ...prev, [threadId]: "Mesaj gönderilemedi." }));
      setSending((prev) => ({ ...prev, [threadId]: false }));
    }
  };

  const handleRequestAction = async (id: string, action: "accept" | "decline") => {
    setErrors((prev) => ({ ...prev, [id]: null }));
    setSending((prev) => ({ ...prev, [id]: true }));
    try {
      const reply = requestDrafts[id]?.trim();
      const request = requests.find((r) => r.id === id);
      if (action === "accept" && !reply) {
        setErrors((prev) => ({ ...prev, [id]: "Yanıt gerekli." }));
        setSending((prev) => ({ ...prev, [id]: false }));
        return;
      }
      const res = await fetch(`/api/teacher-messages/request/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action,
          reply,
          studentUserId: request?.student.id,
          teacherSlug: request?.teacherSlug,
        }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        setErrors((prev) => ({ ...prev, [id]: json.error || "Güncellenemedi." }));
        setSending((prev) => ({ ...prev, [id]: false }));
        return;
      }

      setRequests((prev) => prev.filter((r) => r.id !== id));

      if (action === "accept" && request && json.threadId) {
        const nextThread: TeacherThreadItem = {
          id: json.threadId as string,
          teacherSlug: request.teacherSlug,
          channel: json.channel as string | null,
          locked: false,
          student: request.student,
          messages: json.message
            ? [
                {
                  id: json.message.id,
                  body: json.message.body,
                  senderRole: json.message.senderRole,
                  createdAt: new Date(json.message.createdAt).toISOString(),
                },
              ]
            : [],
        };
        setThreads((prev) => [nextThread, ...prev]);
      }
      setSending((prev) => ({ ...prev, [id]: false }));
    } catch {
      setErrors((prev) => ({ ...prev, [id]: "Güncellenemedi." }));
      setSending((prev) => ({ ...prev, [id]: false }));
    }
  };

  const handleSaveStudent = async (thread: TeacherThreadItem) => {
    if (!thread.student.id || savingStudent[thread.id]) return;
    if (savedStudentIds.includes(thread.student.id)) return;
    setSavingStudent((prev) => ({ ...prev, [thread.id]: true }));
    try {
      const res = await fetch("/api/teacher-panel/students", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studentId: thread.student.id,
          studentName: thread.student.name,
          studentImage: thread.student.image ?? null,
        }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        setErrors((prev) => ({ ...prev, [thread.id]: json.error || "Öğrenci eklenemedi." }));
        setSavingStudent((prev) => ({ ...prev, [thread.id]: false }));
        return;
      }
      setSavedStudentIds((prev) => (prev.includes(thread.student.id) ? prev : [...prev, thread.student.id]));
      setSavingStudent((prev) => ({ ...prev, [thread.id]: false }));
    } catch {
      setErrors((prev) => ({ ...prev, [thread.id]: "Öğrenci eklenemedi." }));
      setSavingStudent((prev) => ({ ...prev, [thread.id]: false }));
    }
  };

  if (threads.length === 0 && requests.length === 0) {
    return <Card className="p-5 text-sm text-[var(--color-muted)]">Şu anda mesaj talebi yok.</Card>;
  }

  return (
    <div className="space-y-4">
      {requests.length > 0 && (
        <Card className="space-y-4 p-5">
          <div className="space-y-1">
            <p className="text-sm font-semibold text-[var(--color-primary)]">Mesaj Talepleri</p>
            <p className="text-xs text-[var(--color-muted)]">
              Öğrenciler ilk mesajı gönderir. Yanıtladığında sohbet açılır.
            </p>
          </div>
          <div className="space-y-4">
            {requests.map((req) => (
              <div
                key={req.id}
                className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4"
                onClick={() => setOpenRequests((prev) => ({ ...prev, [req.id]: !prev[req.id] }))}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.currentTarget !== e.target) return;
                  if (e.key === "Enter" || e.key === " ") {
                    setOpenRequests((prev) => ({ ...prev, [req.id]: !prev[req.id] }));
                  }
                }}
              >
                <div className="flex items-center justify-between gap-3">
                  <p className="truncate text-sm font-semibold text-[var(--color-primary)]">
                    {req.student.name} — {req.messageText}
                  </p>
                  <span className="text-xs text-[var(--color-muted)]">
                    {new Date(req.createdAt).toLocaleDateString("tr-TR", {
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                    })}
                  </span>
                </div>
                {openRequests[req.id] && (
                  <div className="mt-3 space-y-3">
                    <p className="text-xs text-[var(--color-muted)]">{req.student.email || "E-posta yok"}</p>
                    <p className="text-sm text-[var(--color-primary)] whitespace-pre-line">
                      {req.messageText}
                    </p>
                    <textarea
                      value={requestDrafts[req.id] || ""}
                      onChange={(e) =>
                        setRequestDrafts((prev) => ({ ...prev, [req.id]: e.target.value }))
                      }
                      rows={3}
                      className="w-full rounded-2xl border border-[var(--color-border)] bg-[var(--color-secondary)] px-3 py-2 text-sm text-[var(--color-primary)] focus:border-[var(--color-accent)] focus:outline-none"
                      placeholder="Yanıtını yaz"
                      onClick={(e) => e.stopPropagation()}
                    />
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      {errors[req.id] ? (
                        <p className="text-xs text-[var(--color-danger)]">{errors[req.id]}</p>
                      ) : (
                        <span className="text-xs text-[var(--color-muted)]">
                          {(requestDrafts[req.id] || "").trim().length} / 1200
                        </span>
                      )}
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRequestAction(req.id, "decline");
                          }}
                          disabled={sending[req.id]}
                        >
                          Reddet
                        </Button>
                        <Button
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRequestAction(req.id, "accept");
                          }}
                          disabled={sending[req.id] || !(requestDrafts[req.id] || "").trim()}
                        >
                          {sending[req.id] ? "Gönderiliyor…" : "Yanıtla"}
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </Card>
      )}

      {threads.map((thread) => (
        <Card
          key={thread.id}
          className="space-y-3 p-5"
          onClick={() => setOpenThreads((prev) => ({ ...prev, [thread.id]: !prev[thread.id] }))}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.currentTarget !== e.target) return;
            if (e.key === "Enter" || e.key === " ") {
              setOpenThreads((prev) => ({ ...prev, [thread.id]: !prev[thread.id] }));
            }
          }}
        >
          <div className="flex items-center justify-between gap-3">
            <p className="truncate text-sm font-semibold text-[var(--color-primary)]">
              {thread.student.name} — {thread.messages.at(-1)?.body || "Yeni sohbet"}
            </p>
            <span className="text-xs text-[var(--color-muted)]">
              {thread.messages.at(-1)?.createdAt
                ? new Date(thread.messages.at(-1)!.createdAt).toLocaleDateString("tr-TR")
                : "—"}
            </span>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-[var(--color-muted)]">
            {savedStudentIds.includes(thread.student.id) ? (
              <span>Studyom Öğrencilerim listesinde</span>
            ) : (
              <span>Bu öğrenciyi Studyom Öğrencilerim listene ekleyebilirsin.</span>
            )}
            <Button
              size="sm"
              variant="secondary"
              onClick={(e) => {
                e.stopPropagation();
                handleSaveStudent(thread);
              }}
              disabled={savingStudent[thread.id] || savedStudentIds.includes(thread.student.id)}
            >
              {savedStudentIds.includes(thread.student.id)
                ? "Eklendi"
                : savingStudent[thread.id]
                  ? "Ekleniyor…"
                  : "Öğrencilerime ekle"}
            </Button>
          </div>
          {openThreads[thread.id] && (
            <>
              <p className="text-xs text-[var(--color-muted)]">{thread.student.email || "E-posta yok"}</p>
              {whatsappEnabled ? (
                <p className="text-xs text-[var(--color-muted)]">
                  WhatsApp’a geç seçeneği öğrenciye açıktır.
                </p>
              ) : null}
              {thread.locked ? (
                <p className="text-xs text-[var(--color-danger)]">Sohbet kilitli. Mesaj gönderemezsin.</p>
              ) : null}
              <div className="flex justify-end">
                <ThreadComplaint threadType="teacher" threadId={thread.id} />
              </div>
              <div className="space-y-2">
                {thread.messages.map((msg) => {
                  const isTeacher = msg.senderRole === "teacher";
                  const teacherInfo: AvatarInfo = {
                    image: teacherAvatar.image,
                    initials: teacherAvatar.initials,
                    alt: "Hoca",
                  };
                  const studentInfo: AvatarInfo = {
                    image: thread.student.image ?? null,
                    initials: getInitials(thread.student.name),
                    alt: "Öğrenci",
                  };
                  return (
                    <div
                      key={msg.id}
                      className={`flex items-end gap-2 ${isTeacher ? "justify-end" : "justify-start"}`}
                    >
                      {!isTeacher ? <Avatar info={studentInfo} /> : null}
                      <div
                        className={`max-w-[80%] rounded-2xl px-3 py-2 text-sm ${
                          isTeacher
                            ? "bg-[var(--color-accent)] text-white"
                            : "bg-[var(--color-secondary)] text-[var(--color-primary)]"
                        }`}
                      >
                        <p className="whitespace-pre-line">{msg.body}</p>
                      </div>
                      {isTeacher ? <Avatar info={teacherInfo} /> : null}
                    </div>
                  );
                })}
              </div>
              <div className="space-y-2">
                <textarea
                  value={drafts[thread.id] || ""}
                  onChange={(e) => setDrafts((prev) => ({ ...prev, [thread.id]: e.target.value }))}
                  rows={3}
                  disabled={thread.locked}
                  className="w-full rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-sm text-[var(--color-primary)] focus:border-[var(--color-accent)] focus:outline-none"
                  placeholder="Yanıtını yaz"
                  onClick={(e) => e.stopPropagation()}
                  onKeyDown={(e) => {
                    if (e.key !== "Enter" || e.shiftKey) return;
                    e.preventDefault();
                    e.stopPropagation();
                    if ((drafts[thread.id] || "").trim() && !sending[thread.id] && !thread.locked) {
                      handleSend(thread.id);
                    }
                  }}
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
                    onClick={(e) => {
                      e.stopPropagation();
                      handleSend(thread.id);
                    }}
                    disabled={thread.locked || sending[thread.id] || !(drafts[thread.id] || "").trim()}
                  >
                    {sending[thread.id] ? "Gönderiliyor…" : "Yanıtla"}
                  </Button>
                </div>
              </div>
            </>
          )}
        </Card>
      ))}
    </div>
  );
}
