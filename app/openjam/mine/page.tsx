import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/auth";
import { prisma } from "@/lib/prisma";
import OpenJamMineClient from "./openjam-mine-client";

export const metadata: Metadata = {
  title: "Jam'lerim | OpenJam",
  description: "Oluşturduğun ve katıldığın jam'ler.",
  robots: { index: false, follow: false },
};

export default async function OpenJamMinePage() {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as { id?: string } | undefined)?.id;
  if (!userId) redirect("/login?redirect=/openjam/mine");

  const jams = await prisma.openJam.findMany({
    where: {
      OR: [
        { createdByUserId: userId },
        { participants: { some: { userId } } },
      ],
    },
    orderBy: { startAt: "desc" },
    select: {
      id: true,
      title: true,
      note: true,
      genre: true,
      playlistLink: true,
      creatorLevel: true,
      startAt: true,
      durationMinutes: true,
      neededInstruments: true,
      capacity: true,
      createdByUser: { select: { name: true, fullName: true, image: true } },
      studio: { select: { name: true, city: true, district: true } },
      _count: { select: { participants: true } },
    },
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#2a0a4d] via-[#4c1d95] to-[#7c3aed]">
      <OpenJamMineClient jams={jams} />
    </div>
  );
}
