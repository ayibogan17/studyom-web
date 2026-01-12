"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Button } from "@/components/design-system/components/ui/button";
import { Card } from "@/components/design-system/components/ui/card";
import { Badge } from "@/components/design-system/components/ui/badge";
import { Input } from "@/components/design-system/components/ui/input";
import { Section } from "@/components/design-system/components/shared/section";

type JamDetail = {
  id: string;
  title: string;
  note: string | null;
  genre: string | null;
  playlistLink: string | null;
  creatorLevel: string | null;
  createdByUserId: string;
  startAt: Date | string;
  durationMinutes: number;
  neededInstruments: string[];
  capacity: number;
  studio: { name: string; city: string | null; district: string | null; address: string | null };
  participants: Array<{
    id: string;
    instrument: string | null;
    level: string | null;
    status: string;
    user: { id: string; name: string | null; fullName: string | null; image: string | null };
  }>;
};

type MessageItem = {
  id: string;
  message: string;
  createdAt: string;
  user: { id: string; name: string | null; fullName: string | null; image: string | null };
};

export default function OpenJamDetailClient({ jam }: { jam: JamDetail }) {
  const router = useRouter();
  const { data: session } = useSession();
  const [joining, setJoining] = useState(false);
  const [joinError, setJoinError] = useState<string | null>(null);
  const [joinOpen, setJoinOpen] = useState(false);
  const [joinInstrument, setJoinInstrument] = useState("");
  const [joinLevel, setJoinLevel] = useState("");
  const [participants, setParticipants] = useState(jam.participants);
  const [messages, setMessages] = useState<MessageItem[]>([]);
  const [messageText, setMessageText] = useState("");
  const [sending, setSending] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [leaving, setLeaving] = useState(false);

  const location = jam.studio.district || jam.studio.city || "";
  const level = jam.creatorLevel ?? "";
  const modeText = jam.genre || jam.playlistLink || "";
  const info = jam.note?.trim() || "";
  const embedUrl = (() => {
    const url = jam.playlistLink?.trim();
    if (!url) return null;
    if (url.includes("open.spotify.com")) {
      const spotifyEmbed = url.replace("open.spotify.com", "open.spotify.com/embed");
      try {
        const parsed = new URL(spotifyEmbed);
        parsed.searchParams.set("theme", "0");
        return parsed.toString();
      } catch {
        return `${spotifyEmbed}${spotifyEmbed.includes("?") ? "&" : "?"}theme=0`;
      }
    }
    if (url.includes("music.apple.com")) {
      return `${url}${url.includes("?") ? "&" : "?"}app=music`;
    }
    if (url.includes("youtube.com") || url.includes("youtu.be")) {
      try {
        const parsed = new URL(url);
        const videoId = parsed.searchParams.get("v");
        if (videoId) return `https://www.youtube.com/embed/${videoId}`;
        if (parsed.hostname === "youtu.be") {
          const id = parsed.pathname.split("/").filter(Boolean)[0];
          return id ? `https://www.youtube.com/embed/${id}` : url;
        }
      } catch {
        return null;
      }
    }
    return null;
  })();
  const isSpotify = Boolean(jam.playlistLink?.includes("spotify"));

  useEffect(() => {
    let active = true;
    fetch(`/api/openjam/jams/${jam.id}/messages`)
      .then((res) => res.json())
      .then((json) => {
        if (!active) return;
        setMessages(Array.isArray(json.messages) ? json.messages : []);
      })
      .catch(() => {
        if (!active) return;
        setMessages([]);
      });
    return () => {
      active = false;
    };
  }, [jam.id]);

  const handleJoin = async () => {
    if (!session) {
      router.push("/login?redirect=/openjam/cmka8x3a30001i8monyk3ivuz");
      return;
    }
    setJoinOpen(true);
  };

  const submitJoin = async () => {
    if (!joinInstrument) {
      setJoinError("Enstrüman seçmelisin.");
      return;
    }
    setJoinError(null);
    setJoining(true);
    try {
      const res = await fetch(`/api/openjam/jams/${jam.id}/join`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          instrument: joinInstrument,
          level: joinLevel || null,
        }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.error || "Katılım isteği gönderilemedi.");
      router.refresh();
      setJoinOpen(false);
    } catch (err) {
      setJoinError(err instanceof Error ? err.message : "Katılım isteği gönderilemedi.");
    } finally {
      setJoining(false);
    }
  };

  const leaveJam = async () => {
    if (!confirm("Jam'den ayrılmak istiyor musun?")) return;
    if (!session?.user) {
      router.push(`/login?redirect=/openjam/${jam.id}`);
      return;
    }
    const userId = (session.user as { id?: string }).id;
    if (!userId) return;
    const previous = participants;
    setLeaving(true);
    setJoinError(null);
    setParticipants((prev) => prev.filter((participant) => participant.user.id !== userId));
    try {
      await fetch(`/api/openjam/jams/${jam.id}/leave`, { method: "POST" });
      router.refresh();
    } catch (err) {
      console.error(err);
      setParticipants(previous);
      setJoinError("Ayrılma işlemi başarısız oldu.");
    } finally {
      setLeaving(false);
    }
  };

  const removeParticipant = async (participantId: string) => {
    if (!confirm("Katılımcı jam'den çıkarılsın mı?")) return;
    try {
      await fetch(`/api/openjam/jams/${jam.id}/participants/${participantId}`, { method: "DELETE" });
      router.refresh();
    } catch (err) {
      console.error(err);
    }
  };

  const sendMessage = async () => {
    if (!session) {
      router.push(`/login?redirect=/openjam/${jam.id}`);
      return;
    }
    if (!messageText.trim()) return;
    setSending(true);
    try {
      const res = await fetch(`/api/openjam/jams/${jam.id}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: messageText.trim() }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok || !json.message) throw new Error(json.error || "Mesaj gönderilemedi.");
      setMessages((prev) => [...prev, json.message]);
      setMessageText("");
    } catch (err) {
      console.error(err);
    } finally {
      setSending(false);
    }
  };

  const deleteJam = async () => {
    if (!confirm("Jam silinsin mi?")) return;
    setDeleting(true);
    setDeleteError(null);
    try {
      const res = await fetch(`/api/openjam/jams/${jam.id}`, { method: "DELETE" });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.error || "Jam silinemedi.");
      router.push("/openjam");
    } catch (err) {
      setDeleteError(err instanceof Error ? err.message : "Jam silinemedi.");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <Section>
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-6 py-10">
        <Card className="space-y-4 p-6">
          <div className="space-y-1">
            <p className="text-xs uppercase tracking-[0.3em] text-[var(--color-muted)]">OpenJam</p>
            <h1 className="text-2xl font-semibold text-[var(--color-primary)] md:text-3xl">{jam.title}</h1>
            <p className="text-sm text-[var(--color-muted)]">
              {jam.studio.name} · {location}
            </p>
          </div>
          <p className="text-sm text-[var(--color-primary)]">
            {jam.genre ? (
              <>
                Takılmaç: {modeText}
              </>
            ) : jam.playlistLink ? (
              <>
                Playlist:{" "}
                <a
                  href={modeText}
                  target="_blank"
                  rel="noreferrer"
                  className="underline hover:text-[var(--color-accent)]"
                >
                  {modeText}
                </a>
              </>
            ) : (
              "Playlist: -"
            )}
          </p>
          <p className="text-sm text-[var(--color-primary)]">
            Seviyesi: {level || "-"}
          </p>
          <p className="text-sm text-[var(--color-primary)] whitespace-pre-line">
            Bilgi: {info || "-"}
          </p>
          <div className="flex flex-wrap gap-2">
            {jam.neededInstruments.map((item) => (
              <Badge key={item} variant="muted">
                {item}
              </Badge>
            ))}
          </div>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm font-semibold text-[var(--color-primary)]">
              {participants.length}/{jam.capacity} katılımcı
            </p>
            {!participants.some((p) => p.user.id === (session?.user as { id?: string } | undefined)?.id) ? (
              <Button
                onClick={handleJoin}
                disabled={joining}
                className="border-0 bg-gradient-to-r from-fuchsia-500 via-purple-500 to-indigo-500 text-white hover:from-fuchsia-400 hover:via-purple-400 hover:to-indigo-400"
              >
                {joining ? "Gönderiliyor..." : "Katılmak istiyorum"}
              </Button>
            ) : null}
          </div>
          {session?.user && participants.some((p) => p.user.id === (session.user as { id?: string }).id) ? (
            <Button
              type="button"
              variant="secondary"
              onClick={leaveJam}
              className="border-0 bg-gradient-to-r from-purple-500 via-indigo-500 to-blue-500 text-white hover:from-purple-400 hover:via-indigo-400 hover:to-blue-400"
              disabled={leaving}
            >
              {leaving ? "Ayrılıyor..." : "Jam'den Ayrıl"}
            </Button>
          ) : null}
        </Card>

        <Card className="space-y-4 p-6">
          <h2 className="text-lg font-semibold text-[var(--color-primary)]">Katılımcılar</h2>
          <div className="grid gap-3 md:grid-cols-2">
            {participants.map((participant) => {
              const name =
                participant.user.fullName || participant.user.name || "Kullanıcı";
              return (
                <div
                  key={participant.id}
                  className="flex items-center gap-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-secondary)] px-3 py-2 text-sm"
                >
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[var(--color-surface)] text-xs font-semibold text-[var(--color-primary)]">
                    {participant.user.image ? (
                      <img src={participant.user.image} alt={name} className="h-9 w-9 rounded-full object-cover" />
                    ) : (
                      name.split(" ").map((part) => part[0]).join("").slice(0, 2).toUpperCase()
                    )}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-[var(--color-primary)]">{name}</p>
                    <p className="text-xs text-[var(--color-muted)]">
                      {participant.instrument || "-"}
                      {participant.level ? ` · ${participant.level}` : ""}
                    </p>
                  </div>
                  {session?.user &&
                  jam.createdByUserId === (session.user as { id?: string }).id ? (
                    <button
                      type="button"
                      onClick={() => removeParticipant(participant.id)}
                      className="text-xs font-semibold text-red-500 hover:text-red-600"
                    >
                      Çıkar
                    </button>
                  ) : null}
                </div>
              );
            })}
          </div>
        </Card>

        <Card className="space-y-4 p-6">
          <div className="space-y-1">
            <h2 className="text-lg font-semibold text-[var(--color-primary)]">Jam sohbeti</h2>
            <p className="text-xs text-[var(--color-muted)]">
              Numaralaşın, grup kurun, ya da buradan anlaşın, tercih sizin.
            </p>
          </div>
          <div className="max-h-64 space-y-3 overflow-y-auto rounded-xl border border-[var(--color-border)] bg-[var(--color-secondary)] p-4 text-sm">
            {messages.length === 0 ? (
              <p className="text-sm text-[var(--color-muted)]">Henüz mesaj yok.</p>
            ) : (
              messages.map((msg) => {
                const name = msg.user.fullName || msg.user.name || "Kullanıcı";
                const initial = name.slice(0, 1).toUpperCase();
                return (
                  <div key={msg.id} className="flex gap-3">
                    {msg.user.image ? (
                      <img
                        src={msg.user.image}
                        alt={name}
                        className="h-8 w-8 rounded-full object-cover"
                      />
                    ) : (
                      <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--color-surface)] text-xs font-semibold text-[var(--color-primary)]">
                        {initial}
                      </span>
                    )}
                    <div className="space-y-1">
                      <p className="text-xs text-[var(--color-muted)]">{name}</p>
                      <div className="inline-block rounded-xl bg-[var(--color-surface)] px-3 py-2 text-sm text-[var(--color-primary)]">
                        {msg.message}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
          <div className="flex flex-col gap-2 md:flex-row">
            <Input
              value={messageText}
              onChange={(e) => setMessageText(e.target.value)}
              placeholder="Mesaj yaz..."
            />
            <Button
              type="button"
              onClick={sendMessage}
              disabled={sending}
              className="border-0 bg-gradient-to-r from-fuchsia-500 via-purple-500 to-indigo-500 text-white hover:from-fuchsia-400 hover:via-purple-400 hover:to-indigo-400"
            >
              {sending ? "Gönderiliyor..." : "Gönder"}
            </Button>
          </div>
        </Card>

        {session?.user &&
        (session.user as { id?: string }).id &&
        jam.createdByUserId === (session.user as { id?: string }).id ? (
          <div className="flex flex-col items-end gap-2">
            <Button
              type="button"
              variant="secondary"
              onClick={deleteJam}
              disabled={deleting}
              className="border-0 bg-gradient-to-r from-fuchsia-500 via-purple-500 to-indigo-500 text-white hover:from-fuchsia-400 hover:via-purple-400 hover:to-indigo-400"
            >
              {deleting ? "Siliniyor..." : "Jam'i sil"}
            </Button>
            {deleteError ? <p className="text-sm text-[var(--color-danger)]">{deleteError}</p> : null}
          </div>
        ) : null}

        {joinOpen ? (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
            <Card className="w-full max-w-md space-y-4 p-6">
              <h3 className="text-lg font-semibold text-[var(--color-primary)]">Katıl</h3>
              <div className="space-y-2">
                <label className="text-xs font-semibold text-[var(--color-muted)]">Hangi rolde</label>
                {(() => {
                  const filled = new Set(
                    participants
                      .map((participant) => participant.instrument)
                      .filter((item): item is string => Boolean(item)),
                  );
                  const openRoles = jam.neededInstruments.filter((item) => !filled.has(item));
                  return (
                    <select
                      value={joinInstrument}
                      onChange={(e) => setJoinInstrument(e.target.value)}
                      className="h-11 w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-3 text-sm text-[var(--color-primary)]"
                    >
                      <option value="">Seç</option>
                      {openRoles.map((item) => (
                        <option key={item} value={item}>
                          {item}
                        </option>
                      ))}
                    </select>
                  );
                })()}
              </div>
              <div className="space-y-2">
                <label className="text-xs font-semibold text-[var(--color-muted)]">Seviyen</label>
                <select
                  value={joinLevel}
                  onChange={(e) => setJoinLevel(e.target.value)}
                  className="h-11 w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-3 text-sm text-[var(--color-primary)]"
                >
                  <option value="">Seç</option>
                  <option value="enstrümanı tutmayı biliyorum">enstrümanı tutmayı biliyorum</option>
                  <option value="takılacak kadar biliyorum">takılacak kadar biliyorum</option>
                  <option value="iyiyim ya bence">iyiyim ya bence</option>
                  <option value="öttürürüm">öttürürüm</option>
                </select>
              </div>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="secondary" onClick={() => setJoinOpen(false)}>
                  Vazgeç
                </Button>
                <Button
                  type="button"
                  onClick={submitJoin}
                  disabled={joining}
                  className="border-0 bg-gradient-to-r from-fuchsia-500 via-purple-500 to-indigo-500 text-white hover:from-fuchsia-400 hover:via-purple-400 hover:to-indigo-400"
                >
                  {joining ? "Gönderiliyor..." : "Katıl"}
                </Button>
              </div>
            </Card>
          </div>
        ) : null}
      </div>
    </Section>
  );
}
