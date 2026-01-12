import { prisma } from "@/lib/prisma";
import OpenJamMemoriesClient from "./openjam-memories-client";

export const metadata = {
  title: "Jam Hatıraları | Studyom",
  description: "Dolu jam’leri keşfedin.",
};

export const dynamic = "force-dynamic";

export default async function OpenJamMemoriesPage() {
  const memories = await prisma.openJamMemory.findMany({
    orderBy: { createdAt: "desc" },
    take: 50,
    select: {
      id: true,
      text: true,
      photoUrl: true,
      createdAt: true,
      jam: { select: { id: true, title: true, studio: { select: { name: true, district: true, city: true } } } },
      user: { select: { name: true, fullName: true, image: true } },
    },
  });

  const payload = memories.map((memory) => ({
    ...memory,
    createdAt: memory.createdAt.toISOString(),
  }));

  return <OpenJamMemoriesClient memories={payload} />;
}
