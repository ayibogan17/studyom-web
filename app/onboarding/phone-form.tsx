"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/design-system/components/ui/button";

const phoneDigits = (value: string) => value.replace(/\D/g, "");

export function PhoneForm({ initialPhone = "" }: { initialPhone?: string }) {
  const [phone, setPhone] = useState(initialPhone);
  const [status, setStatus] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const phoneValid = /^(?:90)?5\d{9}$/.test(phoneDigits(phone));

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setStatus(null);
    if (!phoneValid) {
      setStatus("Geçerli bir telefon girin.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/profile/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        setStatus(json.error || "Kaydedilemedi.");
        setLoading(false);
        return;
      }
      router.push("/profile");
    } catch (err) {
      console.error(err);
      setStatus("Kaydedilemedi.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form className="space-y-4" onSubmit={handleSubmit}>
      <label className="block text-sm font-medium text-[var(--color-primary)]">
        Telefon numarası
        <input
          type="tel"
          autoComplete="tel"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          className="mt-2 h-11 w-full rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] px-3 text-sm text-[var(--color-primary)] focus:border-[var(--color-accent)] focus:outline-none"
          placeholder="+90 5xx xxx xx xx"
        />
      </label>
      {status ? <p className="text-xs text-[var(--color-danger)]">{status}</p> : null}
      <Button type="submit" className="w-full" disabled={!phoneValid || loading}>
        {loading ? <Loader2 size={16} className="animate-spin" /> : null}
        Kaydet ve devam et
      </Button>
    </form>
  );
}
