import type { Metadata } from "next";
import { getServerSession } from "next-auth";
import { authOptions } from "@/auth";
import { prisma } from "@/lib/prisma";
import OpenJamClient from "./openjam-client";

export const metadata: Metadata = {
  title: "OpenJam | Studyom",
  description: "OpenJam ile stüdyonu seç, ekibini kur, çalmaya başla.",
};

export default async function OpenJamPage() {
  const session = await getServerSession(authOptions);
  const sessionUser = session?.user as { id?: string; email?: string | null } | undefined;
  const dbUser =
    sessionUser?.id
      ? await prisma.user.findUnique({ where: { id: sessionUser.id }, select: { city: true } })
      : sessionUser?.email
        ? await prisma.user.findUnique({
            where: { email: sessionUser.email.toLowerCase() },
            select: { city: true },
          })
        : null;
  const defaultCity = dbUser?.city ?? "İstanbul";

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#2a0a4d] via-[#4c1d95] to-[#7c3aed]">
      <OpenJamClient defaultCity={defaultCity} />
    </div>
  );
}
