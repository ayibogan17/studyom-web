import type { Metadata } from "next";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/auth";
import { Section } from "@/components/design-system/components/shared/section";
import { Card } from "@/components/design-system/components/ui/card";
import { CompleteProfileForm } from "./profile-form";

export const metadata: Metadata = {
  title: "Profilini tamamla | Studyom",
  description: "Şehir ve kullanım tercihini ekleyerek hesabını tamamla.",
};

export default async function CompleteProfilePage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    redirect("/login");
  }

  const user = session.user as typeof session.user & {
    city?: string | null;
    intent?: string[];
    fullName?: string | null;
    profileComplete?: boolean;
  };
  if (user.city && (user.intent?.length ?? 0) > 0 && user.fullName) {
    redirect("/profile");
  }

  return (
    <main className="bg-[var(--color-secondary)] pb-16 pt-10">
      <Section containerClassName="max-w-3xl space-y-6">
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--color-muted)]">
            Profilini tamamla
          </p>
          <h1 className="text-3xl font-semibold text-[var(--color-primary)]">Şehir ve tercihini ekle</h1>
          <p className="text-sm text-[var(--color-muted)]">
            Google ile giriş yaptıysan, hesabını kişiselleştirmek için şehir ve kullanım tercihini tamamla.
          </p>
        </div>
        <Card className="p-6">
          <CompleteProfileForm
            defaultFullName={user.fullName || user.name || ""}
            defaultCity={user.city || ""}
            defaultIntent={user.intent || []}
          />
        </Card>
      </Section>
    </main>
  );
}
