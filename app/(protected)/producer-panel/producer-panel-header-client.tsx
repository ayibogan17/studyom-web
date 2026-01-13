"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/design-system/components/ui/badge";
import { TeacherPanelSection } from "@/app/(protected)/teacher-panel/teacher-panel-section";

type BootstrapPayload = {
  user: { fullName: string | null; name: string | null; email: string | null; image: string | null };
  application: { status: "approved" | "pending"; createdAt: string } | null;
};

function formatDate(value?: string | null) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString("tr-TR", { year: "numeric", month: "long", day: "numeric" });
}

export function ProducerPanelHeaderClient({ showApplication = false }: { showApplication?: boolean }) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [payload, setPayload] = useState<BootstrapPayload>({
    user: { fullName: null, name: null, email: null, image: null },
    application: null,
  });

  useEffect(() => {
    let alive = true;
    const load = async () => {
      try {
        const res = await fetch("/api/producer-panel/bootstrap");
        if (res.status === 401) {
          router.push("/login");
          return;
        }
        const json = (await res.json()) as BootstrapPayload;
        if (alive) {
          setPayload(json);
          if (!json.application) {
            router.push("/profile");
          }
        }
      } finally {
        if (alive) setLoading(false);
      }
    };
    load();
    return () => {
      alive = false;
    };
  }, [router]);

  const isApproved = payload.application?.status === "approved";
  const introText = useMemo(() => {
    if (loading) return "Bilgiler yükleniyor...";
    return isApproved
      ? "Onaylanan başvurunda paylaştığın bilgiler aşağıdadır. Güncellemeler için destek ekibimizle iletişime geçebilirsin."
      : "Başvurun incelemede. Paylaştığın bilgiler aşağıdadır; değişiklik için destek ekibine yazabilirsin.";
  }, [loading, isApproved]);

  const displayName = payload.user.fullName || payload.user.name || "—";
  const email = payload.user.email || "—";

  if (showApplication) {
    return (
      <TeacherPanelSection title="Başvuru bilgileri" defaultOpen>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-[var(--color-primary)]">Başvuru durumu</p>
            <p className="text-xs text-[var(--color-muted)]">
              Onay tarihi: {formatDate(payload.application?.createdAt)}
            </p>
          </div>
          <div className="flex items-center gap-3">
            {payload.user.image ? (
              <div className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-full border border-[var(--color-border)] bg-[var(--color-secondary)]">
                <img src={payload.user.image} alt="Profil fotoğrafı" className="h-full w-full object-cover" />
              </div>
            ) : null}
            <Badge variant={isApproved ? "default" : "muted"}>
              {isApproved ? "Onaylandı" : "İncelemede"}
            </Badge>
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
            <p className="text-sm font-semibold text-[var(--color-primary)]">Ad Soyad</p>
            <p className="text-sm text-[var(--color-primary)]">{displayName}</p>
          </div>
          <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
            <p className="text-sm font-semibold text-[var(--color-primary)]">E-posta</p>
            <p className="text-sm text-[var(--color-primary)]">{email}</p>
          </div>
        </div>
      </TeacherPanelSection>
    );
  }

  return (
    <header className="space-y-2">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--color-muted)]">Panel</p>
      <h1 className="text-3xl font-semibold text-[var(--color-primary)]">Üretici Paneli</h1>
      <p className="text-sm text-[var(--color-muted)]">{introText}</p>
    </header>
  );
}
