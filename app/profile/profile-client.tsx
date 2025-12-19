"use client";

import { useMemo } from "react";
import Link from "next/link";
import { Section } from "@/components/design-system/components/shared/section";
import { Card } from "@/components/design-system/components/ui/card";
import { Badge } from "@/components/design-system/components/ui/badge";
import { Button } from "@/components/design-system/components/ui/button";
import { signOut } from "next-auth/react";
import { useState } from "react";

type ProfileProps = {
  user: {
    fullName: string;
    email: string;
    city: string;
    intent: string[];
    emailVerified: boolean;
    createdAt: Date | string | null;
    roles: {
      teacher: "none" | "pending" | "approved";
      producer: "none" | "pending" | "approved";
      studio: "none" | "pending" | "approved";
    };
  };
};

const roleMeta: Record<
  "teacher" | "producer" | "studio",
  { title: string; applyHref: string; description: string; panelHref?: string }
> = {
  teacher: {
    title: "Hoca",
    applyHref: "/apply/teacher",
    panelHref: "/teacher-panel",
    description: "Bu rol başvuru ve onay gerektirir.",
  },
  producer: {
    title: "Üretici",
    applyHref: "/apply/producer",
    panelHref: "/producer-panel",
    description: "Bu rol başvuru ve onay gerektirir.",
  },
  studio: {
    title: "Stüdyo Sahibi",
    applyHref: "/studio/new",
    panelHref: "/studio-panel",
    description: "Bu rol başvuru ve onay gerektirir.",
  },
};

export function ProfileClient({ user }: ProfileProps) {
  const [deleting, setDeleting] = useState(false);
  const createdText = useMemo(() => {
    if (!user.createdAt) return "—";
    const date = typeof user.createdAt === "string" ? new Date(user.createdAt) : user.createdAt;
    if (Number.isNaN(date.getTime())) return "—";
    return date.toLocaleDateString("tr-TR", { year: "numeric", month: "short", day: "numeric" });
  }, [user.createdAt]);

  const handleDelete = async () => {
    const ok = window.confirm("Profili silmek istediğine emin misin? Bu işlem geri alınamaz.");
    if (!ok) return;
    setDeleting(true);
    try {
      const res = await fetch("/api/profile/delete", { method: "POST" });
      if (!res.ok) {
        alert("Profil silinemedi. Daha sonra tekrar deneyin.");
        setDeleting(false);
        return;
      }
      await signOut({ callbackUrl: "/signup" });
    } catch (err) {
      console.error(err);
      alert("Profil silinemedi. Daha sonra tekrar deneyin.");
      setDeleting(false);
    }
  };

  return (
    <main className="bg-[var(--color-secondary)] pb-16 pt-10">
      <Section containerClassName="max-w-5xl space-y-6">
        <header className="space-y-1">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--color-muted)]">
            Hesap
          </p>
          <h1 className="text-3xl font-semibold text-[var(--color-primary)]">Profilim</h1>
          <p className="text-sm text-[var(--color-muted)]">
            Bu bilgiler hesabının kimliğidir. Profilin ve rollerin aşağıda yönetilir.
          </p>
        </header>

        <Card className="space-y-4 p-6">
          <div className="flex items-center justify-between gap-3">
            <div className="flex-1">
              <p className="text-sm font-semibold text-[var(--color-primary)]">Hesap kimliği</p>
              <p className="text-xs text-[var(--color-muted)]">
                Bu sayfa CV değildir. Üretici / Hoca / Stüdyo profilleri ayrı alanlarda yönetilir.
              </p>
            </div>
            <Badge variant={user.emailVerified ? "default" : "outline"}>
              {user.emailVerified ? "E-posta doğrulandı" : "Doğrulama bekleniyor"}
            </Badge>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
              <p className="text-sm font-semibold text-[var(--color-primary)]">Ad Soyad</p>
              <p className="text-sm text-[var(--color-primary)]">{user.fullName}</p>
              <p className="text-xs text-[var(--color-muted)]">İleride profil ayarlarından değiştirilebilir.</p>
            </div>
            <div className="space-y-1 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
              <p className="text-sm font-semibold text-[var(--color-primary)]">E-posta</p>
              <p className="text-sm text-[var(--color-primary)]">{user.email}</p>
              <p className="text-xs text-[var(--color-muted)]">Giriş ve bildirimler için kullanılır.</p>
            </div>
            <div className="space-y-2 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
              <p className="text-sm font-semibold text-[var(--color-primary)]">Şehir</p>
              <p className="text-sm text-[var(--color-primary)]">{user.city || "Belirtilmedi"}</p>
              <p className="text-xs text-[var(--color-muted)]">Yakında burada güncellenebilecek.</p>
            </div>
            <div className="space-y-1 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
              <p className="text-sm font-semibold text-[var(--color-primary)]">Hesap oluşturulma</p>
              <p className="text-sm text-[var(--color-primary)]">{createdText}</p>
            </div>
          </div>
        </Card>

        <Card className="space-y-4 p-6">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-[var(--color-primary)]">Roller ve Yetkiler</p>
              <p className="text-xs text-[var(--color-muted)]">
                Roller otomatik verilmez. Başvurup onaylanarak aktif olur.
              </p>
            </div>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            {(Object.keys(roleMeta) as Array<keyof typeof roleMeta>).map((key) => {
              const status = user.roles[key];
              const meta = roleMeta[key];
              const statusLabel =
                status === "approved" ? "Aktif" : status === "pending" ? "Beklemede" : "Başvurulmadı";
              const statusVariant =
                status === "approved" ? "default" : status === "pending" ? "muted" : "outline";
              return (
                <div
                  key={key}
                  className="space-y-3 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4"
                >
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-semibold text-[var(--color-primary)]">{meta.title}</p>
                    <Badge variant={statusVariant}>{statusLabel}</Badge>
                  </div>
                  <p className="text-xs text-[var(--color-muted)]">
                    {status === "approved" ? "Rol aktif. Detayları ayrı sayfadan düzenleyin." : meta.description}
                  </p>
                  <div className="space-y-2">
                    {status !== "approved" && (
                      <Button asChild size="sm" className="w-full">
                        <Link href={meta.applyHref}>{meta.title} olmak için başvur</Link>
                      </Button>
                    )}
                    {status === "approved" && (
                      <Button asChild size="sm" variant="secondary" className="w-full">
                        <Link href={meta.panelHref || meta.applyHref}>Rol detaylarını düzenle</Link>
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </Card>

        <Card className="flex items-center justify-between gap-3 p-5">
          <div>
            <p className="text-sm font-semibold text-[var(--color-primary)]">Hesaptan çıkış yap</p>
            <p className="text-xs text-[var(--color-muted)]">Oturumu kapatır ve giriş sayfasına döner.</p>
          </div>
          <Button variant="secondary" onClick={() => signOut({ callbackUrl: "/login" })}>
            Çıkış Yap
          </Button>
        </Card>

        <Card className="flex items-center justify-between gap-3 border-[var(--color-danger)]/40 p-5">
          <div>
            <p className="text-sm font-semibold text-[var(--color-primary)]">Profili sil</p>
            <p className="text-xs text-[var(--color-muted)]">Tüm verileriniz silinir ve oturum kapanır.</p>
          </div>
          <Button
            variant="secondary"
            disabled={deleting}
            onClick={handleDelete}
            className="bg-[var(--color-danger)] text-white hover:brightness-105"
          >
            {deleting ? "Siliniyor..." : "Profili Sil"}
          </Button>
        </Card>
      </Section>
    </main>
  );
}
