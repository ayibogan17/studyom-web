import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/auth";
import { prisma } from "@/lib/prisma";
import { Section } from "@/components/design-system/components/shared/section";
import { StudioOwnerThreadClient } from "./studio-thread-client";

export const metadata: Metadata = {
  title: "Rezervasyon İsteği | Studyom",
  description: "Stüdyona gelen mesajları görüntüleyin ve yanıtlayın.",
};

export default async function StudioMessageThreadPage({
  params,
}: {
  params: Promise<{ threadId: string }>;
}) {
  const { threadId } = await params;
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    redirect("/login");
  }

  const ownerEmail = session.user.email.toLowerCase();
  const thread = await prisma.studioThread.findUnique({
    where: { id: threadId },
    include: {
      studio: { select: { id: true, name: true, ownerEmail: true } },
      studentUser: { select: { fullName: true, name: true, email: true, image: true } },
      messages: { orderBy: { createdAt: "asc" } },
    },
  });

  if (!thread || thread.studio.ownerEmail.toLowerCase() !== ownerEmail) {
    notFound();
  }

  await prisma.studioMessage.updateMany({
    where: { threadId: thread.id, senderRole: "student", readAt: null },
    data: { readAt: new Date() },
  });

  const studentName = thread.studentUser.fullName || thread.studentUser.name || thread.studentUser.email || "Kullanıcı";
  const studentEmail = thread.studentUser.email ?? null;

  return (
    <main className="bg-[var(--color-secondary)] pb-16 pt-10">
      <Section containerClassName="max-w-4xl space-y-6">
        <header className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--color-muted)]">Stüdyo Paneli</p>
          <h1 className="text-3xl font-semibold text-[var(--color-primary)]">Rezervasyon isteği</h1>
          <p className="text-sm text-[var(--color-muted)]">
            {thread.studio.name} için {studentName} ile görüşüyorsun.
          </p>
          <div className="flex flex-wrap items-center gap-3 text-xs text-[var(--color-muted)]">
            {studentEmail ? <span>{studentEmail}</span> : null}
            <Link href="/dashboard?as=studio" className="text-[var(--color-accent)] hover:underline">
              Panele dön
            </Link>
          </div>
        </header>

        <StudioOwnerThreadClient
          threadId={thread.id}
          studioName={thread.studio.name}
          studentName={studentName}
          studentEmail={studentEmail}
          initialMessages={thread.messages.map((msg) => ({
            id: msg.id,
            body: msg.body,
            senderRole: msg.senderRole as "student" | "studio",
            createdAt: msg.createdAt.toISOString(),
          }))}
          locked={thread.locked}
        />
      </Section>
    </main>
  );
}
