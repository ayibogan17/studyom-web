import Link from "next/link";
import type { Metadata } from "next";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/auth";
import { Card } from "@/components/design-system/components/ui/card";
import { Section } from "@/components/design-system/components/shared/section";
import { Button } from "@/components/design-system/components/ui/button";

export const metadata: Metadata = {
  title: "Onboarding | Studyom",
  description: "Hesabın oluşturuldu. İstersen rol başvurularına devam et veya şimdilik geç.",
};

const actions = [
  { title: "Öğretmen Başvurusu", desc: "Ders vermek için başvur", href: "/apply/teacher" },
  { title: "Prodüktör / Teknisyen", desc: "Mix, mastering, prodüksiyon hizmetleri için", href: "/apply/producer" },
  { title: "Stüdyonu Ekle", desc: "Stüdyo sahipleri için hızlı ekleme", href: "/studio/new" },
  { title: "Şimdilik geç", desc: "Sonra karar ver", href: "/studyo" },
];

export default async function OnboardingPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    redirect("/login");
  }

  return (
    <main className="bg-[var(--color-secondary)]">
      <Section containerClassName="max-w-4xl space-y-6">
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wide text-[var(--color-muted)]">Hoş geldin</p>
          <h1 className="text-3xl font-semibold text-[var(--color-primary)]">Hesabın oluşturuldu</h1>
          <p className="text-sm text-[var(--color-muted)]">
            Studyom ders satmaz veya stüdyo ayarlamaz; sadece doğru kişileri tanıştırır. Aşağıdan isteğine göre devam et.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          {actions.map((action) => (
            <Card key={action.title} className="space-y-2 p-5">
              <p className="text-base font-semibold text-[var(--color-primary)]">{action.title}</p>
              <p className="text-sm text-[var(--color-muted)]">{action.desc}</p>
              <Button asChild size="sm">
                <Link href={action.href}>{action.title}</Link>
              </Button>
            </Card>
          ))}
        </div>
      </Section>
    </main>
  );
}
