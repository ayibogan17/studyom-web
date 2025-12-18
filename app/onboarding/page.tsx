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
  description: "Hesabın oluşturuldu. Profiline devam et.",
};

export default async function OnboardingPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    redirect("/login");
  }

  const user = session.user as typeof session.user & { profileComplete?: boolean; city?: string | null; intent?: string[] };
  if (user.profileComplete && user.city && (user.intent?.length ?? 0) > 0) {
    redirect("/profile");
  }

  return (
    <main className="bg-[var(--color-secondary)]">
      <Section containerClassName="max-w-4xl space-y-6">
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wide text-[var(--color-muted)]">Hoş geldin</p>
          <h1 className="text-3xl font-semibold text-[var(--color-primary)]">Hesabın oluşturuldu</h1>
          <p className="text-sm text-[var(--color-muted)]">Hoş geldin. Devam etmek için profilini açabilirsin.</p>
        </div>
        <Card className="space-y-3 p-6">
          <p className="text-sm text-[var(--color-primary)]">Profiline giderek bilgilerini görebilir ve rolleri daha sonra ekleyebilirsin.</p>
          <div className="flex gap-3">
            <Button asChild>
              <Link href="/profile">Profilime git</Link>
            </Button>
            <Button asChild variant="secondary">
              <Link href="/studyo">Şimdilik geç</Link>
            </Button>
          </div>
        </Card>
      </Section>
    </main>
  );
}
