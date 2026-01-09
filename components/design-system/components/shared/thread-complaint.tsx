"use client";

import { useEffect, useMemo, useState } from "react";
import { Flag } from "lucide-react";
import { Button } from "@/components/design-system/components/ui/button";
import { cn } from "@/components/design-system/lib/cn";

type ThreadComplaintProps = {
  threadType: "studio" | "teacher" | "producer";
  threadId?: string | null;
  label?: string;
  className?: string;
};

export function ThreadComplaint({
  threadType,
  threadId,
  label = "Şikayet et",
  className,
}: ThreadComplaintProps) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const reasonCount = reason.trim().length;
  const canSend = useMemo(() => reasonCount >= 5 && reasonCount <= 400, [reasonCount]);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open]);

  if (!threadId) return null;

  const handleSubmit = async () => {
    if (!canSend || sending) return;
    setSending(true);
    setError(null);
    try {
      const res = await fetch("/api/messages/complaint", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          threadType,
          threadId,
          reason: reason.trim(),
        }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(json.error || "Şikayet gönderilemedi.");
        return;
      }
      setSuccess(true);
      setReason("");
    } catch {
      setError("Şikayet gönderilemedi.");
    } finally {
      setSending(false);
    }
  };

  return (
    <>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className={cn(
          "text-[var(--color-danger)] hover:text-[var(--color-danger)] hover:bg-[var(--color-danger)]/10",
          className,
        )}
        onClick={(event) => {
          event.stopPropagation();
          setOpen(true);
          setSuccess(false);
          setError(null);
        }}
      >
        <Flag className="h-4 w-4" />
        {label}
      </Button>

      {open ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div
            className="w-full max-w-md space-y-3 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5 shadow-xl"
            onClick={(event) => event.stopPropagation()}
            role="dialog"
            aria-modal="true"
          >
            <div className="space-y-1">
              <p className="text-base font-semibold text-[var(--color-primary)]">Şikayet et</p>
              <p className="text-xs text-[var(--color-muted)]">
                Kısaca sebebi yaz; ekip inceleyecek.
              </p>
            </div>

            {success ? (
              <div className="space-y-2">
                <p className="text-sm text-[var(--color-success)]">Şikayetin iletildi.</p>
                <div className="flex justify-end">
                  <Button
                    type="button"
                    size="sm"
                    variant="secondary"
                    onClick={() => setOpen(false)}
                  >
                    Kapat
                  </Button>
                </div>
              </div>
            ) : (
              <>
                <textarea
                  value={reason}
                  onChange={(event) => setReason(event.target.value)}
                  rows={4}
                  className="w-full rounded-2xl border border-[var(--color-border)] bg-[var(--color-secondary)] px-3 py-2 text-sm text-[var(--color-primary)] focus:border-[var(--color-accent)] focus:outline-none"
                  placeholder="Örn: Uygunsuz içerik."
                />
                <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-[var(--color-muted)]">
                  <span>{reasonCount} / 400</span>
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      size="sm"
                      variant="secondary"
                      onClick={() => setOpen(false)}
                    >
                      Vazgeç
                    </Button>
                    <Button type="button" size="sm" onClick={handleSubmit} disabled={!canSend || sending}>
                      {sending ? "Gönderiliyor…" : "Şikayet et"}
                    </Button>
                  </div>
                </div>
                {error ? <p className="text-xs text-[var(--color-danger)]">{error}</p> : null}
              </>
            )}
          </div>
        </div>
      ) : null}
    </>
  );
}
