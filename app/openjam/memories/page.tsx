import { unstable_cache } from "next/cache";
import { prisma } from "@/lib/prisma";
import OpenJamMemoriesClient from "./openjam-memories-client";

export const metadata = {
  title: "Jam Hatıraları | Studyom",
  description: "Dolu jam’leri keşfedin.",
};

export const revalidate = 300;

const getMemories = unstable_cache(
  async () =>
    prisma.openJamMemory.findMany({
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
    }),
  ["openjam-memories"],
  { revalidate: 300 },
);

export default async function OpenJamMemoriesPage() {
  const memories = await getMemories();

  const payload = memories.map((memory) => ({
    ...memory,
    createdAt: memory.createdAt.toISOString(),
  }));

  return <OpenJamMemoriesClient memories={payload} />;
}
