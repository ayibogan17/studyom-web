import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import OpenJamDetailClient from "./openjam-detail-client";

type PageProps = {
  params: { id: string } | Promise<{ id: string }>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const jam = await prisma.openJam.findUnique({ where: { id }, select: { title: true } });
  return { title: jam ? `${jam.title} | OpenJam` : "OpenJam" };
}

export default async function OpenJamDetailPage({ params }: PageProps) {
  const { id } = await params;
  const jam = await prisma.openJam.findUnique({
    where: { id },
    select: {
      id: true,
      title: true,
      note: true,
      genre: true,
      playlistLink: true,
      creatorLevel: true,
      createdByUserId: true,
      startAt: true,
      durationMinutes: true,
      neededInstruments: true,
      capacity: true,
      studio: {
        select: { name: true, city: true, district: true, address: true },
      },
      participants: {
        select: {
          id: true,
          instrument: true,
          level: true,
          status: true,
          user: { select: { id: true, name: true, fullName: true, image: true } },
        },
        orderBy: { createdAt: "asc" },
      },
    },
  });
  if (!jam) return notFound();

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#2a0a4d] via-[#4c1d95] to-[#7c3aed]">
      <OpenJamDetailClient jam={jam} />
    </div>
  );
}
