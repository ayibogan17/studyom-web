import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { unstable_cache } from "next/cache";
import { authOptions } from "@/auth";
import { prisma } from "@/lib/prisma";
import { ProfileClient } from "./profile-client";

export const metadata: Metadata = {
  title: "Profilim | Studyom",
  description: "Hesap kimliği, tercihlerin ve rollerinin özetini görüntüleyin.",
  robots: { index: false, follow: false },
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

  const userId = dbUser?.id;
  const userEmail = (dbUser?.email ?? sessionUser.email)?.toLowerCase() ?? null;
  const [teacherApp, producerApp, googleAccount, studioCount, studioActiveCount] =
    userId && userEmail
      ? await getProfileStats(userId, userEmail)
      : [null, null, null, 0, 0];

  const mapStatus = (status?: string | null) => {
    if (status === "approved") return "approved" as const;
    if (status === "pending") return "pending" as const;
    return "none" as const;
  };
  const teacherStatus = teacherApp ? mapStatus(teacherApp.status) : dbUser?.isTeacher ? "pending" : "none";
  const producerStatus = producerApp ? mapStatus(producerApp.status) : dbUser?.isProducer ? "pending" : "none";

  return (
    <ProfileClient
      user={{
        fullName: dbUser?.fullName || dbUser?.name || session.user.name || session.user.email || "",
        email: dbUser?.email || session.user.email || "",
        phone: dbUser?.phone || "",
        city: dbUser?.city || "",
        intent: dbUser?.intent || [],
        emailVerified: Boolean(dbUser?.emailVerified) || Boolean(googleAccount),
        createdAt: dbUser?.createdAt ?? null,
        image: dbUser?.image ?? null,
        roles: {
          teacher: teacherStatus,
          producer: producerStatus,
          studio:
            studioActiveCount > 0
              ? "approved"
              : studioCount > 0 || dbUser?.isStudioOwner
                ? "pending"
                : "none",
        },
      }}
    />
  );
}

const getProfileStats = unstable_cache(
  async (userId: string, userEmail: string) => {
    const [teacherApp, producerApp, googleAccount, studioCount, studioActiveCount] =
      await prisma.$transaction([
        prisma.teacherApplication.findFirst({
          where: { userId },
          orderBy: { createdAt: "desc" },
          select: { status: true },
        }),
        prisma.producerApplication.findFirst({
          where: { userId },
          orderBy: { createdAt: "desc" },
          select: { status: true },
        }),
        prisma.account.findFirst({
          where: { userId, provider: "google" },
          select: { id: true },
        }),
        prisma.studio.count({
          where: { ownerEmail: { equals: userEmail, mode: "insensitive" } },
        }),
        prisma.studio.count({
          where: { ownerEmail: { equals: userEmail, mode: "insensitive" }, isActive: true },
        }),
      ]);
    return [teacherApp, producerApp, googleAccount, studioCount, studioActiveCount] as const;
  },
  ["profile-stats"],
  { revalidate: 60 },
);
