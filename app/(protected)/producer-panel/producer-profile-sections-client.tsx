"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { TeacherPanelSection } from "@/app/(protected)/teacher-panel/teacher-panel-section";
import { ProducerProfileEditor } from "./producer-profile-editor";
import { ProducerGalleryClient } from "./producer-gallery-client";
import { ProducerWhatsAppSettings } from "./producer-whatsapp-settings";
import { Button } from "@/components/design-system/components/ui/button";

type ProfilePayload = {
  profile: {
    areas: string[];
    workTypes: string[];
    modes: string[];
    city: string;
    genres: string[];
    price: string;
    years: string;
    projects: string;
    statement: string;
    bio: string;
  };
  links: string[];
  galleryUrls: string[];
  whatsapp: { number: string; enabled: boolean };
};

export function ProducerProfileSectionsClient() {
  const [loading, setLoading] = useState(true);
  const [payload, setPayload] = useState<ProfilePayload>({
    profile: {
      areas: [],
      workTypes: [],
      modes: [],
      city: "",
      genres: [],
      price: "",
      years: "",
      projects: "",
      statement: "",
      bio: "",
    },
    links: [],
    galleryUrls: [],
    whatsapp: { number: "", enabled: false },
  });

  useEffect(() => {
    let alive = true;
    const load = async () => {
      try {
        const res = await fetch("/api/producer-panel/profile");
        if (!res.ok) return;
        const json = (await res.json()) as ProfilePayload;
        if (alive) setPayload(json);
      } finally {
        if (alive) setLoading(false);
      }
    };
    load();
    return () => {
      alive = false;
    };
  }, []);

  const links = useMemo(() => payload.links || [], [payload.links]);

  return (
    <>
      <TeacherPanelSection title="Üretim bilgileri" defaultOpen>
        <ProducerProfileEditor
          initial={{
            areas: payload.profile.areas,
            workTypes: payload.profile.workTypes,
            modes: payload.profile.modes,
            city: payload.profile.city,
            genres: payload.profile.genres,
            price: payload.profile.price,
            years: payload.profile.years,
            projects: payload.profile.projects,
            statement: payload.profile.statement,
            bio: payload.profile.bio,
          }}
        />
      </TeacherPanelSection>

      <TeacherPanelSection
        title="WhatsApp ayarları"
        description="Kullanıcılarla WhatsApp üzerinden devam etmeyi burada açıp kapatabilirsin."
      >
        <ProducerWhatsAppSettings
          initialNumber={payload.whatsapp.number}
          initialEnabled={payload.whatsapp.enabled}
        />
      </TeacherPanelSection>

      <TeacherPanelSection title="Görseller" defaultOpen>
        <ProducerGalleryClient initialUrls={payload.galleryUrls} />
      </TeacherPanelSection>

      <TeacherPanelSection title="Bağlantılar" defaultOpen>
        <div className="flex items-center justify-between gap-2">
          <Button asChild size="sm" variant="secondary">
            <Link href="/profile">Profilime dön</Link>
          </Button>
        </div>
        {links.length ? (
          <div className="space-y-2">
            {links.map((link) => (
              <a
                key={link}
                href={link}
                target="_blank"
                rel="noreferrer"
                className="block rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-sm text-[var(--color-primary)] hover:border-[var(--color-accent)]"
              >
                {link}
              </a>
            ))}
          </div>
        ) : (
          <p className="text-sm text-[var(--color-muted)]">{loading ? "Yükleniyor…" : "Belirtilmedi"}</p>
        )}
      </TeacherPanelSection>
    </>
  );
}
