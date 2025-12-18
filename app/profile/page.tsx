import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/auth";
import { prisma } from "@/lib/prisma";
import { ProfileClient } from "./profile-client";

export const metadata: Metadata = {
  title: "Profilim | Stüdyom",
  description: "Hesap kimliği, tercihlerin ve rollerinin özetini görüntüleyin.",
};

export default async function ProfilePage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    redirect("/login");
  }

  const sessionUser = session.user as typeof session.user & {
    id?: string;
    email?: string | null;
  };

  const dbUser =
    sessionUser.id
      ? await prisma.user.findUnique({ where: { id: sessionUser.id } })
      : sessionUser.email
        ? await prisma.user.findUnique({ where: { email: sessionUser.email.toLowerCase() } })
        : null;

  return (
    <ProfileClient
      user={{
        fullName: dbUser?.fullName || dbUser?.name || session.user.name || session.user.email || "",
        email: dbUser?.email || session.user.email || "",
        city: dbUser?.city || "",
        intent: dbUser?.intent || [],
        emailVerified: Boolean(dbUser?.emailVerified),
        createdAt: dbUser?.createdAt ?? null,
        roles: {
          teacher: dbUser?.isTeacher ? "pending" : "none",
          producer: dbUser?.isProducer ? "pending" : "none",
          studio: dbUser?.isStudioOwner ? "pending" : "none",
        },
      }}
    />
  );
}
