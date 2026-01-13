"use client";

import { useEffect, useState } from "react";
import { TeacherPanelSection } from "@/app/(protected)/teacher-panel/teacher-panel-section";
import { ProducerStudioLinksClient } from "./producer-studio-links-client";

type StudioLinkItem = {
  id: string;
  status: "pending" | "approved" | "rejected";
  createdAt: string;
  studio: { id: string; name: string; city: string | null; district: string | null };
};

export function ProducerStudioLinksSection() {
  const [loading, setLoading] = useState(true);
  const [links, setLinks] = useState<StudioLinkItem[]>([]);

  useEffect(() => {
    let alive = true;
    const load = async () => {
      try {
        const res = await fetch("/api/producer-panel/studio-links");
        if (!res.ok) return;
        const json = (await res.json()) as { links?: StudioLinkItem[] };
        if (alive) {
          setLinks(json.links ?? []);
        }
      } finally {
        if (alive) setLoading(false);
      }
    };
    load();
    return () => {
      alive = false;
    };
  }, []);

  return (
    <TeacherPanelSection
      title="Stüdyo bağlantıları"
      description="Birlikte çalıştığın stüdyolarla bağlantılarını buradan yönetebilirsin."
    >
      {links.length ? (
        <ProducerStudioLinksClient initialLinks={links} />
      ) : (
        <p className="text-xs text-[var(--color-muted)]">{loading ? "Yükleniyor…" : "Bağlantı bulunamadı."}</p>
      )}
    </TeacherPanelSection>
  );
}
