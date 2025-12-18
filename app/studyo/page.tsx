import type { Metadata } from "next";
import { Suspense } from "react";
import { StudyoClientPage } from "./studyo-client";

export const metadata: Metadata = {
  title: "Stüdyo Bul | Studyom",
  description: "Şehrindeki prova ve kayıt stüdyolarını filtrele ve keşfet.",
};

export default function StudioListPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[var(--color-secondary)]" />}>
      <StudyoClientPage />
    </Suspense>
  );
}

