"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
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

const urlLike = /(https?:\/\/|www\.)/i;

export function TeacherMessageThread({
  teacherSlug,
  teacherName,
}: {
  teacherSlug: string;
  teacherName: string;
}) {
  const { data: session, status } = useSession();
  const searchParams = useSearchParams();
  const [messages, setMessages] = useState<MessageItem[]>([]);
  const [threadId, setThreadId] = useState<string | null>(null);
  const [channelName, setChannelName] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [requestSending, setRequestSending] = useState(false);
  const [body, setBody] = useState("");
  const [requestBody, setRequestBody] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [request, setRequest] = useState<{ id: string; status: string } | null>(null);
  const [whatsapp, setWhatsapp] = useState<{ enabled: boolean; number: string | null } | null>(null);
  const [showModal, setShowModal] = useState(false);
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
        setRequest(json.request || null);
        setWhatsapp(json.whatsapp || null);
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
  }, [teacherSlug, isAuthed]);

  useEffect(() => {
    if (!isAuthed) return;
    const autoOpen = searchParams.get("message") === "1";
    if (autoOpen && !threadId && request?.status !== "pending") {
      setShowModal(true);
    }
  }, [isAuthed, searchParams, threadId, request?.status]);

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
  const requestCount = requestBody.trim().length;
  const canRequest = requestCount > 0 && requestCount <= 400 && !urlLike.test(requestBody);
  const hasTeacherReply = messages.some((msg) => msg.senderRole === "teacher");
  const studentName =
    (session?.user?.name as string | undefined) ||
    (session?.user?.email as string | undefined) ||
    "Öğrenci";
  const whatsappLink = useMemo(() => {
    if (!whatsapp?.enabled || !whatsapp.number || !hasTeacherReply) return null;
    const digits = whatsapp.number.replace(/\D/g, "");
    if (!digits) return null;
    const text = `Merhaba, ben ${studentName}, size Studyom üzerinden ulaşıyorum.`;
    return `https://wa.me/${digits}?text=${encodeURIComponent(text)}`;
  }, [whatsapp, hasTeacherReply, teacherName, studentName]);

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
      setMessages((prev) =>
        prev.some((msg) => msg.id === nextMessage.id) ? prev : [...prev, nextMessage],
      );
      setBody("");
      setInfo("Mesajın iletildi.");
      setSending(false);
    } catch {
      setError("Mesaj gönderilemedi.");
      setSending(false);
    }
  };

  const handleRequest = async () => {
    if (!canRequest || requestSending) return;
    setRequestSending(true);
    setError(null);
    setInfo(null);
    try {
      const res = await fetch("/api/teacher-messages/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ teacherSlug, message: requestBody }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(json.error || "Mesaj gönderilemedi.");
        setRequestSending(false);
        return;
      }
      setRequest(json.request || { id: "", status: "pending" });
      setRequestBody("");
      setShowModal(false);
      setInfo("Mesajın iletildi. Yanıt gelirse burada sohbet açılır.");
    } catch {
      setError("Mesaj gönderilemedi.");
    } finally {
      setRequestSending(false);
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
      {info && !threadId ? <p className="text-xs text-[var(--color-muted)]">{info}</p> : null}

      {!threadId && request?.status === "pending" ? (
        <div className="space-y-2 rounded-2xl border border-[var(--color-border)] bg-[var(--color-secondary)] p-3 text-sm text-[var(--color-primary)]">
          <p>İlk mesajın iletildi. Hoca yanıt verirse sohbet açılır.</p>
          <p className="text-xs text-[var(--color-muted)]">
            Bu özellik, spam’i azaltmak için ilk mesajı sınırlı tutar.
          </p>
        </div>
      ) : !threadId && request?.status === "declined" ? (
        <div className="space-y-2">
          <p className="text-sm text-[var(--color-muted)]">
            Son mesaj isteğin reddedildi. Daha sonra tekrar deneyebilirsin.
          </p>
          <Button size="sm" onClick={() => setShowModal(true)}>
            Mesaj gönder
          </Button>
        </div>
      ) : !threadId ? (
        <div className="space-y-3">
          <p className="text-sm text-[var(--color-muted)]">
            İlk mesaj kısa tutulur. Hoca yanıt verirse sohbet açılır.
          </p>
          <Button size="sm" onClick={() => setShowModal(true)}>
            Mesaj gönder
          </Button>
        </div>
      ) : (
        <>
          {loading ? (
            <div className="space-y-3">
              <p className="text-sm text-[var(--color-muted)]">Mesajlar yükleniyor…</p>
              <div className="h-24 rounded-2xl border border-[var(--color-border)] bg-[var(--color-secondary)]/70" />
            </div>
          ) : (
            <>
              <div className="space-y-3">
                {messages.length === 0 ? (
                  <p className="text-sm text-[var(--color-muted)]">Henüz mesaj yok.</p>
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

              {whatsappLink ? (
                <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-secondary)] px-3 py-2 text-xs text-[var(--color-muted)]">
                  <p>Hoca WhatsApp ile devam etmeye izin veriyor.</p>
                  <div className="mt-2">
                    <Button
                      asChild
                      size="sm"
                      className="bg-[#25D366] !text-black hover:bg-[#1EBE5D] hover:!text-black text-[13px] font-semibold tracking-wide shadow-sm"
                    >
                      <a href={whatsappLink} target="_blank" rel="noreferrer">
                        WhatsApp’a geç
                      </a>
                    </Button>
                  </div>
                </div>
              ) : null}

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
                {error && <p className="text-xs text-[var(--color-danger)]">{error}</p>}
                {info && <p className="text-xs text-[var(--color-muted)]">{info}</p>}
              </div>
            </>
          )}
        </>
      )}

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-lg rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5 shadow-xl">
            <div className="space-y-1">
              <p className="text-base font-semibold text-[var(--color-primary)]">İlk mesaj</p>
              <p className="text-xs text-[var(--color-muted)]">
                İlk mesaj kısa tutulur. Hoca yanıt verirse sohbet açılır.
              </p>
            </div>
            <p className="mt-2 text-xs text-[var(--color-muted)]">
              Bu özellik, spam’i azaltmak için ilk mesajı sınırlı tutar.
            </p>
          <div className="mt-3 space-y-2">
            <textarea
              value={requestBody}
              onChange={(e) => setRequestBody(e.target.value)}
              rows={4}
                className="w-full rounded-2xl border border-[var(--color-border)] bg-[var(--color-secondary)] px-3 py-2 text-sm text-[var(--color-primary)] focus:border-[var(--color-accent)] focus:outline-none"
                placeholder="Merhaba, ders planı hakkında konuşabilir miyiz?"
              />
              <div className="flex items-center justify-between gap-3">
                <span className="text-xs text-[var(--color-muted)]">{requestCount} / 400</span>
                <div className="flex gap-2">
                  <Button size="sm" variant="secondary" onClick={() => setShowModal(false)}>
                    Vazgeç
                  </Button>
                  <Button size="sm" onClick={handleRequest} disabled={!canRequest || requestSending}>
                    {requestSending ? "Gönderiliyor…" : "Gönder"}
                  </Button>
                </div>
              </div>
              {urlLike.test(requestBody) ? (
                <p className="text-xs text-[var(--color-danger)]">İlk mesajda link kullanılamaz.</p>
              ) : null}
              {error ? <p className="text-xs text-[var(--color-danger)]">{error}</p> : null}
            </div>
          </div>
        </div>
      )}
    </Card>
  );
}
