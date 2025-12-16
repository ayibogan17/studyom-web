import type { Metadata } from "next";
import { Section } from "@/components/design-system/components/shared/section";
import { Card } from "@/components/design-system/components/ui/card";

export const metadata: Metadata = {
  title: "Stüdyo Ekle | Studyom",
  description: "Yakında burada stüdyo ekleme akışı olacak.",
};

export default function StudioNewPage() {
  return (
    <main className="bg-[var(--color-secondary)]">
      <Section containerClassName="max-w-3xl">
        <Card className="space-y-3 p-5">
          <h1 className="text-2xl font-semibold text-[var(--color-primary)]">Stüdyonu ekle</h1>
          <p className="text-sm text-[var(--color-muted)]">Coming next — stüdyo ekleme formu eklenecek. TODO: akışı bağla.</p>
        </Card>
      </Section>
    </main>
  );
}
