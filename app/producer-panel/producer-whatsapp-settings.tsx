"use client";

import { useMemo, useState } from "react";
import { Card } from "@/components/design-system/components/ui/card";
import { Button } from "@/components/design-system/components/ui/button";

const phoneDigits = (value: string) => value.replace(/\D/g, "");

export function ProducerWhatsAppSettings({
  initialNumber,
  initialEnabled,
}: {
  initialNumber?: string | null;
  initialEnabled?: boolean;
}) {
  const [number, setNumber] = useState(initialNumber || "");
  const [enabled, setEnabled] = useState(Boolean(initialEnabled));
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<string | null>(null);

  const valid = useMemo(() => {
    if (!enabled) return true;
    return /^(?:90)?5\d{9}$/.test(phoneDigits(number));
  }, [enabled, number]);

  const handleSave = async () => {
    if (!valid) {
      setStatus("Geçerli bir WhatsApp numarası girin.");
      return;
    }
    setSaving(true);
    setStatus(null);
    try {
      const res = await fetch("/api/producer-panel/whatsapp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          whatsappNumber: number,
          whatsappEnabled: enabled,
        }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        setStatus(json.error || "Kaydedilemedi.");
        setSaving(false);
        return;
      }
      setStatus("Ayarlar güncellendi.");
    } catch (err) {
      console.error(err);
      setStatus("Kaydedilemedi.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card className="space-y-4 p-6">
      <div>
        <p className="text-sm font-semibold text-[var(--color-primary)]">Ayarlar</p>
        <p className="text-xs text-[var(--color-muted)]">
          WhatsApp seçeneği yalnızca sen yanıt verdikten sonra görünür.
        </p>
      </div>
      <label className="flex items-center gap-2 text-sm text-[var(--color-primary)]">
        <input
          type="checkbox"
          checked={enabled}
          onChange={(e) => setEnabled(e.target.checked)}
          className="h-4 w-4 rounded border-[var(--color-border)] text-[var(--color-accent)] focus:ring-[var(--color-accent)]"
        />
        WhatsApp ile devam etmeye izin ver
      </label>
      <div className="space-y-1">
        <p className="text-sm font-medium text-[var(--color-primary)]">WhatsApp numarası</p>
        <input
          value={number}
          onChange={(e) => setNumber(e.target.value)}
          inputMode="tel"
          className="h-10 w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-secondary)] px-3 text-sm text-[var(--color-primary)] focus:border-[var(--color-accent)] focus:outline-none"
          placeholder="+90 5xx xxx xx xx"
        />
        {!valid && enabled ? (
          <p className="text-xs text-[var(--color-danger)]">Geçerli bir WhatsApp numarası girin.</p>
        ) : null}
      </div>
      <div className="flex items-center justify-between">
        <p className="text-xs text-[var(--color-muted)]">{status || " "}</p>
        <Button size="sm" onClick={handleSave} disabled={saving || !valid}>
          {saving ? "Kaydediliyor…" : "Kaydet"}
        </Button>
      </div>
    </Card>
  );
}
