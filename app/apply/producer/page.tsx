import type { Metadata } from "next";
import { Section } from "@/components/design-system/components/shared/section";
import { Card } from "@/components/design-system/components/ui/card";

export const metadata: Metadata = {
  title: "Prodüktör / Teknisyen Başvurusu | Studyom",
  description: "Yakında burada prodüktör / teknisyen başvuru formu olacak.",
};

export default function ProducerApplyPage() {
  return (
    <main className="bg-[var(--color-secondary)]">
      <Section containerClassName="max-w-3xl">
        <Card className="space-y-3 p-5">
          <h1 className="text-2xl font-semibold text-[var(--color-primary)]">Prodüktör / Teknisyen</h1>
          <p className="text-sm text-[var(--color-muted)]">Coming next — başvuru formu eklenecek. TODO: formu bağla.</p>
        </Card>
      </Section>
    </main>
  );
}
