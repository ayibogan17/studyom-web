"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Card } from "@/components/design-system/components/ui/card";
import { Button } from "@/components/design-system/components/ui/button";
import { Label } from "@/components/design-system/components/ui/label";
import { Textarea } from "@/components/design-system/components/ui/textarea";

type Props = {
  producerUserId: string;
  producerName: string;
  returnUrl: string;
};

function containsUrl(value: string) {
  return /(https?:\/\/|www\.)/i.test(value);
}

export function ProducerMessageCard({ producerUserId, producerName, returnUrl }: Props) {
  const router = useRouter();
  const { status: sessionStatus } = useSession();
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const trimmed = message.trim();
  const isAuthenticated = sessionStatus === "authenticated";
  const isLoading = sessionStatus === "loading";
  const invalidLink = useMemo(() => containsUrl(message), [message]);

  const handleSend = async () => {
    if (!isAuthenticated) {
      router.push(`/signup?redirect=${encodeURIComponent(returnUrl)}`);
      return;
    }
    if (trimmed.length < 5) {
      setError("Mesaj çok kısa.");
      return;
    }
    if (trimmed.length > 300) {
      setError("Mesaj 300 karakteri geçemez.");
      return;
    }
    if (invalidLink) {
      setError("Mesajda link paylaşmayın.");
      return;
    }

    setSending(true);
    setError(null);
    setSuccess(false);
    try {
      const res = await fetch("/api/producer-message", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ producerUserId, message: trimmed }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(json.error || "Gönderilemedi");
      }
      setSuccess(true);
      setMessage("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gönderilemedi");
    } finally {
      setSending(false);
    }
  };

  if (!isAuthenticated && !isLoading) {
    return (
      <Card className="space-y-3 p-5">
        <p className="text-base font-semibold text-[var(--color-primary)]">Mesaj gönder</p>
        <p className="text-sm text-[var(--color-muted)]">
          {producerName} ile iletişim kurmak için giriş yapmalısın.
        </p>
        <Button asChild size="sm">
          <Link href={`/signup?redirect=${encodeURIComponent(returnUrl)}`}>Giriş yap</Link>
        </Button>
      </Card>
    );
  }

  return (
    <Card className="space-y-3 p-5">
      <p className="text-base font-semibold text-[var(--color-primary)]">Mesaj gönder</p>
      <p className="text-sm text-[var(--color-muted)]">
        İlk mesajda ne gibi bir hizmet almak istediğini açık bir şekilde anlatmanız önerilir. Üretici onaylarsa
        konuşma başlar.
      </p>
      <p className="text-xs text-[var(--color-muted)]">
        Bu özellik, spam’i azaltmak için ilk mesajı sınırlı tutar.
      </p>
      <div className="space-y-1">
        <Label htmlFor="producer-detail-message">Mesajın</Label>
        <Textarea
          id="producer-detail-message"
          rows={4}
          value={message}
          onChange={(e) => setMessage(e.target.value.slice(0, 300))}
          placeholder="Talebinizi yazın"
          aria-invalid={!!error || invalidLink}
        />
        <div className="flex items-center justify-between text-xs text-[var(--color-muted)]">
          <span>{message.length} / 300</span>
          {invalidLink && <span className="text-[var(--color-danger)]">Link kullanma</span>}
        </div>
        {error && <p className="text-xs text-[var(--color-danger)]">{error}</p>}
        {success && (
          <p className="text-xs text-green-600">
            Mesajın iletildi. Yanıt gelirse burada sohbet açılır.
          </p>
        )}
      </div>
      <div className="flex items-center justify-end gap-2">
        <Button size="sm" onClick={handleSend} disabled={sending || trimmed.length === 0 || invalidLink}>
          {sending ? "Gönderiliyor..." : "Mesajı gönder"}
        </Button>
      </div>
    </Card>
  );
}
