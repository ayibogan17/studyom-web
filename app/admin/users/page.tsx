import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin";
import { Section } from "@/components/design-system/components/shared/section";
import { Card } from "@/components/design-system/components/ui/card";
import UsersClient from "./users-client";

export const revalidate = 0;

export default async function AdminUsersPage() {
  await requireAdmin();
  const users = await prisma.user.findMany({
    orderBy: { createdAt: "desc" },
    take: 200,
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      city: true,
      fullName: true,
      intent: true,
      isDisabled: true,
      isTeacher: true,
      isProducer: true,
      isStudioOwner: true,
      emailVerified: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  return (
    <Section containerClassName="space-y-4">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold text-[var(--color-primary)]">Kullanıcılar</h1>
        <p className="text-sm text-[var(--color-muted)]">Rolleri ve hesap durumunu yönet.</p>
      </div>
      <Card className="p-4">
        <UsersClient users={users} />
      </Card>
    </Section>
  );
}
