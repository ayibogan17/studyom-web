"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Section } from "@/components/design-system/components/shared/section";
import { Card } from "@/components/design-system/components/ui/card";
import { Button } from "@/components/design-system/components/ui/button";

export function VerifyClient() {
  const params = useSearchParams();
  const [status, setStatus] = useState<"idle" | "ok" | "error">("idle");
  const [message, setMessage] = useState<string>("Doğrulama yapılıyor...");

  const token = params.get("token");
  const email = params.get("email");

  useEffect(() => {
    const run = async () => {
      if (!token || !email) {
        setStatus("error");
        setMessage("Geçersiz bağlantı.");
        return;
      }
      try {
        const res = await fetch(`/api/auth/verify?token=${token}&email=${encodeURIComponent(email)}`);
        const json = await res.json().catch(() => ({}));
        if (!res.ok) {
          setStatus("error");
          setMessage(json.error || "Doğrulama başarısız.");
          return;
        }
        setStatus("ok");
        setMessage("E-posta doğrulandı. Artık giriş yapabilirsiniz.");
      } catch (err) {
        console.error(err);
        setStatus("error");
        setMessage("Doğrulama başarısız.");
      }
    };
    run();
  }, [token, email]);

  return (
    <main className="bg-[var(--color-secondary)]">
      <Section containerClassName="max-w-3xl">
        <Card className="space-y-3 p-6" data-state={status}>
          <h1 className="text-2xl font-semibold text-[var(--color-primary)]">E-posta doğrulama</h1>
          <p
            className="text-sm text-[var(--color-muted)]"
            data-state={status}
            aria-live="polite"
          >
            {message}
          </p>
          <div className="flex gap-3">
            <Button asChild size="sm" variant="primary">
              <Link href="/login">Giriş yap</Link>
            </Button>
            <Button asChild size="sm" variant="secondary">
              <Link href="/signup">Üye ol</Link>
            </Button>
          </div>
        </Card>
      </Section>
    </main>
  );
}
