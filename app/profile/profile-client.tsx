"use client";

import { useEffect, useMemo, useRef, useState, type ChangeEvent } from "react";
import Link from "next/link";
import { Section } from "@/components/design-system/components/shared/section";
import { Card } from "@/components/design-system/components/ui/card";
import { Badge } from "@/components/design-system/components/ui/badge";
import { Button } from "@/components/design-system/components/ui/button";

type ProfileProps = {
  user: {
    fullName: string;
    email: string;
    city: string;
    intent: string[];
    emailVerified: boolean;
    createdAt: Date | string | null;
    image?: string | null;
    roles: {
      teacher: "none" | "pending" | "approved";
      producer: "none" | "pending" | "approved";
      studio: "none" | "pending" | "approved";
    };
  };
};

const cityOptions = [
  "İstanbul",
  "İzmir",
  "Ankara",
  "Adana",
  "Adıyaman",
  "Afyonkarahisar",
  "Ağrı",
  "Aksaray",
  "Amasya",
  "Antalya",
  "Ardahan",
  "Artvin",
  "Aydın",
  "Balıkesir",
  "Bartın",
  "Batman",
  "Bayburt",
  "Bilecik",
  "Bingöl",
  "Bitlis",
  "Bolu",
  "Burdur",
  "Bursa",
  "Çanakkale",
  "Çankırı",
  "Çorum",
  "Denizli",
  "Diyarbakır",
  "Düzce",
  "Edirne",
  "Elazığ",
  "Erzincan",
  "Erzurum",
  "Eskişehir",
  "Gaziantep",
  "Giresun",
  "Gümüşhane",
  "Hakkâri",
  "Hatay",
  "Iğdır",
  "Isparta",
  "Kahramanmaraş",
  "Karabük",
  "Karaman",
  "Kars",
  "Kastamonu",
  "Kayseri",
  "Kırıkkale",
  "Kırklareli",
  "Kırşehir",
  "Kocaeli",
  "Konya",
  "Kütahya",
  "Malatya",
  "Manisa",
  "Mardin",
  "Mersin",
  "Muğla",
  "Muş",
  "Nevşehir",
  "Niğde",
  "Ordu",
  "Osmaniye",
  "Rize",
  "Sakarya",
  "Samsun",
  "Siirt",
  "Sinop",
  "Sivas",
  "Şanlıurfa",
  "Şırnak",
  "Tekirdağ",
  "Tokat",
  "Trabzon",
  "Tunceli",
  "Uşak",
  "Van",
  "Yalova",
  "Yozgat",
  "Zonguldak",
];

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
  const [fullName, setFullName] = useState(user.fullName);
  const [city, setCity] = useState(user.city);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [avatarUrl, setAvatarUrl] = useState(user.image || "");
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [avatarStatus, setAvatarStatus] = useState<string | null>(null);
  const [avatarLoading, setAvatarLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const previewRef = useRef<string | null>(null);
  const createdText = useMemo(() => {
    if (!user.createdAt) return "—";
    const date = typeof user.createdAt === "string" ? new Date(user.createdAt) : user.createdAt;
    if (Number.isNaN(date.getTime())) return "—";
    return date.toLocaleDateString("tr-TR", { year: "numeric", month: "short", day: "numeric" });
  }, [user.createdAt]);

  const canSave = fullName.trim().length >= 2 && city.trim().length >= 2;
  const isDirty = fullName.trim() !== user.fullName || city !== user.city;

  const handleSave = async () => {
    if (!canSave || !isDirty) return;
    setSaving(true);
    setStatus(null);
    try {
      const res = await fetch("/api/profile/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fullName: fullName.trim(), city }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        setStatus(json.error || "Kaydedilemedi");
        setSaving(false);
        return;
      }
      setStatus("Kaydedildi");
      setSaving(false);
    } catch (err) {
      console.error(err);
      setStatus("Kaydedilemedi");
      setSaving(false);
    }
  };

  const handleAvatarPick = () => {
    fileInputRef.current?.click();
  };

  const handleAvatarChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setAvatarStatus("Lütfen bir görsel dosyası seçin.");
      return;
    }
    if (previewRef.current) {
      URL.revokeObjectURL(previewRef.current);
    }
    const localPreview = URL.createObjectURL(file);
    previewRef.current = localPreview;
    setAvatarPreview(localPreview);
    setAvatarLoading(true);
    setAvatarStatus("Yükleniyor...");
    try {
      const formData = new FormData();
      formData.append("file", file);
      const uploadRes = await fetch("/api/uploads", {
        method: "POST",
        body: formData,
      });
      if (!uploadRes.ok) {
        setAvatarStatus("Görsel yüklenemedi.");
        setAvatarLoading(false);
        setAvatarPreview(null);
        return;
      }
      const uploadJson = (await uploadRes.json()) as { publicUrl?: string };
      if (!uploadJson.publicUrl) {
        setAvatarStatus("Görsel bağlantısı alınamadı.");
        setAvatarLoading(false);
        setAvatarPreview(null);
        return;
      }
      const payload: { fullName?: string; city?: string; image: string } = {
        image: uploadJson.publicUrl,
      };
      if (fullName.trim().length >= 2) payload.fullName = fullName.trim();
      if (city.trim().length >= 2) payload.city = city.trim();
      const updateRes = await fetch("/api/profile/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const updateJson = await updateRes.json().catch(() => ({}));
      if (!updateRes.ok) {
        setAvatarStatus(updateJson.error || "Profil güncellenemedi.");
        setAvatarLoading(false);
        setAvatarPreview(null);
        return;
      }
      setAvatarUrl(uploadJson.publicUrl);
      setAvatarPreview(null);
      setAvatarStatus("Fotoğraf güncellendi.");
    } catch (err) {
      console.error(err);
      setAvatarStatus("Görsel yüklenemedi.");
    } finally {
      setAvatarLoading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleAvatarRemove = async () => {
    if (!avatarUrl) return;
    setAvatarLoading(true);
    setAvatarStatus(null);
    try {
      const payload: { fullName?: string; city?: string; image: null } = {
        image: null,
      };
      if (fullName.trim().length >= 2) payload.fullName = fullName.trim();
      if (city.trim().length >= 2) payload.city = city.trim();
      const res = await fetch("/api/profile/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        setAvatarStatus(json.error || "Profil güncellenemedi.");
        setAvatarLoading(false);
        return;
      }
      setAvatarUrl("");
      setAvatarPreview(null);
      setAvatarStatus("Fotoğraf kaldırıldı.");
    } catch (err) {
      console.error(err);
      setAvatarStatus("Profil güncellenemedi.");
    } finally {
      setAvatarLoading(false);
    }
  };

  useEffect(() => {
    return () => {
      if (previewRef.current) {
        URL.revokeObjectURL(previewRef.current);
      }
    };
  }, []);

  return (
    <main className="bg-[var(--color-secondary)] pb-16 pt-10">
      <Section containerClassName="max-w-6xl space-y-8">
        <header className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--color-muted)]">
            Hesap
          </p>
          <h1 className="text-3xl font-semibold text-[var(--color-primary)]">Profilim</h1>
          <p className="text-sm text-[var(--color-muted)]">
            Bu bilgiler hesabının kimliğidir. Profilin ve rollerin aşağıda yönetilir.
          </p>
        </header>

        <div className="mx-auto w-full max-w-3xl space-y-6">
          <Card className="space-y-4 p-5">
            <div className="flex items-center justify-center">
              <div className="flex h-[84px] w-[84px] items-center justify-center overflow-hidden rounded-full border border-[var(--color-border)] bg-[var(--color-secondary)]">
                {avatarPreview || avatarUrl ? (
                  <img
                    src={avatarPreview || avatarUrl}
                    alt="Profil fotoğrafı"
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <span className="text-[10px] text-[var(--color-muted)]">Foto</span>
                )}
              </div>
            </div>
            <div className="space-y-2">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleAvatarChange}
              />
              <Button size="sm" variant="secondary" full onClick={handleAvatarPick} disabled={avatarLoading}>
                {avatarUrl ? "Fotoğrafı değiştir" : "Fotoğraf ekle"}
              </Button>
              {avatarUrl && (
                <Button size="sm" variant="ghost" full onClick={handleAvatarRemove} disabled={avatarLoading}>
                  Fotoğrafı sil
                </Button>
              )}
            </div>
            {avatarStatus && <p className="text-[11px] text-[var(--color-muted)]">{avatarStatus}</p>}
          </Card>

          <Card className="space-y-4 p-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
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
              <input
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="h-10 w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-secondary)] px-3 text-sm text-[var(--color-primary)] focus:border-[var(--color-accent)] focus:outline-none"
                placeholder="Ad Soyad"
              />
              <p className="text-xs text-[var(--color-muted)]">Bu bilgi nadiren değişir.</p>
            </div>
            <div className="space-y-1 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
              <p className="text-sm font-semibold text-[var(--color-primary)]">E-posta</p>
              <p className="text-sm text-[var(--color-primary)]">{user.email}</p>
              <p className="text-xs text-[var(--color-muted)]">Giriş ve bildirimler için kullanılır.</p>
            </div>
            <div className="space-y-2 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
              <p className="text-sm font-semibold text-[var(--color-primary)]">Şehir</p>
              <select
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="h-10 w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-secondary)] px-3 text-sm text-[var(--color-primary)] focus:border-[var(--color-accent)] focus:outline-none"
              >
                <option value="">Şehir seç</option>
                {cityOptions.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
              <p className="text-xs text-[var(--color-muted)]">Eşleşmeleri şehir bilgine göre gösteririz.</p>
            </div>
            <div className="space-y-1 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
              <p className="text-sm font-semibold text-[var(--color-primary)]">Hesap oluşturulma</p>
              <p className="text-sm text-[var(--color-primary)]">{createdText}</p>
            </div>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-xs text-[var(--color-muted)]">{status || " "}</p>
            <Button size="sm" variant="secondary" onClick={handleSave} disabled={!canSave || !isDirty || saving}>
              {saving ? "Kaydediliyor..." : "Kaydet"}
            </Button>
          </div>
          </Card>
        </div>

        <Card className="space-y-4 p-6">
          <div className="flex flex-col gap-2">
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
                  className="flex h-full flex-col justify-between space-y-3 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4"
                >
                  <div className="space-y-2">
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
      </Section>
    </main>
  );
}
