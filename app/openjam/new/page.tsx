import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/auth";
import { prisma } from "@/lib/prisma";
import OpenJamNewClient from "./openjam-new-client";

export const metadata: Metadata = {
  title: "Jam oluştur | OpenJam",
  description: "Yeni bir OpenJam oluştur.",
  robots: { index: false, follow: false },
};

export default async function OpenJamNewPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login?redirect=/openjam/new");

  const studios = await prisma.studio.findMany({
    where: { isActive: true, visibilityStatus: "published" },
    select: { id: true, name: true, city: true, district: true },
    orderBy: { name: "asc" },
    take: 200,
  });

  return (
    <div className="bg-gradient-to-br from-[#2a0a4d] via-[#4c1d95] to-[#7c3aed]">
      <OpenJamNewClient studios={studios} />
    </div>
  );
}
