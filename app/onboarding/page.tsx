import Link from "next/link";
import type { Metadata } from "next";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/auth";
import { prisma } from "@/lib/prisma";
import { Card } from "@/components/design-system/components/ui/card";
import { Section } from "@/components/design-system/components/shared/section";
import { Button } from "@/components/design-system/components/ui/button";
import { PhoneForm } from "./phone-form";

export const metadata: Metadata = {
  title: "Onboarding | Studyom",
  description: "Hesabın oluşturuldu. Profiline devam et.",
};

export default async function OnboardingPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    redirect("/login");
  }

  const sessionUser = session.user as typeof session.user & {
    id?: string;
    email?: string | null;
    profileComplete?: boolean;
    city?: string | null;
    intent?: string[];
  };
  const dbUser =
    sessionUser.id
      ? await prisma.user.findUnique({ where: { id: sessionUser.id } })
      : sessionUser.email
        ? await prisma.user.findUnique({ where: { email: sessionUser.email.toLowerCase() } })
        : null;
  const needsPhone = !dbUser?.phone;

  if (!needsPhone && sessionUser.profileComplete && sessionUser.city && (sessionUser.intent?.length ?? 0) > 0) {
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
        {needsPhone ? (
          <Card className="space-y-4 p-6">
            <p className="text-sm text-[var(--color-primary)]">
              Devam etmek için telefon numaranı eklemelisin. Bu bilgi zorunludur.
            </p>
            <PhoneForm />
          </Card>
        ) : (
          <Card className="space-y-3 p-6">
            <p className="text-sm text-[var(--color-primary)]">
              Profiline giderek bilgilerini görebilir ve rolleri daha sonra ekleyebilirsin.
            </p>
            <div className="flex gap-3">
              <Button asChild>
                <Link href="/profile">Profilime git</Link>
              </Button>
              <Button asChild variant="secondary">
                <Link href="/studyo">Şimdilik geç</Link>
              </Button>
            </div>
          </Card>
        )}
      </Section>
    </main>
  );
}
